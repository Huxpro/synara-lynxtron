import { describe, expect, it } from "@rstest/core";

import { consumeComposerNativeValueAck } from "./composerNativeValueAck.logic";

const skillTrigger = {
  kind: "skill" as const,
  query: "review-agent",
  rangeStart: 0,
  rangeEnd: 13,
};

describe("Native Composer value ACK", () => {
  it("restores the caller-owned trigger for a matching programmatic value", () => {
    expect(
      consumeComposerNativeValueAck({
        eventValue: "$review-agent",
        pending: {
          value: "$review-agent",
          triggerAfterAck: skillTrigger,
        },
      }),
    ).toEqual({ matched: true, triggerAfterAck: skillTrigger });
  });

  it("keeps the explicit close disposition for ordinary programmatic values", () => {
    expect(
      consumeComposerNativeValueAck({
        eventValue: "/review-agent ",
        pending: {
          value: "/review-agent ",
          triggerAfterAck: null,
        },
      }),
    ).toEqual({ matched: true, triggerAfterAck: null });
  });

  it("does not consume a real input value that differs from the pending ACK", () => {
    expect(
      consumeComposerNativeValueAck({
        eventValue: "$review-agents",
        pending: {
          value: "$review-agent",
          triggerAfterAck: skillTrigger,
        },
      }),
    ).toEqual({ matched: false, triggerAfterAck: null });
  });
});
