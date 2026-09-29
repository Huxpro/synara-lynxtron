import { describe, expect, it } from "@rstest/core";

import { NATIVE_EVENT_STREAM_CHANNELS, nativeEventStreamChannel } from "./nativeEventStreams.logic";

describe("native event streams", () => {
  it("maps each long-lived stream to its own renderer channel", () => {
    expect(nativeEventStreamChannel("server.subscribeSettings")).toBe(
      "synara:server-settings-event",
    );
    expect(nativeEventStreamChannel("terminal.subscribeEvents")).toBe("synara:terminal-event");
    expect(nativeEventStreamChannel("git.runStackedAction")).toBeNull();
    expect(nativeEventStreamChannel("toString")).toBeNull();
    expect(new Set(Object.values(NATIVE_EVENT_STREAM_CHANNELS)).size).toBe(
      Object.keys(NATIVE_EVENT_STREAM_CHANNELS).length,
    );
  });
});
