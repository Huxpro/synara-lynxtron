// Long-lived Synara RPC streams the desktop host relays to the renderer as
// global events, one channel per stream. Their items are delivered as they
// arrive instead of being buffered into the RPC reply.
export const NATIVE_EVENT_STREAM_CHANNELS = Object.freeze({
  "terminal.subscribeEvents": "synara:terminal-event",
  "orchestration.subscribeShell": "synara:orchestration-shell-event",
  "server.subscribeSettings": "synara:server-settings-event",
} as const);

export type NativeEventStreamTag = keyof typeof NATIVE_EVENT_STREAM_CHANNELS;

export function nativeEventStreamChannel(tag: string): string | null {
  return Object.hasOwn(NATIVE_EVENT_STREAM_CHANNELS, tag)
    ? NATIVE_EVENT_STREAM_CHANNELS[tag as NativeEventStreamTag]
    : null;
}

/**
 * Request-scoped stream relay used by the shared `WsTransport` compat class
 * (`adapters/wsTransport.lynx.ts`). The renderer picks a `streamId`, the host
 * runs the RPC stream and publishes every item as one global event carrying
 * that id, and the bridge reply settles when the stream ends. The renderer can
 * end it early with `synaraRpcStreamCancel`, which the host turns into an
 * Effect RPC `Interrupt` frame. Unlike the fixed channel table above, this lets
 * one bridge method carry any stream tag, including per-thread subscriptions.
 */
export const NATIVE_RPC_STREAM_ITEM_EVENT = "synara:rpc-stream-item";
export const NATIVE_RPC_STREAM_CANCEL_METHOD = "synaraRpcStreamCancel";
/**
 * Renderer-generation handshake. The host and its socket survive a LynxView
 * reload while the renderer loses every handler, so a new renderer first asks
 * for a generation: the host cancels every scoped stream of earlier
 * generations and only accepts opens/cancels whose stream id carries the
 * current one. The reply also seeds the renderer's transport state.
 */
export const NATIVE_RPC_STREAM_RESET_METHOD = "synaraRpcStreamReset";
export const NATIVE_TRANSPORT_STATE_EVENT = "synara:transport-state";

export interface NativeRpcStreamResetReply {
  readonly generation: number;
  readonly transportState: string;
}

export function scopedStreamId(generation: number, key: string, sequence: number): string {
  return `g${generation}:${key}#${sequence}`;
}

/** The generation a scoped stream id was minted for, or null for a foreign id. */
export function scopedStreamGeneration(streamId: string): number | null {
  const match = /^g(\d+):/.exec(streamId);
  return match ? Number(match[1]) : null;
}

export interface NativeRpcStreamItemEvent {
  readonly streamId: string;
  readonly item: unknown;
}

export function isNativeRpcStreamItemEvent(value: unknown): value is NativeRpcStreamItemEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "streamId" in value &&
    typeof (value as { readonly streamId?: unknown }).streamId === "string" &&
    "item" in value
  );
}
