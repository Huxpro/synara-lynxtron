export const DEFAULT_CHAT_COMPOSER_PLACEHOLDER =
  "Ask anything, @tag files/folders, or use / to show available commands";

const COMPOSER_EDITOR_HORIZONTAL_CHROME_PX = 68;
const COMPOSER_EDITOR_LINE_HEIGHT_PX = 19.5;

export function resolveEmptyComposerEditorMinHeightPx(input: {
  readonly availableWidthPx: number | null | undefined;
  readonly chatFontSizePx: number;
  readonly placeholder?: string;
}): number {
  const placeholder = input.placeholder ?? DEFAULT_CHAT_COMPOSER_PLACEHOLDER;
  const availableWidthPx =
    Number.isFinite(input.availableWidthPx) && (input.availableWidthPx ?? 0) > 0
      ? input.availableWidthPx!
      : 736;
  const textWidthPx = Math.max(1, availableWidthPx - COMPOSER_EDITOR_HORIZONTAL_CHROME_PX);
  const estimatedCharacterWidthPx = Math.max(1, input.chatFontSizePx * 0.5);
  const lineCount = Math.min(
    6,
    Math.max(2, Math.ceil((placeholder.length * estimatedCharacterWidthPx) / textWidthPx)),
  );
  return lineCount * COMPOSER_EDITOR_LINE_HEIGHT_PX;
}
