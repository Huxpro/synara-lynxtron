export interface ComposerNativeEditorSnapshot {
  readonly isComposing: boolean;
  readonly selectionEnd: number;
  readonly selectionStart: number;
  readonly value: string;
}

type NativeEditorValueResult = Partial<ComposerNativeEditorSnapshot> & {
  readonly selectionBegin?: unknown;
};

function selectionOffset(value: string, candidate: unknown): number {
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
    return value.length;
  }
  return Math.max(0, Math.min(value.length, Math.floor(candidate)));
}

export function normalizeComposerNativeEditorSnapshot(
  candidate: NativeEditorValueResult | null | undefined,
): ComposerNativeEditorSnapshot | null {
  if (!candidate || typeof candidate.value !== "string") return null;
  const selectionStart = selectionOffset(
    candidate.value,
    candidate.selectionStart ?? candidate.selectionBegin,
  );
  return {
    value: candidate.value,
    selectionStart,
    selectionEnd: Math.max(
      selectionStart,
      selectionOffset(candidate.value, candidate.selectionEnd),
    ),
    isComposing: candidate.isComposing === true,
  };
}

export function selectAllComposerNativeEditor(
  snapshot: ComposerNativeEditorSnapshot,
): ComposerNativeEditorSnapshot {
  return {
    ...snapshot,
    selectionStart: 0,
    selectionEnd: snapshot.value.length,
    isComposing: false,
  };
}

export function selectedComposerNativeEditorText(snapshot: ComposerNativeEditorSnapshot): string {
  return snapshot.value.slice(snapshot.selectionStart, snapshot.selectionEnd);
}

export function cutComposerNativeEditorSelection(
  snapshot: ComposerNativeEditorSnapshot,
): ComposerNativeEditorSnapshot {
  const value = `${snapshot.value.slice(
    0,
    snapshot.selectionStart,
  )}${snapshot.value.slice(snapshot.selectionEnd)}`;
  return {
    value,
    selectionStart: snapshot.selectionStart,
    selectionEnd: snapshot.selectionStart,
    isComposing: false,
  };
}
