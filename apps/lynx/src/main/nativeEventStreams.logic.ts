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
