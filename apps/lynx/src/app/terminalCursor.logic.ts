import type { TerminalCursorSnapshot } from "@synara/shared/terminalTextProjection";

import { resolveLynxTerminalCellMetrics } from "./terminalGridSize.logic";

export interface LynxTerminalCursorGeometry {
  readonly blink: boolean;
  readonly renderText: boolean;
  readonly cursorStyle: {
    readonly height: string;
    readonly left: string;
    readonly top: string;
    readonly width: string;
  };
  readonly inputProxyStyle: {
    readonly height: string;
    readonly left: string;
    readonly top: string;
    readonly width: string;
  };
  readonly screenMinHeight: string;
}

function pixelValue(value: number): string {
  return String(Number(value.toFixed(3))) + "px";
}

export function resolveLynxTerminalCursorGeometry(input: {
  readonly active: boolean;
  readonly cursor: TerminalCursorSnapshot;
  readonly fontSizePx: number;
}): LynxTerminalCursorGeometry {
  const { cellWidth, lineHeight } = resolveLynxTerminalCellMetrics(input.fontSizePx);
  const cursorStyle = input.active ? input.cursor.style : "bar";
  const cursorCellWidth = cellWidth * input.cursor.cellWidth;
  const cursorHeight = cursorStyle === "underline" ? 1 : lineHeight;
  const cursorTop =
    input.cursor.row * lineHeight + (cursorStyle === "underline" ? lineHeight - 1 : 0);
  return {
    blink: input.active && input.cursor.blink,
    renderText: cursorStyle === "block",
    cursorStyle: {
      height: pixelValue(cursorHeight),
      left: pixelValue(input.cursor.column * cellWidth),
      top: pixelValue(cursorTop),
      width: cursorStyle === "bar" ? "1px" : pixelValue(cursorCellWidth),
    },
    inputProxyStyle: {
      height: pixelValue(lineHeight),
      left: pixelValue(input.cursor.column * cellWidth),
      top: pixelValue(input.cursor.row * lineHeight),
      width: pixelValue(Math.max(cellWidth, cursorCellWidth)),
    },
    screenMinHeight: pixelValue((input.cursor.row + 1) * lineHeight),
  };
}
