import { describe, expect, it } from "@rstest/core";

import {
  createComposerEditorHistory,
  pushComposerEditorHistory,
  redoComposerEditorHistory,
  undoComposerEditorHistory,
} from "./composerEditorHistory.logic";

const snapshot = (value: string) => ({
  value,
  selectionStart: value.length,
  selectionEnd: value.length,
  context: { pastedTextIds: value ? [value] : [] },
});

describe("native composer editor history", () => {
  it("undoes and redoes the complete editor snapshot", () => {
    const recorded = pushComposerEditorHistory({
      state: createComposerEditorHistory(),
      snapshot: snapshot("before"),
    });
    const undone = undoComposerEditorHistory({
      state: recorded,
      current: snapshot("after"),
    });
    expect(undone.snapshot).toEqual(snapshot("before"));
    const redone = redoComposerEditorHistory({
      state: undone.state,
      current: snapshot("before"),
    });
    expect(redone.snapshot).toEqual(snapshot("after"));
  });

  it("clears redo when a new edit is recorded", () => {
    const recorded = pushComposerEditorHistory({
      state: createComposerEditorHistory(),
      snapshot: snapshot("first"),
    });
    const undone = undoComposerEditorHistory({
      state: recorded,
      current: snapshot("second"),
    });
    const branched = pushComposerEditorHistory({
      state: undone.state,
      snapshot: snapshot("branch"),
    });
    expect(branched.redo).toEqual([]);
  });

  it("keeps only the configured number of undo entries", () => {
    let state = createComposerEditorHistory<{ pastedTextIds: string[] }>();
    for (const value of ["one", "two", "three"]) {
      state = pushComposerEditorHistory({
        state,
        snapshot: snapshot(value),
        limit: 2,
      });
    }
    expect(state.undo.map((entry) => entry.value)).toEqual(["two", "three"]);
  });
});
