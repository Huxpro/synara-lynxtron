// FILE: chatFontSize.ts
// Purpose: Side-effect-free chat font-size bounds and normalization.
// Layer: shared settings vocabulary
//
// Split out of `appSettings.ts` so non-Web targets (and pure typography helpers
// such as `components/chat/chatTypography.ts`) can derive transcript geometry
// without pulling in that module's load-time side effects — local-storage
// hydration, server-settings react-query wiring and native API access, which
// leave the Lynx page blank. `appSettings.ts` re-exports these, so every
// existing Web import is unchanged.

export const MIN_CHAT_FONT_SIZE_PX = 11;
export const MAX_CHAT_FONT_SIZE_PX = 18;
export const DEFAULT_CHAT_FONT_SIZE_PX = 13;

export function normalizeChatFontSizePx(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_CHAT_FONT_SIZE_PX;
  }

  return Math.min(MAX_CHAT_FONT_SIZE_PX, Math.max(MIN_CHAT_FONT_SIZE_PX, Math.round(value)));
}
