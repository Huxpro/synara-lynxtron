import { shouldCollapsePastedText } from "@synara-web/lib/composerPastedText";

export type ComposerInputTransition =
  | {
      readonly kind: "prompt";
      readonly prompt: string;
      readonly selectionEnd: number;
      readonly selectionStart: number;
    }
  | {
      readonly kind: "collapsed-paste";
      readonly pastedText: string;
      readonly prompt: string;
      readonly selectionEnd: number;
      readonly selectionStart: number;
    };

function clampSelectionOffset(value: string, offset: number): number {
  if (!Number.isFinite(offset)) return value.length;
  return Math.max(0, Math.min(value.length, Math.floor(offset)));
}

function normalizeSelection(input: {
  readonly value: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}): { readonly selectionStart: number; readonly selectionEnd: number } {
  const selectionStart = clampSelectionOffset(input.value, input.selectionStart);
  return {
    selectionStart,
    selectionEnd: Math.max(selectionStart, clampSelectionOffset(input.value, input.selectionEnd)),
  };
}

function mapOffsetAfterRemoval(offset: number, removalStart: number, removalEnd: number): number {
  if (offset <= removalStart) return offset;
  if (offset >= removalEnd) return offset - (removalEnd - removalStart);
  return removalStart;
}

export function resolveComposerInputTransition(input: {
  readonly isComposing?: boolean;
  readonly previousPrompt: string;
  readonly nextPrompt: string;
  readonly selectionEnd: number;
  readonly selectionStart: number;
}): ComposerInputTransition {
  const selection = normalizeSelection({
    value: input.nextPrompt,
    selectionStart: input.selectionStart,
    selectionEnd: input.selectionEnd,
  });
  if (input.previousPrompt === input.nextPrompt) {
    return { kind: "prompt", prompt: input.nextPrompt, ...selection };
  }

  let prefixLength = 0;
  const sharedPrefixLimit = Math.min(input.previousPrompt.length, input.nextPrompt.length);
  while (
    prefixLength < sharedPrefixLimit &&
    input.previousPrompt[prefixLength] === input.nextPrompt[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  const previousSuffixLimit = input.previousPrompt.length - prefixLength;
  const nextSuffixLimit = input.nextPrompt.length - prefixLength;
  while (
    suffixLength < previousSuffixLimit &&
    suffixLength < nextSuffixLimit &&
    input.previousPrompt[input.previousPrompt.length - suffixLength - 1] ===
      input.nextPrompt[input.nextPrompt.length - suffixLength - 1]
  ) {
    suffixLength += 1;
  }

  const insertedEnd =
    suffixLength === 0 ? input.nextPrompt.length : input.nextPrompt.length - suffixLength;
  const insertedText = input.nextPrompt.slice(prefixLength, insertedEnd);
  if (input.isComposing || !shouldCollapsePastedText(insertedText)) {
    return { kind: "prompt", prompt: input.nextPrompt, ...selection };
  }

  const prompt = input.nextPrompt.slice(0, prefixLength) + input.nextPrompt.slice(insertedEnd);
  const collapsedSelection = normalizeSelection({
    value: prompt,
    selectionStart: mapOffsetAfterRemoval(selection.selectionStart, prefixLength, insertedEnd),
    selectionEnd: mapOffsetAfterRemoval(selection.selectionEnd, prefixLength, insertedEnd),
  });

  return {
    kind: "collapsed-paste",
    pastedText: insertedText,
    prompt,
    ...collapsedSelection,
  };
}
