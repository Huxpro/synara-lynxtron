const COMPOSER_EDITOR_HORIZONTAL_CHROME_PX = 68;

export function resolveNativeComposerMaxLines(input: {
  readonly availableWidthPx: number | null | undefined;
  readonly chatFontSizePx: number;
  readonly text: string;
}): number {
  const availableWidthPx =
    Number.isFinite(input.availableWidthPx) && (input.availableWidthPx ?? 0) > 0
      ? input.availableWidthPx!
      : 736;
  const textWidthPx = Math.max(1, availableWidthPx - COMPOSER_EDITOR_HORIZONTAL_CHROME_PX);
  const estimatedCharacterWidthPx = Math.max(1, input.chatFontSizePx * 0.5);
  const explicitLines = input.text.split("\n");
  const wrappedLineCount = explicitLines.reduce(
    (total, line) =>
      total + Math.max(1, Math.ceil((line.length * estimatedCharacterWidthPx) / textWidthPx)),
    0,
  );
  return Math.min(6, Math.max(2, wrappedLineCount));
}
