import { describe, expect, it } from "vitest";

import { buildComposerProjectPickerFooterModel } from "./ComposerProjectPicker.logic";

describe("ComposerProjectPickerComposition", () => {
  it("owns deterministic loading copy and disables the busy add action", () => {
    const model = buildComposerProjectPickerFooterModel({
      addActionLabel: "Adding project...",
      addActionBusy: true,
      resetActionLabel: "Don't work in a project",
    });

    expect(model).toEqual({
      actions: [
        { kind: "add", label: "Adding project...", disabled: true },
        {
          kind: "reset",
          label: "Don't work in a project",
          disabled: false,
        },
      ],
      errorMessage: null,
    });
  });

  it("shows error and retry anatomy only when a retry intent exists", () => {
    const withoutRetry = buildComposerProjectPickerFooterModel({
      addActionLabel: "New project",
      resetActionLabel: "Don't work in a project",
      errorMessage: "Unable to load folders.",
    });
    const withRetry = buildComposerProjectPickerFooterModel({
      addActionLabel: "New project",
      resetActionLabel: "Don't work in a project",
      errorMessage: "Unable to load folders.",
      retryVisible: true,
    });
    const retrying = buildComposerProjectPickerFooterModel({
      addActionLabel: "New project",
      resetActionLabel: "Don't work in a project",
      errorMessage: "Unable to load folders.",
      retryVisible: true,
      retryActionLabel: "Retrying…",
      retryActionBusy: true,
    });

    expect(withoutRetry.errorMessage).toBe("Unable to load folders.");
    expect(withoutRetry.actions.map((action) => action.kind)).toEqual([
      "add",
      "reset",
    ]);
    expect(withRetry.actions.at(-1)).toEqual({
      kind: "retry",
      label: "Retry",
      disabled: false,
    });
    expect(retrying.actions.at(-1)).toEqual({
      kind: "retry",
      label: "Retrying…",
      disabled: true,
    });
  });
});
