import { describe, expect, it } from "@rstest/core";

import { unwrapTerminalBridgeResult } from "./terminal";

describe("terminal bridge result", () => {
  it("unwraps the desktop NativeRpcResult envelope", () => {
    const snapshot = { history: "prompt", status: "running" } as const;

    expect(
      unwrapTerminalBridgeResult({
        _tag: "NativeRpcResult",
        value: snapshot,
      }),
    ).toBe(snapshot);
  });

  it("preserves the direct Web host result", () => {
    const snapshot = { history: "prompt", status: "running" } as const;

    expect(unwrapTerminalBridgeResult(snapshot)).toBe(snapshot);
  });
});
