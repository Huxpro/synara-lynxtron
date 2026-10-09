import { describe, expect, it } from "@rstest/core";

import {
  describeRpcFailureCause,
  parseRpcFailureReply,
  readRpcFailureDetails,
  rpcFailureReplyFields,
} from "./rpcFailure.logic";

describe("RPC failure details across the host relay", () => {
  it("reads the typed error out of an encoded Effect cause", () => {
    expect(
      describeRpcFailureCause([
        { _tag: "Interrupt", fiberId: 1 },
        {
          _tag: "Fail",
          error: {
            _tag: "WsStreamAdmissionError",
            code: "THREAD_STREAM_CAPACITY_EXCEEDED",
            retryAfterMs: 400,
            retryable: true,
          },
        },
      ]),
    ).toEqual({ code: "THREAD_STREAM_CAPACITY_EXCEEDED", retryAfterMs: 400, retryable: true });
    expect(
      describeRpcFailureCause({
        _tag: "Sequential",
        left: { _tag: "Die", defect: "boom" },
        right: { _tag: "Fail", error: { code: "THREAD_SNAPSHOT_NOT_FOUND" } },
      }),
    ).toEqual({ code: "THREAD_SNAPSHOT_NOT_FOUND", retryAfterMs: null, retryable: null });
  });

  it("yields null for defects, interrupts and untyped failures", () => {
    expect(describeRpcFailureCause([{ _tag: "Die", defect: { code: "X" } }])).toBeNull();
    expect(describeRpcFailureCause([{ _tag: "Fail", error: "plain" }])).toBeNull();
    expect(describeRpcFailureCause([{ _tag: "Fail", error: { message: "no code" } }])).toBeNull();
    expect(describeRpcFailureCause(undefined)).toBeNull();
  });

  it("round-trips through the bridge reply fields", () => {
    const error = Object.assign(new Error("Synara RPC x failed"), {
      rpcFailure: { code: "STREAM_DUPLICATE_SUBSCRIPTION", retryAfterMs: null, retryable: false },
    });
    const reply = { error: error.message, errorKind: "rpc", ...rpcFailureReplyFields(error) };
    expect(parseRpcFailureReply(JSON.parse(JSON.stringify(reply)))).toEqual(
      readRpcFailureDetails(error),
    );
    expect(rpcFailureReplyFields(new Error("transport"))).toEqual({});
    expect(parseRpcFailureReply({ error: "transport", errorKind: "transport" })).toBeNull();
  });
});
