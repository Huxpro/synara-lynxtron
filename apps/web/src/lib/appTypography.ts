import {
  DEFAULT_CHAT_FONT_SIZE_PX,
  MAX_CHAT_FONT_SIZE_PX,
  MIN_CHAT_FONT_SIZE_PX,
  normalizeChatFontSizePx,
} from "../chatFontSize";

export interface AppTypographyScale {
  basePx: number;
  uiPx: number;
  uiLgPx: number;
  uiSmPx: number;
  uiXsPx: number;
  ui2XsPx: number;
  uiMetaPx: number;
  uiTimestampPx: number;
  chatPx: number;
  chatCodePx: number;
  chatMetaPx: number;
  chatTinyPx: number;
}

function clampTypographyPx(value: number, min: number, max = MAX_CHAT_FONT_SIZE_PX + 2): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function getAppTypographyScale(
  baseFontSizePx = DEFAULT_CHAT_FONT_SIZE_PX,
): AppTypographyScale {
  const basePx = normalizeChatFontSizePx(baseFontSizePx);

  return {
    basePx,
    uiPx: basePx,
    uiLgPx: clampTypographyPx(basePx * 1.08, basePx),
    uiSmPx: clampTypographyPx(basePx * 0.92, 10),
    uiXsPx: clampTypographyPx(basePx * 0.84, 10),
    ui2XsPx: clampTypographyPx(basePx * 0.76, 9),
    uiMetaPx: clampTypographyPx(basePx * 0.84, 10),
    uiTimestampPx: clampTypographyPx(basePx * 0.72, 8),
    chatPx: basePx,
    chatCodePx: clampTypographyPx(basePx * 0.95, 10),
    chatMetaPx: clampTypographyPx(basePx * 0.72, 8),
    chatTinyPx: clampTypographyPx(basePx * 0.66, 8),
  };
}

/**
 * The typography CSS variables every surface sizes its text from. The web app
 * sets them on the document root; the Lynx app sets them on its root view.
 */
export function appTypographyCssVariables(
  baseFontSizePx: number,
  terminalFontSizePx: number,
): Record<string, string> {
  const scale = getAppTypographyScale(baseFontSizePx);
  return {
    "--app-font-size-base": `${scale.basePx}px`,
    "--app-font-size-ui": `${scale.uiPx}px`,
    "--app-font-size-ui-lg": `${scale.uiLgPx}px`,
    "--app-font-size-ui-sm": `${scale.uiSmPx}px`,
    "--app-font-size-ui-xs": `${scale.uiXsPx}px`,
    "--app-font-size-ui-2xs": `${scale.ui2XsPx}px`,
    "--app-font-size-ui-meta": `${scale.uiMetaPx}px`,
    "--app-font-size-ui-timestamp": `${scale.uiTimestampPx}px`,
    "--app-font-size-chat": `${scale.chatPx}px`,
    "--app-font-size-chat-code": `${scale.chatCodePx}px`,
    "--app-font-size-chat-meta": `${scale.chatMetaPx}px`,
    "--app-font-size-chat-tiny": `${scale.chatTinyPx}px`,
    "--app-font-size-terminal": `${terminalFontSizePx}px`,
  };
}

/**
 * One class per base size (min–max) carrying the typography variables, for hosts
 * that cannot set custom properties inline (Lynx): `${prefix}-<size> { … }`.
 * The terminal size is a separate setting and is left to its own consumer.
 */
export function buildAppTypographyClassesCss(prefix: string): string {
  const blocks: string[] = [];
  for (let size = MIN_CHAT_FONT_SIZE_PX; size <= MAX_CHAT_FONT_SIZE_PX; size += 1) {
    const declarations = Object.entries(appTypographyCssVariables(size, 0))
      .filter(([name]) => name !== "--app-font-size-terminal")
      .map(([name, value]) => `  ${name}: ${value};`)
      .join("\n");
    blocks.push(`${prefix}-${size} {\n${declarations}\n}`);
  }
  return `${blocks.join("\n\n")}\n`;
}
