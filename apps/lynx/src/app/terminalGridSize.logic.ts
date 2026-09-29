import {
  TERMINAL_MAX_COLS,
  TERMINAL_MAX_ROWS,
  TERMINAL_MIN_COLS,
  TERMINAL_MIN_ROWS,
} from "@synara/contracts";
import { normalizeAppearanceNumber } from "@synara-web/components/settings/SettingsAppearanceComposition.logic";

// Match Electron/xterm's measured right-dock viewport: 12px content inset on
// the leading/top edges, plus a 20px scrollbar gutter and 14px bottom inset.
export const TERMINAL_HORIZONTAL_PADDING_PX = 44;
export const TERMINAL_VERTICAL_PADDING_PX = 26;
export const MONOSPACE_CELL_WIDTH_RATIO = 0.6;
export const TERMINAL_LINE_HEIGHT_RATIO = 1.5;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
export interface LynxTerminalGridSize {
  readonly cols: number;
  readonly rows: number;
}
export interface LynxTerminalCellMetrics {
  readonly cellWidth: number;
  readonly lineHeight: number;
}

export function resolveLynxTerminalCellMetrics(fontSizePx: number): LynxTerminalCellMetrics {
  const normalizedFontSize = normalizeAppearanceNumber("terminalFontSizePx", fontSizePx);
  return {
    cellWidth: normalizedFontSize * MONOSPACE_CELL_WIDTH_RATIO,
    lineHeight: normalizedFontSize * TERMINAL_LINE_HEIGHT_RATIO,
  };
}

export function resolveLynxTerminalGridSize(input: {
  readonly fontSizePx: number;
  readonly height: number;
  readonly width: number;
}): LynxTerminalGridSize | null {
  if (
    !Number.isFinite(input.height) ||
    !Number.isFinite(input.width) ||
    input.fontSizePx <= 0 ||
    input.height <= TERMINAL_VERTICAL_PADDING_PX ||
    input.width <= TERMINAL_HORIZONTAL_PADDING_PX
  ) {
    return null;
  }
  const { cellWidth, lineHeight } = resolveLynxTerminalCellMetrics(input.fontSizePx);
  return {
    cols: clamp(
      Math.floor((input.width - TERMINAL_HORIZONTAL_PADDING_PX) / cellWidth),
      TERMINAL_MIN_COLS,
      TERMINAL_MAX_COLS,
    ),
    rows: clamp(
      Math.floor((input.height - TERMINAL_VERTICAL_PADDING_PX) / lineHeight),
      TERMINAL_MIN_ROWS,
      TERMINAL_MAX_ROWS,
    ),
  };
}
