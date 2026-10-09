import { describe, expect, it } from "@rstest/core";

import { decodeBridgeRpcData } from "./bridgeRpcPayload";

describe("bridge RPC payload", () => {
  it("restores explicit nulls the bridge would have dropped", () => {
    const payload = { type: "thread.fork.create", worktreePath: null, branch: "main" };
    expect(
      decodeBridgeRpcData({
        tag: "orchestration.dispatchCommand",
        payloadJson: JSON.stringify(payload),
      }),
    ).toEqual({ tag: "orchestration.dispatchCommand", payload });
  });

  it("leaves calls without a JSON payload untouched", () => {
    const data = { tag: "server.getSettings", payload: { a: 1 } };
    expect(decodeBridgeRpcData(data)).toBe(data);
  });
});
