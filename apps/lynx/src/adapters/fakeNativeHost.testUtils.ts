// Test double for the Lynxtron host as the renderer sees it: `NativeModules.bridge`
// request/reply plus the `GlobalEventEmitter` the host publishes stream items and
// transport state on. Shared by the transport compat and NativeApi facade tests.
// Scoped-stream ownership goes through the real host registry so the fake
// behaves like both hosts for generations and cancel-before-open; stream
// opens can be held pending (`holdStreamOpens`) so those races are not masked.

import { rs } from "@rstest/core";

import {
  NATIVE_RPC_STREAM_CANCEL_METHOD,
  NATIVE_RPC_STREAM_ITEM_EVENT,
  NATIVE_RPC_STREAM_RESET_METHOD,
  NATIVE_TRANSPORT_STATE_EVENT,
} from "../main/nativeEventStreams.logic";
import { createScopedStreamRegistry } from "../main/scopedStreamRegistry.logic";

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

/** Return this from `rpc` to leave the request unanswered. */
export const HOLD_REPLY: unique symbol = Symbol("hold-reply");

type GlobalEventListener = (...args: unknown[]) => void;

function reply(callback: (reply: string) => void, value: unknown): void {
  queueMicrotask(() => callback(JSON.stringify(value)));
}

export interface FakeNativeHost {
  readonly calls: FakeBridgeCall[];
  /** Streams the host has opened (after any held connection was released). */
  readonly streams: Map<string, FakeOpenStream>;
  readonly cancelledStreamIds: string[];
  readonly generation: number;
  /** Entries the host registry still owns (opened or pending). */
  readonly registrySize: number;
  transportState: string;
  readonly callsNamed: (name: string) => FakeBridgeCall[];
  readonly pushStreamItem: (streamId: string, item: unknown) => void;
  readonly setTransportState: (state: string) => void;
  readonly emitGlobal: (event: string, ...args: unknown[]) => void;
  readonly listenerCount: (event: string) => number;
  /** Hold every subsequent stream open before its "connection"; returns the release. */
  readonly holdStreamOpens: () => () => void;
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
  const registry = createScopedStreamRegistry();
  let hold: { readonly released: Promise<void>; readonly release: () => void } | null = null;
  const emit = (event: string, ...args: unknown[]) => {
    for (const listener of Array.from(listeners.get(event) ?? [])) listener(...args);
  };

  const host: FakeNativeHost = {
    calls,
    streams,
    cancelledStreamIds,
    get generation() {
      return registry.generation;
    },
    get registrySize() {
      return registry.size;
    },
    transportState: "connected",
    callsNamed: (name) => calls.filter((call) => call.name === name),
    pushStreamItem: (streamId, item) => emit(NATIVE_RPC_STREAM_ITEM_EVENT, { streamId, item }),
    setTransportState: (state) => {
      host.transportState = state;
      emit(NATIVE_TRANSPORT_STATE_EVENT, state);
    },
    emitGlobal: emit,
    listenerCount: (event) => listeners.get(event)?.size ?? 0,
    holdStreamOpens: () => {
      let release: () => void = () => undefined;
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      hold = { released, release };
      return () => {
        hold = null;
        release();
      };
    },
  };

  rs.stubGlobal("NativeModules", {
    bridge: {
      call: (name: string, params: Record<string, unknown>, callback: (reply: string) => void) => {
        calls.push({ name, params });
        if (name === "synaraRpc") {
          const value = options.rpc?.(String(params.tag), params.payload) ?? {};
          if (value === HOLD_REPLY) return;
          reply(callback, { _tag: "NativeRpcResult", value });
          return;
        }
        if (name === "synaraRpcStream") {
          const streamId = String(params.streamId);
          const pendingConnection = hold?.released ?? Promise.resolve();
          registry
            .run(streamId, (isCancelled) => {
              let settleOpen: ((value?: unknown) => void) | null = null;
              let failOpen: ((error: Error) => void) | null = null;
              const settled = pendingConnection.then(() => {
                if (isCancelled()) return;
                return new Promise<void>((resolve, reject) => {
                  settleOpen = () => resolve();
                  failOpen = reject;
                  streams.set(streamId, {
                    streamId,
                    tag: String(params.tag),
                    payload: params.payload,
                    settle: (value = null) => {
                      if (!streams.delete(streamId)) return;
                      settleOpen?.(value);
                    },
                    fail: (message, errorKind = "transport") => {
                      if (!streams.delete(streamId)) return;
                      failOpen?.(Object.assign(new Error(message), { errorKind }));
                    },
                  });
                });
              });
              return {
                settled,
                cancel: () => {
                  if (streams.delete(streamId)) settleOpen?.(null);
                },
              };
            })
            .then(
              (value) => reply(callback, { _tag: "NativeRpcResult", value: value ?? null }),
              (error: Error & { errorKind?: string }) =>
                reply(callback, {
                  error: error.message,
                  errorKind: error.errorKind ?? "transport",
                }),
            );
          return;
        }
        if (name === NATIVE_RPC_STREAM_CANCEL_METHOD) {
          const streamId = String(params.streamId);
          cancelledStreamIds.push(streamId);
          reply(callback, { cancelled: registry.cancel(streamId) });
          return;
        }
        if (name === NATIVE_RPC_STREAM_RESET_METHOD) {
          reply(callback, { generation: registry.reset(), transportState: host.transportState });
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

  return host;
}

/** Resolves after pending microtasks and the fake bridge replies have run. */
export async function flushHost(rounds = 8): Promise<void> {
  for (let index = 0; index < rounds; index += 1) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}
