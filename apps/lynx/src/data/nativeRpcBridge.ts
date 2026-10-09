// Synara RPC over the Lynxtron host relay: the host process owns the feature
// WebSocket (`main/desktop/nativeRpcHost.ts`, `main/web/web-host.ts`) and the
// renderer reaches it through `NativeModules.bridge`. This module is
// thread-neutral at module scope so shared Web modules can import it on both
// Lynx threads; every host call is a `'background only'` function.

import {
  NATIVE_EVENT_STREAM_CHANNELS,
  NATIVE_RPC_STREAM_CANCEL_METHOD,
  NATIVE_RPC_STREAM_ITEM_EVENT,
  NATIVE_RPC_STREAM_RESET_METHOD,
  NATIVE_TRANSPORT_STATE_EVENT,
  isNativeRpcStreamItemEvent,
  type NativeRpcStreamResetReply,
} from "../main/nativeEventStreams.logic";
import type { RpcTransportState } from "./rpcTransport.logic";

export type NativeRpcErrorKind = "rpc" | "transport";

/**
 * `errorKind` mirrors the host reply: `rpc` is a typed server failure for a
 * request that reached the server; `transport` means the host relay could not
 * reach it (socket closed, offline cool-down, timeout).
 */
export class NativeRpcError extends Error {
  readonly name: "SynaraRpcResponseError" | "RpcTransportError";

  constructor(
    message: string,
    readonly errorKind: NativeRpcErrorKind,
  ) {
    super(message);
    this.name = errorKind === "rpc" ? "SynaraRpcResponseError" : "RpcTransportError";
  }
}

export function isNativeTransportError(error: unknown): boolean {
  return error instanceof Error && error.name === "RpcTransportError";
}

export function hostBridgeRequest<A>(method: string, params: Record<string, unknown>): Promise<A> {
  "background only";
  return new Promise((resolve, reject) => {
    try {
      NativeModules.bridge.call(method, params, (reply: unknown) => {
        try {
          const parsed = typeof reply === "string" ? JSON.parse(reply) : reply;
          if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
            reject(
              new NativeRpcError(
                String(parsed.error),
                "errorKind" in parsed && parsed.errorKind === "rpc" ? "rpc" : "transport",
              ),
            );
            return;
          }
          if (
            parsed &&
            typeof parsed === "object" &&
            "_tag" in parsed &&
            parsed._tag === "NativeRpcResult" &&
            "value" in parsed
          ) {
            resolve(parsed.value as A);
            return;
          }
          resolve(parsed as A);
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function nativeRpcRequest<A>(
  tag: string,
  payload: unknown,
  options: { readonly timeoutMs?: number | null } = {},
): Promise<A> {
  "background only";
  return hostBridgeRequest<A>("synaraRpc", {
    tag,
    payload,
    // `null` disables the host watchdog, a number replaces it, `undefined`
    // keeps the host default.
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
  });
}

/** Renderer-generation handshake; see `NATIVE_RPC_STREAM_RESET_METHOD`. */
export function nativeRpcResetStreams(): Promise<NativeRpcStreamResetReply> {
  "background only";
  return hostBridgeRequest<Partial<NativeRpcStreamResetReply> | null>(
    NATIVE_RPC_STREAM_RESET_METHOD,
    {},
  ).then((reply) => {
    if (typeof reply?.generation !== "number") {
      throw new NativeRpcError("Host did not acknowledge the stream generation.", "transport");
    }
    return {
      generation: reply.generation,
      transportState: typeof reply.transportState === "string" ? reply.transportState : "idle",
    };
  });
}

/**
 * Request-scoped stream (see `NATIVE_RPC_STREAM_ITEM_EVENT`): resolves when
 * the stream ends, rejects on a host/transport failure.
 */
export function nativeRpcOpenStream(
  streamId: string,
  tag: string,
  payload: unknown,
): Promise<void> {
  "background only";
  return hostBridgeRequest<unknown>("synaraRpcStream", { streamId, tag, payload }).then(
    () => undefined,
  );
}

export function nativeRpcCancelStream(streamId: string): Promise<boolean> {
  "background only";
  return hostBridgeRequest<{ readonly cancelled?: boolean }>(NATIVE_RPC_STREAM_CANCEL_METHOD, {
    streamId,
  }).then((reply) => reply?.cancelled === true);
}

/** Subscribe to the host's scoped stream items; returns the unsubscribe. */
export async function subscribeNativeRpcStreamItems(
  listener: (streamId: string, item: unknown) => void,
): Promise<() => void> {
  "background only";
  const { onGlobalEvent } = await import(/* webpackMode: "eager" */ "../platform/bridge");
  return onGlobalEvent(NATIVE_RPC_STREAM_ITEM_EVENT, (event: unknown) => {
    if (isNativeRpcStreamItemEvent(event)) listener(event.streamId, event.item);
  });
}

/**
 * Terminal events as the host already broadcasts them for the legacy
 * `terminal.subscribeEvents` relay stream (`NATIVE_EVENT_STREAM_CHANNELS`).
 * The server admits one `terminal.events` stream per socket, so the shared
 * facade must not open a second one while the legacy consumers
 * (`ThreadTerminal`, `TaskCompletionToastHost`) still hold it; this seam goes
 * away when they move to `api.terminal.onEvent`.
 */
export async function subscribeNativeTerminalEvents(
  listener: (event: unknown) => void,
): Promise<() => void> {
  "background only";
  const { onGlobalEvent } = await import(/* webpackMode: "eager" */ "../platform/bridge");
  return onGlobalEvent(NATIVE_EVENT_STREAM_CHANNELS["terminal.subscribeEvents"], listener);
}

const HOST_TRANSPORT_STATES: ReadonlySet<string> = new Set([
  "idle",
  "connecting",
  "connected",
  "reconnecting",
  "offline",
]);

export function isHostTransportState(value: unknown): value is RpcTransportState {
  return typeof value === "string" && HOST_TRANSPORT_STATES.has(value);
}

/** Subscribe to the host relay's socket state; returns the unsubscribe. */
export async function subscribeNativeTransportState(
  listener: (state: RpcTransportState) => void,
): Promise<() => void> {
  "background only";
  const { onGlobalEvent } = await import(/* webpackMode: "eager" */ "../platform/bridge");
  return onGlobalEvent(NATIVE_TRANSPORT_STATE_EVENT, (state: unknown) => {
    if (isHostTransportState(state)) listener(state);
  });
}
