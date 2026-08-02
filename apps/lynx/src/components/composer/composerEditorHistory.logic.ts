export interface ComposerEditorHistorySnapshot<Context> {
  readonly context: Context;
  readonly selectionEnd: number;
  readonly selectionStart: number;
  readonly value: string;
}

export interface ComposerEditorHistoryState<Context> {
  readonly redo: ReadonlyArray<ComposerEditorHistorySnapshot<Context>>;
  readonly undo: ReadonlyArray<ComposerEditorHistorySnapshot<Context>>;
}

export function createComposerEditorHistory<Context>(): ComposerEditorHistoryState<Context> {
  return { undo: [], redo: [] };
}

export function pushComposerEditorHistory<Context>(input: {
  readonly limit?: number;
  readonly snapshot: ComposerEditorHistorySnapshot<Context>;
  readonly state: ComposerEditorHistoryState<Context>;
}): ComposerEditorHistoryState<Context> {
  const limit = Math.max(1, input.limit ?? 100);
  return {
    undo: [...input.state.undo, input.snapshot].slice(-limit),
    redo: [],
  };
}

export function undoComposerEditorHistory<Context>(input: {
  readonly current: ComposerEditorHistorySnapshot<Context>;
  readonly state: ComposerEditorHistoryState<Context>;
}): {
  readonly snapshot: ComposerEditorHistorySnapshot<Context> | null;
  readonly state: ComposerEditorHistoryState<Context>;
} {
  const snapshot = input.state.undo[input.state.undo.length - 1] ?? null;
  if (!snapshot) return { snapshot: null, state: input.state };
  return {
    snapshot,
    state: {
      undo: input.state.undo.slice(0, -1),
      redo: [...input.state.redo, input.current],
    },
  };
}

export function redoComposerEditorHistory<Context>(input: {
  readonly current: ComposerEditorHistorySnapshot<Context>;
  readonly state: ComposerEditorHistoryState<Context>;
}): {
  readonly snapshot: ComposerEditorHistorySnapshot<Context> | null;
  readonly state: ComposerEditorHistoryState<Context>;
} {
  const snapshot = input.state.redo[input.state.redo.length - 1] ?? null;
  if (!snapshot) return { snapshot: null, state: input.state };
  return {
    snapshot,
    state: {
      undo: [...input.state.undo, input.current],
      redo: input.state.redo.slice(0, -1),
    },
  };
}
