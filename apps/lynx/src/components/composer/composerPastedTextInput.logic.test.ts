import { describe, expect, it } from "@rstest/core";

import { resolveComposerInputTransition } from "./composerPastedTextInput.logic";

describe("composer pasted-text input transition", () => {
  it("keeps normal typing in the native editor", () => {
    expect(
      resolveComposerInputTransition({
        previousPrompt: "hello",
        nextPrompt: "hello world",
        selectionStart: 11,
        selectionEnd: 11,
      }),
    ).toEqual({
      kind: "prompt",
      prompt: "hello world",
      selectionStart: 11,
      selectionEnd: 11,
    });
  });

  it("collapses one oversized insertion while preserving surrounding text", () => {
    const pastedText = Array.from({ length: 25 }, (_, index) => `line ${index}`).join("\n");
    expect(
      resolveComposerInputTransition({
        previousPrompt: "before after",
        nextPrompt: `before ${pastedText}after`,
        selectionStart: 7 + pastedText.length,
        selectionEnd: 7 + pastedText.length,
      }),
    ).toEqual({
      kind: "collapsed-paste",
      pastedText,
      prompt: "before after",
      selectionStart: 7,
      selectionEnd: 7,
    });
  });

  it("maps a selection around a collapsed paste back into the editable prompt", () => {
    const pastedText = "x".repeat(4001);
    expect(
      resolveComposerInputTransition({
        previousPrompt: "left right",
        nextPrompt: `left ${pastedText}right`,
        selectionStart: 5,
        selectionEnd: 6 + pastedText.length,
      }),
    ).toEqual({
      kind: "collapsed-paste",
      pastedText,
      prompt: "left right",
      selectionStart: 5,
      selectionEnd: 6,
    });
  });

  it("never classifies an active IME composition as a pasted-text attachment", () => {
    const composingText = "中".repeat(4001);
    expect(
      resolveComposerInputTransition({
        previousPrompt: "",
        nextPrompt: composingText,
        selectionStart: composingText.length,
        selectionEnd: composingText.length,
        isComposing: true,
      }),
    ).toEqual({
      kind: "prompt",
      prompt: composingText,
      selectionStart: composingText.length,
      selectionEnd: composingText.length,
    });
  });

  it("does not collapse a large prompt assembled through small edits", () => {
    const previousPrompt = "x".repeat(3999);
    const nextPrompt = `${previousPrompt}x`;
    expect(
      resolveComposerInputTransition({
        previousPrompt,
        nextPrompt,
        selectionStart: nextPrompt.length,
        selectionEnd: nextPrompt.length,
      }),
    ).toEqual({
      kind: "prompt",
      prompt: nextPrompt,
      selectionStart: nextPrompt.length,
      selectionEnd: nextPrompt.length,
    });
  });
});
