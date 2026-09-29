import { describe, expect, it } from "@rstest/core";

import { resolveControlledInputValue } from "./controlledInputEcho.logic";

describe("controlled native input echoes", () => {
  it("skips a stale echo instead of rewinding text typed after it", () => {
    // Typed "a", "ab", "abc"; the owner has only rendered "ab" so far.
    expect(resolveControlledInputValue(["a", "ab", "abc"], "ab")).toEqual({
      apply: false,
      pendingEchoes: ["abc"],
    });
  });

  it("applies a value the field did not emit (reset, filter, programmatic change)", () => {
    expect(resolveControlledInputValue(["a", "ab"], "")).toEqual({
      apply: true,
      pendingEchoes: [],
    });
    expect(resolveControlledInputValue([], "initial")).toEqual({
      apply: true,
      pendingEchoes: [],
    });
  });
});
