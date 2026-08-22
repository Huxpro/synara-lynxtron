import { describe, expect, it } from "vitest";

import {
  normalizeDesktopWsUrl,
  resolveDesktopBackendAuthToken,
  resolveDesktopWsUrlFromEnv,
} from "./desktopWsBridge";

describe("desktopWsBridge", () => {
  it("normalizes non-empty WebSocket URL strings", () => {
    expect(normalizeDesktopWsUrl(" ws://127.0.0.1:1234/?token=test ")).toBe(
      "ws://127.0.0.1:1234/?token=test",
    );
  });

  it("rejects empty or non-string values", () => {
    expect(normalizeDesktopWsUrl("   ")).toBeNull();
    expect(normalizeDesktopWsUrl(null)).toBeNull();
  });

  it("reads only the canonical Synara desktop URL environment value", () => {
    expect(
      resolveDesktopWsUrlFromEnv({
        SYNARA_DESKTOP_WS_URL: "ws://127.0.0.1:6000/?token=synara",
        UNRELATED_DESKTOP_WS_URL: "ws://127.0.0.1:5000/?token=ignored",
      }),
    ).toBe("ws://127.0.0.1:6000/?token=synara");
    expect(
      resolveDesktopWsUrlFromEnv({
        UNRELATED_DESKTOP_WS_URL: "ws://127.0.0.1:5000/?token=ignored",
      }),
    ).toBeNull();
  });

  it("uses an explicit comparison auth token and otherwise generates one", () => {
    expect(
      resolveDesktopBackendAuthToken(
        { SYNARA_DESKTOP_AUTH_TOKEN: " fixed-comparison-token " },
        () => "generated-token",
      ),
    ).toBe("fixed-comparison-token");
    expect(resolveDesktopBackendAuthToken({}, () => "generated-token")).toBe("generated-token");
  });
});
