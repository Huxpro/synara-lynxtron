import { normalizeChatFontSizePx } from "@synara-web/chatFontSize";

export const SLICE_TYPOGRAPHY_CLASS_PREFIX = "SliceRoot--font";

/**
 * Lynx does not apply custom properties set inline, so the web typography
 * variables (var(--app-font-size-*)) come from one generated class per base size
 * (src/generated/native-typography-variables.css).
 */
export function sliceTypographyClassName(chatFontSizePx: unknown): string {
  const size = normalizeChatFontSizePx(typeof chatFontSizePx === "number" ? chatFontSizePx : null);
  return `${SLICE_TYPOGRAPHY_CLASS_PREFIX}-${size}`;
}
