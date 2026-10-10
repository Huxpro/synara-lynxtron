import { describe, expect, it } from "@rstest/core";

import { isRelayPendingStream, summarizeRelayPendingRequests } from "./webRelayDiagnostics.logic";

describe("web relay diagnostics", () => {
  it("separates settled unary traffic from a healthy long-lived stream", () => {
    expect(
      summarizeRelayPendingRequests([{ tag: "terminal.subscribeEvents", streaming: true }]),
    ).toEqual({
      pendingRequests: 1,
      pendingRequestTags: ["terminal.subscribeEvents"],
      pendingUnaryRequests: 0,
      pendingUnaryTags: [],
      activeStreamRequests: 1,
      activeStreamTags: ["terminal.subscribeEvents"],
    });
  });

  it("preserves all pending tags while identifying unfinished unary requests", () => {
    expect(
      summarizeRelayPendingRequests([
        { tag: "terminal.subscribeEvents", streaming: true },
        { tag: "server.listExternalMcpIntegrations", streaming: false },
        { tag: "orchestration.getSidebarShellSnapshot", streaming: false },
      ]),
    ).toEqual({
      pendingRequests: 3,
      pendingRequestTags: [
        "terminal.subscribeEvents",
        "server.listExternalMcpIntegrations",
        "orchestration.getSidebarShellSnapshot",
      ],
      pendingUnaryRequests: 2,
      pendingUnaryTags: [
        "server.listExternalMcpIntegrations",
        "orchestration.getSidebarShellSnapshot",
      ],
      activeStreamRequests: 1,
      activeStreamTags: ["terminal.subscribeEvents"],
    });
  });

  it("counts a scoped stream (items relayed by stream id) as a stream, not a unary request", () => {
    expect(isRelayPendingStream({ onItem: () => {} })).toBe(true);
    expect(isRelayPendingStream({ chunks: [] })).toBe(true);
    expect(isRelayPendingStream({})).toBe(false);
  });
});
