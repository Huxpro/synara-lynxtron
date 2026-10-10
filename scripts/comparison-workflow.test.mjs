import { describe, expect, it } from "vitest";

import { nativeTargetMatches, sendWithReadRetry } from "./comparison-workflow.mjs";

const node = {
  attributes: [
    "class",
    "ComposerCommandRowLynx ComposerCommandRowLynx--active",
    "aria-label",
    "math.ts",
    "data-thread-id",
    "thread-1",
  ],
};

describe("comparison workflow targets", () => {
  it("matches Native nodes by label, attribute and class tokens", () => {
    expect(nativeTargetMatches(node, { label: "math.ts" })).toBe(true);
    expect(nativeTargetMatches(node, { label: /^math\.ts$/ })).toBe(true);
    expect(nativeTargetMatches(node, { label: /^math\.test\.ts$/ })).toBe(false);
    expect(nativeTargetMatches(node, { attribute: ["data-thread-id", "thread-1"] })).toBe(true);
    expect(nativeTargetMatches(node, { attribute: ["data-thread-id", "thread-2"] })).toBe(false);
    expect(nativeTargetMatches(node, { className: ".ComposerCommandRowLynx--active" })).toBe(true);
    expect(nativeTargetMatches({ attributes: [] }, { label: "math.ts" })).toBe(false);
    const text = {
      nodeName: "TEXT",
      attributes: [],
      children: [{ attributes: ["text", "Explorer"] }],
    };
    expect(nativeTargetMatches(text, { text: "Explorer" })).toBe(true);
    expect(nativeTargetMatches(text, { text: "Diff" })).toBe(false);
  });
});

describe("Native DevTool requests", () => {
  const lostReply = () => new Error("No response found for clientId: localhost:8901");
  const failing = (failures, error = lostReply) => {
    let calls = 0;
    const sendOnce = async () => {
      calls += 1;
      if (calls <= failures) throw error();
      return { calls };
    };
    return { sendOnce, calls: () => calls };
  };

  it("asks again for a tree or box whose reply was lost", async () => {
    const request = failing(2);
    expect(await sendWithReadRetry(request.sendOnce, "DOM.getBoxModel", { delayMs: 0 })).toEqual({
      calls: 3,
    });
    const exhausted = failing(3);
    await expect(
      sendWithReadRetry(exhausted.sendOnce, "DOM.getDocument", { delayMs: 0 }),
    ).rejects.toThrow("No response found");
    expect(exhausted.calls()).toBe(3);
  });

  it("never resends input or evaluation, and never hides another error", async () => {
    for (const method of [
      "Input.emulateTouchFromMouseEvent",
      "Input.insertText",
      "Runtime.evaluate",
    ]) {
      const request = failing(1);
      await expect(sendWithReadRetry(request.sendOnce, method, { delayMs: 0 })).rejects.toThrow(
        "No response found",
      );
      expect(request.calls()).toBe(1);
    }
    const other = failing(1, () => new Error("Session closed"));
    await expect(
      sendWithReadRetry(other.sendOnce, "DOM.getDocument", { delayMs: 0 }),
    ).rejects.toThrow("Session closed");
    expect(other.calls()).toBe(1);
  });
});
