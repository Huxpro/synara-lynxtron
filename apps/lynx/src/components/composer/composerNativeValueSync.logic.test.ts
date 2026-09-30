import { describe, expect, it } from "@rstest/core";

import { shouldPushDraftProjectionToNativeEditor } from "./composerNativeValueSync.logic";

describe("Native Composer value sync", () => {
  it("does not echo a value the editor reported through bindinput", () => {
    expect(
      shouldPushDraftProjectionToNativeEditor({
        renderedDisplayText: "He",
        latestDisplayText: "He",
        appliedDisplayText: "He",
        nativeEditorValue: "He",
      }),
    ).toBe(false);
  });

  it("does not push a stale render over newer fast typing", () => {
    // "H" rendered, but "He" was typed before the effect ran: pushing "H"
    // would drop the "e" the host textarea already shows.
    expect(
      shouldPushDraftProjectionToNativeEditor({
        renderedDisplayText: "H",
        latestDisplayText: "He",
        appliedDisplayText: "He",
        nativeEditorValue: "He",
      }),
    ).toBe(false);
  });

  it("pushes drafts changed outside the editor", () => {
    expect(
      shouldPushDraftProjectionToNativeEditor({
        renderedDisplayText: "voice transcript",
        latestDisplayText: "voice transcript",
        appliedDisplayText: "",
        nativeEditorValue: "",
      }),
    ).toBe(true);
  });

  it("pushes when the draft store normalized the typed value", () => {
    expect(
      shouldPushDraftProjectionToNativeEditor({
        renderedDisplayText: "@thread ",
        latestDisplayText: "@thread ",
        appliedDisplayText: "@thr",
        nativeEditorValue: "@thr",
      }),
    ).toBe(true);
  });

  it("forces a push after the applied value is reset for a new draft", () => {
    expect(
      shouldPushDraftProjectionToNativeEditor({
        renderedDisplayText: "other draft",
        latestDisplayText: "other draft",
        appliedDisplayText: null,
        nativeEditorValue: "other draft",
      }),
    ).toBe(true);
  });
});
