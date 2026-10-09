// Test double for the Lynxtron host as the renderer sees it: `NativeModules.bridge`
// request/reply plus the `GlobalEventEmitter` the host publishes stream items and
// transport state on. Shared by the transport compat and NativeApi facade tests.

import { rs } from "@rstest/core";

import {
  NATIVE_RPC_STREAM_CANCEL_METHOD,
  NATIVE_RPC_STREAM_ITEM_EVENT,
  NATIVE_TRANSPORT_STATE_EVENT,
} from "../main/nativeEventStreams.logic";

export interface FakeBridgeCall {
  readonly name: string;
  readonly params: Record<string, unknown>;
}

export interface FakeOpenStream {
  readonly streamId: string;
  readonly tag: string;
  readonly payload: unknown;
  readonly settle: (value?: unknown) => void;
  readonly fail: (message: string, errorKind?: "rpc" | "transport") => void;
}

type GlobalEventListener = (...args: unknown[]) => void;

function reply(callback: (reply: string) => void, value: unknown): void {
  queueMicrotask(() => callback(JSON.stringify(value)));
}

export interface FakeNativeHost {
  readonly calls: FakeBridgeCall[];
  readonly streams: Map<string, FakeOpenStream>;
  readonly cancelledStreamIds: string[];
  readonly callsNamed: (name: string) => FakeBridgeCall[];
  readonly pushStreamItem: (streamId: string, item: unknown) => void;
  readonly setTransportState: (state: string) => void;
  readonly emitGlobal: (event: string, ...args: unknown[]) => void;
  readonly listenerCount: (event: string) => number;
}

export function installFakeNativeHost(
  options: {
    readonly rpc?: (tag: string, payload: unknown) => unknown;
    readonly bridge?: Record<string, (params: Record<string, unknown>) => unknown>;
  } = {},
): FakeNativeHost {
  const calls: FakeBridgeCall[] = [];
  const streams = new Map<string, FakeOpenStream>();
  const cancelledStreamIds: string[] = [];
  const listeners = new Map<string, Set<GlobalEventListener>>();
  const emit = (event: string, ...args: unknown[]) => {
    for (const listener of Array.from(listeners.get(event) ?? [])) listener(...args);
  };

  rs.stubGlobal("NativeModules", {
    bridge: {
      call: (name: string, params: Record<string, unknown>, callback: (reply: string) => void) => {
        calls.push({ name, params });
        if (name === "synaraRpc") {
          const value = options.rpc?.(String(params.tag), params.payload) ?? {};
          reply(callback, { _tag: "NativeRpcResult", value });
          return;
        }
        if (name === "synaraRpcStream") {
          const streamId = String(params.streamId);
          const stream: FakeOpenStream = {
            streamId,
            tag: String(params.tag),
            payload: params.payload,
            settle: (value = null) => {
              if (streams.get(streamId) !== stream) return;
              streams.delete(streamId);
              reply(callback, { _tag: "NativeRpcResult", value });
            },
            fail: (message, errorKind = "transport") => {
              if (streams.get(streamId) !== stream) return;
              streams.delete(streamId);
              reply(callback, { error: message, errorKind });
            },
          };
          streams.set(streamId, stream);
          return;
        }
        if (name === NATIVE_RPC_STREAM_CANCEL_METHOD) {
          const streamId = String(params.streamId);
          cancelledStreamIds.push(streamId);
          const stream = streams.get(streamId);
          stream?.settle(null);
          reply(callback, { cancelled: stream !== undefined });
          return;
        }
        const handler = options.bridge?.[name];
        reply(callback, handler ? handler(params) : {});
      },
    },
  });
  rs.stubGlobal("lynx", {
    __initData: {},
    getJSModule: (name: string) => {
      if (name !== "GlobalEventEmitter") throw new Error(`unexpected JS module ${name}`);
      return {
        addListener: (event: string, listener: GlobalEventListener, context?: unknown) => {
          const bound = context ? (listener.bind(context) as GlobalEventListener) : listener;
          // Keep the original reference so removeListener works for bound callbacks.
          (bound as { __original?: GlobalEventListener }).__original = listener;
          const entries = listeners.get(event) ?? new Set();
          entries.add(bound);
          listeners.set(event, entries);
        },
        removeListener: (event: string, listener: GlobalEventListener) => {
          const entries = listeners.get(event);
          if (!entries) return;
          for (const entry of entries) {
            if (
              entry === listener ||
              (entry as { __original?: GlobalEventListener }).__original === listener
            ) {
              entries.delete(entry);
            }
          }
        },
      };
    },
  });

  return {
    calls,
    streams,
    cancelledStreamIds,
    callsNamed: (name) => calls.filter((call) => call.name === name),
    pushStreamItem: (streamId, item) => emit(NATIVE_RPC_STREAM_ITEM_EVENT, { streamId, item }),
    setTransportState: (state) => emit(NATIVE_TRANSPORT_STATE_EVENT, state),
    emitGlobal: emit,
    listenerCount: (event) => listeners.get(event)?.size ?? 0,
  };
}

/** Resolves after pending microtasks and the fake bridge replies have run. */
export async function flushHost(rounds = 8): Promise<void> {
  for (let index = 0; index < rounds; index += 1) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}
