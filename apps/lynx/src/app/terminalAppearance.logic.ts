import { normalizeAppearanceNumber } from "@synara-web/components/settings/SettingsAppearanceComposition.logic";
import { TERMINAL_FONT_WEIGHT } from "@synara/shared/terminalThreads";

const DEFAULT_LYNX_TERMINAL_FONT_FAMILY = '"SFMono-Regular", ui-monospace, monospace';

export function resolveLynxTerminalTypography(input: {
  readonly fontFamily: string;
  readonly fontSizePx: number;
}): {
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly fontWeight: `${typeof TERMINAL_FONT_WEIGHT}`;
  readonly lineHeight: string;
} {
  const fontSizePx = normalizeAppearanceNumber("terminalFontSizePx", input.fontSizePx);
  return {
    fontFamily: input.fontFamily.trim() || DEFAULT_LYNX_TERMINAL_FONT_FAMILY,
    fontSize: `${fontSizePx}px`,
    fontWeight: `${TERMINAL_FONT_WEIGHT}` as const,
    lineHeight: `${fontSizePx * 1.5}px`,
  };
}
