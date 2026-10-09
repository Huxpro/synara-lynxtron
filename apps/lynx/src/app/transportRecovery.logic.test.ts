import { describe, expect, it } from "@rstest/core";

import {
  noticeStateForWsTransportState,
  shouldRefetchAfterTransportRecovery,
} from "./transportRecovery.logic";

describe("transport recovery", () => {
  it("refetches after a reconnect or offline interval", () => {
    expect(shouldRefetchAfterTransportRecovery("reconnecting", "connected")).toBe(true);
    expect(shouldRefetchAfterTransportRecovery("offline", "connected")).toBe(true);
  });

  it("does not refetch on initial connection or unrelated transitions", () => {
    expect(shouldRefetchAfterTransportRecovery("idle", "connected")).toBe(false);
    expect(shouldRefetchAfterTransportRecovery("connected", "connected")).toBe(false);
    expect(shouldRefetchAfterTransportRecovery("connected", "reconnecting")).toBe(false);
  });

  it("reads the shared transport state as the notice state", () => {
    // The first connection attempt is not a reconnect.
    expect(noticeStateForWsTransportState("connecting", false)).toBe("idle");
    expect(noticeStateForWsTransportState("open", true)).toBe("connected");
    expect(noticeStateForWsTransportState("connecting", true)).toBe("reconnecting");
    expect(noticeStateForWsTransportState("closed", false)).toBe("offline");
    expect(noticeStateForWsTransportState("closed", true)).toBe("offline");
    expect(noticeStateForWsTransportState("disposed", true)).toBe("idle");
    expect(noticeStateForWsTransportState("incompatible", true)).toBe("idle");
  });
});
