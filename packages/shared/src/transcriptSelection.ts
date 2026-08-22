const NON_BREAKING_SPACE_PATTERN = /\u00a0/g;
const WHITESPACE_PATTERN = /\s/;
const INLINE_MARKDOWN_DELIMITER_CHARS = new Set(["*", "_", "`", "~"]);

interface NormalizedSourceText {
  text: string;
  rawStarts: number[];
  rawEnds: number[];
}

function normalizeSelectionText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(NON_BREAKING_SPACE_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNormalizedSourceText(
  value: string,
  options: { ignoreInlineMarkdownDelimiters?: boolean | undefined } = {},
): NormalizedSourceText {
  const text: string[] = [];
  const rawStarts: number[] = [];
  const rawEnds: number[] = [];
  let pendingSpaceStart: number | null = null;
  let pendingSpaceEnd = 0;

  const pushPendingSpace = () => {
    if (pendingSpaceStart === null) return;
    text.push(" ");
    rawStarts.push(pendingSpaceStart);
    rawEnds.push(pendingSpaceEnd);
    pendingSpaceStart = null;
    pendingSpaceEnd = 0;
  };

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index] ?? "";
    if (options.ignoreInlineMarkdownDelimiters && INLINE_MARKDOWN_DELIMITER_CHARS.has(char)) {
      continue;
    }
    if (char === "\u00a0" || WHITESPACE_PATTERN.test(char)) {
      pendingSpaceStart ??= index;
      pendingSpaceEnd = index + 1;
      continue;
    }
    pushPendingSpace();
    text.push(char);
    rawStarts.push(index);
    rawEnds.push(index + 1);
  }
  pushPendingSpace();

  return { text: text.join(""), rawStarts, rawEnds };
}

function resolveNormalizedTranscriptMarkerRange(input: {
  messageText: string;
  selectedText: string;
  ignoreInlineMarkdownDelimiters?: boolean;
}): { startOffset: number; endOffset: number } | null {
  const selectedText = normalizeSelectionText(input.selectedText);
  if (selectedText.length === 0) return null;

  const source = buildNormalizedSourceText(input.messageText, {
    ignoreInlineMarkdownDelimiters: input.ignoreInlineMarkdownDelimiters,
  });
  const firstIndex = source.text.indexOf(selectedText);
  if (firstIndex < 0 || source.text.indexOf(selectedText, firstIndex + selectedText.length) >= 0) {
    return null;
  }

  const lastIndex = firstIndex + selectedText.length - 1;
  const startOffset = source.rawStarts[firstIndex];
  const endOffset = source.rawEnds[lastIndex];
  return startOffset === undefined || endOffset === undefined ? null : { startOffset, endOffset };
}

export function resolveTranscriptMarkerRange(input: {
  messageText: string;
  selectedText: string;
}): { startOffset: number; endOffset: number } | null {
  const selectedText = input.selectedText.trim();
  if (selectedText.length === 0) return null;

  const firstIndex = input.messageText.indexOf(selectedText);
  if (
    firstIndex >= 0 &&
    input.messageText.indexOf(selectedText, firstIndex + selectedText.length) < 0
  ) {
    return {
      startOffset: firstIndex,
      endOffset: firstIndex + selectedText.length,
    };
  }
  return (
    resolveNormalizedTranscriptMarkerRange(input) ??
    resolveNormalizedTranscriptMarkerRange({
      ...input,
      ignoreInlineMarkdownDelimiters: true,
    })
  );
}
