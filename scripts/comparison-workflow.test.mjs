import { describe, expect, it } from "vitest";

import { nativeTargetMatches } from "./comparison-workflow.mjs";

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
