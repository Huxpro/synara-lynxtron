// FILE: terminalTextProjection.ts
// Purpose: Project a raw VT output stream into bounded plain text for renderers without xterm.
// Layer: Shared terminal presentation policy

import { terminalUnicodeCellWidth } from "./terminalUnicodeWidth";

export interface TerminalTextProjector {
  clear(): void;
  reset(data?: string): void;
  toCursor(): TerminalCursorSnapshot;
  toStyledLines(): TerminalTextLine[];
  toStyledRuns(): TerminalTextRun[];
  toString(): string;
  write(data: string): void;
}

export interface TerminalCursorSnapshot {
  readonly blink: boolean;
  readonly cellWidth: 1 | 2;
  readonly column: number;
  readonly row: number;
  readonly style: "bar" | "block" | "underline";
  readonly text: string;
  readonly visible: boolean;
}

export type TerminalAnsiColor =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "bright-black"
  | "bright-red"
  | "bright-green"
  | "bright-yellow"
  | "bright-blue"
  | "bright-magenta"
  | "bright-cyan"
  | "bright-white";

export type TerminalTextColor = TerminalAnsiColor | `#${string}`;

export interface TerminalTextStyle {
  readonly background?: TerminalTextColor;
  readonly bold?: boolean;
  readonly dim?: boolean;
  readonly foreground?: TerminalTextColor;
  readonly inverse?: boolean;
  readonly italic?: boolean;
  readonly strikethrough?: boolean;
  readonly underline?: boolean;
}

export interface TerminalTextRun {
  readonly text: string;
  readonly style: TerminalTextStyle;
}

export interface TerminalTextLine {
  readonly index: number;
  readonly runs: TerminalTextRun[];
  readonly text: string;
}

export interface TerminalTextMatch {
  readonly end: number;
  readonly lineIndex: number;
  readonly start: number;
}

export interface TerminalTextSearchRun extends TerminalTextRun {
  readonly activeMatch: boolean;
  readonly match: boolean;
}

export function findTerminalTextMatches(
  lines: readonly TerminalTextLine[],
  query: string,
  caseSensitive = false,
): TerminalTextMatch[] {
  if (!query) return [];
  const needle = caseSensitive ? query : query.toLowerCase();
  const matches: TerminalTextMatch[] = [];
  for (const line of lines) {
    const haystack = caseSensitive ? line.text : line.text.toLowerCase();
    let start = 0;
    while (start <= haystack.length - needle.length) {
      const index = haystack.indexOf(needle, start);
      if (index < 0) break;
      matches.push({ lineIndex: line.index, start: index, end: index + needle.length });
      start = index + Math.max(needle.length, 1);
    }
  }
  return matches;
}

export function nextTerminalTextMatchIndex(
  matchCount: number,
  currentIndex: number,
  direction: "next" | "previous",
): number {
  if (matchCount <= 0) return -1;
  if (currentIndex < 0 || currentIndex >= matchCount) {
    return direction === "next" ? 0 : matchCount - 1;
  }
  return direction === "next"
    ? (currentIndex + 1) % matchCount
    : (currentIndex - 1 + matchCount) % matchCount;
}

export function decorateTerminalTextLine(
  line: TerminalTextLine,
  matches: readonly TerminalTextMatch[],
  activeMatchIndex: number,
): TerminalTextSearchRun[] {
  const lineMatches: Array<TerminalTextMatch & { readonly active: boolean }> = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index] as TerminalTextMatch;
    if (match.lineIndex < line.index) continue;
    if (match.lineIndex > line.index) break;
    lineMatches.push({ ...match, active: index === activeMatchIndex });
  }
  if (lineMatches.length === 0) {
    return line.runs.map((run) => ({ ...run, match: false, activeMatch: false }));
  }
  const result: TerminalTextSearchRun[] = [];
  let offset = 0;
  for (const run of line.runs) {
    const runStart = offset;
    const runEnd = runStart + run.text.length;
    const boundaries = new Set([runStart, runEnd]);
    for (const match of lineMatches) {
      if (match.end <= runStart || match.start >= runEnd) continue;
      boundaries.add(Math.max(runStart, match.start));
      boundaries.add(Math.min(runEnd, match.end));
    }
    const sorted = [...boundaries].sort((left, right) => left - right);
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const start = sorted[index] as number;
      const end = sorted[index + 1] as number;
      const match = lineMatches.find(
        (candidate) => candidate.start <= start && candidate.end >= end
      );
      result.push({
        text: run.text.slice(start - runStart, end - runStart),
        style: run.style,
        match: Boolean(match),
        activeMatch: match?.active ?? false,
      });
    }
    offset = runEnd;
  }
  return result;
}

export function flattenTerminalTextLines(
  lines: readonly TerminalTextLine[]
): TerminalTextRun[] {
  const runs: TerminalTextRun[] = [];
  const append = (text: string, style: TerminalTextStyle) => {
    if (!text) return;
    const previous = runs.at(-1);
    if (previous && sameStyle(previous.style, style)) {
      runs[runs.length - 1] = { ...previous, text: previous.text + text };
    } else {
      runs.push({ text, style: { ...style } });
    }
  };
  lines.forEach((line, lineIndex) => {
    for (const run of line.runs) append(run.text, run.style);
    if (lineIndex < lines.length - 1) append(String.fromCharCode(10), {});
  });
  return runs;
}

interface TerminalCell {
  readonly text: string;
  readonly style: TerminalTextStyle;
  readonly width?: 0 | 1 | 2;
}

interface TerminalScreenState {
  readonly column: number;
  readonly lines: TerminalCell[][];
  readonly pendingWrap: boolean;
  readonly row: number;
  readonly savedColumn: number;
  readonly savedRow: number;
  readonly savedStyle: TerminalTextStyle;
  readonly style: TerminalTextStyle;
}

export interface TerminalTextProjectorOptions {
  readonly columns?: number;
  readonly rows?: number;
  readonly maxLines?: number;
}

const DEFAULT_COLUMNS = 100;
const DEFAULT_ROWS = 24;
const DEFAULT_MAX_LINES = 5_000;
const ANSI_COLORS: readonly TerminalAnsiColor[] = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "bright-black",
  "bright-red",
  "bright-green",
  "bright-yellow",
  "bright-blue",
  "bright-magenta",
  "bright-cyan",
  "bright-white",
];

function sameStyle(left: TerminalTextStyle, right: TerminalTextStyle): boolean {
  return (
    left.bold === right.bold &&
    left.background === right.background &&
    left.foreground === right.foreground &&
    left.dim === right.dim &&
    left.inverse === right.inverse &&
    left.italic === right.italic &&
    left.strikethrough === right.strikethrough &&
    left.underline === right.underline
  );
}

function cellsToRuns(cells: readonly TerminalCell[]): TerminalTextRun[] {
  const runs: TerminalTextRun[] = [];
  for (const cell of cells) {
    if (cell.width === 0) continue;
    const previous = runs.at(-1);
    if (previous && sameStyle(previous.style, cell.style)) {
      runs[runs.length - 1] = { ...previous, text: previous.text + cell.text };
    } else {
      runs.push({ text: cell.text, style: { ...cell.style } });
    }
  }
  return runs;
}

function cellHasVisiblePresentation(cell: TerminalCell): boolean {
  return cell.width !== 0 && (cell.text !== " " || !sameStyle(cell.style, {}));
}

function trimUnstyledTrailingCells(cells: readonly TerminalCell[]): TerminalCell[] {
  const trimmed = [...cells];
  while (trimmed.at(-1) && !cellHasVisiblePresentation(trimmed.at(-1) as TerminalCell)) {
    trimmed.pop();
  }
  return trimmed;
}

function colorByte(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.trunc(value as number)));
}

function rgbHex(red: number, green: number, blue: number): `#${string}` {
  return `#${[red, green, blue]
    .map((value) => colorByte(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

function indexedColor(index: number): TerminalTextColor {
  const value = colorByte(index);
  if (value < ANSI_COLORS.length) return ANSI_COLORS[value] as TerminalAnsiColor;
  if (value < 232) {
    const cube = value - 16;
    const levels = [0, 95, 135, 175, 215, 255];
    return rgbHex(
      levels[Math.floor(cube / 36)] ?? 0,
      levels[Math.floor((cube % 36) / 6)] ?? 0,
      levels[cube % 6] ?? 0,
    );
  }
  const gray = 8 + (value - 232) * 10;
  return rgbHex(gray, gray, gray);
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && (value ?? 0) > 0 ? (value as number) : fallback;
}

function parameterValue(params: readonly number[], index: number, fallback: number): number {
  const value = params[index];
  return value === undefined || value === 0 ? fallback : value;
}

function isCombiningCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f) ||
    (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
  );
}

export function createTerminalTextProjector(
  options: TerminalTextProjectorOptions = {},
): TerminalTextProjector {
  const columns = positiveInteger(options.columns, DEFAULT_COLUMNS);
  const viewportRows = positiveInteger(options.rows, DEFAULT_ROWS);
  const maxLines = positiveInteger(options.maxLines, DEFAULT_MAX_LINES);
  let lines: TerminalCell[][] = [[]];
  let row = 0;
  let column = 0;
  let savedRow = 0;
  let savedColumn = 0;
  let savedStyle: TerminalTextStyle = {};
  let pending = "";
  let style: TerminalTextStyle = {};
  let primaryScreen: TerminalScreenState | null = null;
  let autoWrap = true;
  let insertMode = false;
  let originMode = false;
  let pendingWrap = false;
  let cursorVisible = true;
  let cursorBlink = true;
  let cursorBlinkOverride: boolean | undefined;
  let cursorStyleOverride: TerminalCursorSnapshot["style"] | undefined;
  let scrollTop = 0;
  let scrollBottom = viewportRows - 1;

  const blankCell = (): TerminalCell => ({
    text: " ",
    style: style.background === undefined ? {} : { background: style.background },
  });

  const blankLine = (): TerminalCell[] =>
    style.background === undefined
      ? []
      : Array.from({ length: columns }, blankCell);

  const ensureRow = (target: number) => {
    while (lines.length <= target) lines.push([]);
  };

  const capLines = () => {
    if (lines.length <= maxLines) return;
    const removed = lines.length - maxLines;
    lines = lines.slice(removed);
    row = Math.max(0, row - removed);
    savedRow = Math.max(0, savedRow - removed);
  };

  const moveRow = (next: number) => {
    pendingWrap = false;
    row = primaryScreen === null
      ? Math.max(0, next)
      : Math.max(0, Math.min(viewportRows - 1, next));
    ensureRow(row);
    capLines();
  };

  const moveCursorRow = (next: number) => {
    const minimum = primaryScreen !== null && originMode ? scrollTop : 0;
    const maximum = primaryScreen !== null
      ? originMode
        ? scrollBottom
        : viewportRows - 1
      : Number.POSITIVE_INFINITY;
    moveRow(Math.min(maximum, Math.max(minimum, next)));
  };

  const ensureAlternateViewport = () => {
    if (primaryScreen === null) return;
    while (lines.length < viewportRows) lines.push([]);
    if (lines.length > viewportRows) lines.length = viewportRows;
  };

  const scrollRegion = (count: number, direction: "up" | "down") => {
    if (primaryScreen === null) return;
    ensureAlternateViewport();
    const height = scrollBottom - scrollTop + 1;
    const amount = Math.min(count, height);
    if (direction === "up") {
      lines.splice(scrollTop, amount);
      lines.splice(
        scrollBottom - amount + 1,
        0,
        ...Array.from({ length: amount }, blankLine)
      );
    } else {
      lines.splice(
        scrollTop,
        0,
        ...Array.from({ length: amount }, blankLine)
      );
      lines.splice(scrollBottom + 1, amount);
    }
  };

  const lineFeed = () => {
    pendingWrap = false;
    if (primaryScreen !== null && row === scrollBottom) {
      scrollRegion(1, "up");
      return;
    }
    moveRow(row + 1);
  };

  const reverseIndex = () => {
    pendingWrap = false;
    if (primaryScreen !== null && row === scrollTop) {
      scrollRegion(1, "down");
      return;
    }
    moveRow(row - 1);
  };

  const saveCursor = () => {
    savedRow = row;
    savedColumn = column;
    savedStyle = { ...style };
  };

  const restoreCursor = () => {
    moveRow(savedRow);
    column = Math.min(columns - 1, Math.max(0, savedColumn));
    style = { ...savedStyle };
  };

  const clearGlyphAt = (line: TerminalCell[], target: number) => {
    if (line[target]?.width === 0 && line[target - 1]?.width === 2) {
      line[target - 1] = { text: " ", style: {} };
    } else if (line[target]?.width === 2) {
      line[target + 1] = { text: " ", style: {} };
    }
    line[target] = { text: " ", style: {} };
  };

  const clearWideGlyphContinuationAt = (line: TerminalCell[], target: number) => {
    if (line[target]?.width === 0 && line[target - 1]?.width === 2) {
      line[target - 1] = { text: " ", style: {} };
      line[target] = { text: " ", style: {} };
    }
  };

  const clearOrphanedWideCells = (line: TerminalCell[]) => {
    for (let index = 0; index < line.length; index += 1) {
      const cell = line[index];
      if (cell?.width === 0 && line[index - 1]?.width !== 2) {
        line[index] = { text: " ", style: {} };
      } else if (cell?.width === 2 && line[index + 1]?.width !== 0) {
        line[index] = { text: " ", style: {} };
      }
    }
  };

  const put = (value: string, codePoint: number) => {
    if (pendingWrap) {
      if (autoWrap) {
        column = 0;
        lineFeed();
      }
      pendingWrap = false;
    }
    const width = terminalUnicodeCellWidth(codePoint);
    if (width === 2 && column === columns - 1) {
      if (!autoWrap) return;
      column = 0;
      lineFeed();
    }
    ensureRow(row);
    const line = lines[row] as TerminalCell[];
    while (line.length < column) line.push({ text: " ", style: {} });
    if (insertMode) {
      clearWideGlyphContinuationAt(line, column);
      line.splice(
        column,
        0,
        ...Array.from({ length: width }, blankCell)
      );
      if (line.length > columns) line.length = columns;
      clearOrphanedWideCells(line);
    }
    clearGlyphAt(line, column);
    if (width === 2) clearGlyphAt(line, column + 1);
    line[column] = { text: value, style: { ...style }, width };
    if (width === 2) {
      line[column + 1] = { text: "", style: { ...style }, width: 0 };
    }
    if (column + width >= columns) {
      column = columns - 1;
      pendingWrap = autoWrap;
    } else column += width;
  };

  const appendCombining = (value: string) => {
    ensureRow(row);
    let targetColumn = pendingWrap ? column : column - 1;
    const line = lines[row] as TerminalCell[];
    if (line[targetColumn]?.width === 0) targetColumn -= 1;
    if (targetColumn < 0) return;
    const cell = line[targetColumn];
    if (cell) line[targetColumn] = { ...cell, text: cell.text + value };
  };

  const eraseLine = (mode: number) => {
    ensureRow(row);
    const line = lines[row] as TerminalCell[];
    if (mode === 1) {
      for (let index = 0; index <= column; index += 1) {
        clearGlyphAt(line, index);
        line[index] = blankCell();
      }
    } else if (mode === 2) {
      lines[row] = blankLine();
    } else {
      clearGlyphAt(line, column);
      line.splice(
        column,
        Math.max(0, line.length - column),
        ...Array.from({ length: columns - column }, blankCell)
      );
    }
  };

  const eraseDisplay = (mode: number) => {
    if (mode === 3) return;
    if (mode === 2) {
      const minimumLength = primaryScreen === null ? row + 1 : viewportRows;
      lines = Array.from({ length: minimumLength }, blankLine);
      return;
    }
    if (mode === 1) {
      for (let index = 0; index < row; index += 1) lines[index] = blankLine();
      eraseLine(1);
      return;
    }
    eraseLine(0);
    for (let index = row + 1; index < lines.length; index += 1) {
      lines[index] = blankLine();
    }
  };

  const insertLines = (count: number) => {
    if (primaryScreen === null || row < scrollTop || row > scrollBottom) return;
    ensureAlternateViewport();
    const amount = Math.min(count, scrollBottom - row + 1);
    lines.splice(row, 0, ...Array.from({ length: amount }, blankLine));
    lines.splice(scrollBottom + 1, amount);
  };

  const deleteLines = (count: number) => {
    if (primaryScreen === null || row < scrollTop || row > scrollBottom) return;
    ensureAlternateViewport();
    const amount = Math.min(count, scrollBottom - row + 1);
    lines.splice(row, amount);
    lines.splice(
      scrollBottom - amount + 1,
      0,
      ...Array.from({ length: amount }, blankLine)
    );
  };

  const applyCsi = (body: string, final: string) => {
    const normalized = body.replace(/^[?>!]/, "");
    const params = normalized.length === 0
      ? []
      : normalized.split(";").map((value) => Number.parseInt(value, 10) || 0);
    const count = parameterValue(params, 0, 1);
    if (body === "?25" && (final === "h" || final === "l")) {
      cursorVisible = final === "h";
      return;
    }
    if (body === "?12" && (final === "h" || final === "l")) {
      cursorBlink = final === "h";
      return;
    }
    if (final === "q" && body.endsWith(" ")) {
      const cursorStyle = body.slice(0, -1).length === 0 ? 1 : (params[0] ?? 1);
      if (cursorStyle === 0) {
        cursorBlinkOverride = undefined;
        cursorStyleOverride = undefined;
      } else if (cursorStyle >= 1 && cursorStyle <= 6) {
        cursorBlinkOverride = cursorStyle % 2 === 1;
        cursorStyleOverride =
          cursorStyle <= 2
            ? "block"
            : cursorStyle <= 4
              ? "underline"
              : "bar";
      }
      return;
    }
    if ((body === "?1049" || body === "?1047" || body === "?47") && final === "h") {
      if (primaryScreen === null) {
        primaryScreen = {
          column,
          lines,
          pendingWrap,
          row,
          savedColumn,
          savedRow,
          savedStyle,
          style,
        };
        lines = [[]];
        row = 0;
        column = 0;
        savedRow = 0;
        savedColumn = 0;
        savedStyle = {};
        style = {};
        pendingWrap = false;
        scrollTop = 0;
        scrollBottom = viewportRows - 1;
      }
      return;
    }
    if ((body === "?1049" || body === "?1047" || body === "?47") && final === "l") {
      if (primaryScreen !== null) {
        ({
          column,
          lines,
          pendingWrap,
          row,
          savedColumn,
          savedRow,
          savedStyle,
          style,
        } = primaryScreen);
        primaryScreen = null;
        scrollTop = 0;
        scrollBottom = viewportRows - 1;
      }
      return;
    }
    if (body === "?7" && (final === "h" || final === "l")) {
      autoWrap = final === "h";
      pendingWrap = false;
      return;
    }
    if (body === "4" && (final === "h" || final === "l")) {
      insertMode = final === "h";
      pendingWrap = false;
      return;
    }
    if (body === "?6" && (final === "h" || final === "l")) {
      originMode = final === "h";
      row = originMode && primaryScreen !== null ? scrollTop : 0;
      column = 0;
      pendingWrap = false;
      ensureRow(row);
      return;
    }
    switch (final) {
      case "A": moveCursorRow(row - count); break;
      case "B": moveCursorRow(row + count); break;
      case "C": pendingWrap = false; column = Math.min(columns - 1, column + count); break;
      case "a": pendingWrap = false; column = Math.min(columns - 1, column + count); break;
      case "D": pendingWrap = false; column = Math.max(0, column - count); break;
      case "E": moveCursorRow(row + count); column = 0; break;
      case "F": moveCursorRow(row - count); column = 0; break;
      case "G":
      case "`":
        pendingWrap = false;
        column = Math.min(
          columns - 1,
          Math.max(0, parameterValue(params, 0, 1) - 1)
        );
        break;
      case "I":
        pendingWrap = false;
        column = Math.min(
          columns - 1,
          (Math.floor(column / 8) + count) * 8
        );
        break;
      case "Z":
        pendingWrap = false;
        column = Math.max(0, (Math.ceil(column / 8) - count) * 8);
        break;
      case "H":
      case "f":
        moveCursorRow(
          parameterValue(params, 0, 1) - 1 +
            (primaryScreen !== null && originMode ? scrollTop : 0)
        );
        column = Math.min(
          columns - 1,
          Math.max(0, parameterValue(params, 1, 1) - 1)
        );
        break;
      case "d":
        moveCursorRow(
          parameterValue(params, 0, 1) - 1 +
            (primaryScreen !== null && originMode ? scrollTop : 0)
        );
        break;
      case "e": moveCursorRow(row + count); break;
      case "J": pendingWrap = false; eraseDisplay(params[0] ?? 0); break;
      case "K": pendingWrap = false; eraseLine(params[0] ?? 0); break;
      case "L": pendingWrap = false; insertLines(count); break;
      case "M": pendingWrap = false; deleteLines(count); break;
      case "P": {
        pendingWrap = false;
        const line = lines[row] as TerminalCell[];
        clearGlyphAt(line, column);
        line.splice(column, count);
        line.push(...Array.from({ length: count }, blankCell));
        if (line.length > columns) line.length = columns;
        clearOrphanedWideCells(line);
        break;
      }
      case "S": pendingWrap = false; scrollRegion(count, "up"); break;
      case "T": pendingWrap = false; scrollRegion(count, "down"); break;
      case "@":
        pendingWrap = false;
        clearWideGlyphContinuationAt(lines[row] as TerminalCell[], column);
        (lines[row] as TerminalCell[]).splice(
          column,
          0,
          ...Array.from({ length: count }, blankCell),
        );
        (lines[row] as TerminalCell[]).length = Math.min(
          (lines[row] as TerminalCell[]).length,
          columns
        );
        clearOrphanedWideCells(lines[row] as TerminalCell[]);
        break;
      case "X": {
        pendingWrap = false;
        const line = lines[row] as TerminalCell[];
        for (let index = column; index < column + count; index += 1) {
          clearGlyphAt(line, index);
          line[index] = blankCell();
        }
        break;
      }
      case "m": {
        const codes = params.length > 0 ? params : [0];
        for (let index = 0; index < codes.length; index += 1) {
          const code = codes[index] ?? 0;
          if (code === 0) style = {};
          else if (code === 1) style = { ...style, bold: true };
          else if (code === 2) style = { ...style, dim: true };
          else if (code === 3) style = { ...style, italic: true };
          else if (code === 4) style = { ...style, underline: true };
          else if (code === 7) style = { ...style, inverse: true };
          else if (code === 9) style = { ...style, strikethrough: true };
          else if (code === 22) {
            style = { ...style, bold: undefined, dim: undefined };
          }
          else if (code === 23) style = { ...style, italic: undefined };
          else if (code === 24) style = { ...style, underline: undefined };
          else if (code === 27) style = { ...style, inverse: undefined };
          else if (code === 29) style = { ...style, strikethrough: undefined };
          else if (code === 39) style = { ...style, foreground: undefined };
          else if (code === 49) style = { ...style, background: undefined };
          else if (code >= 30 && code <= 37) {
            style = { ...style, foreground: ANSI_COLORS[code - 30] };
          } else if (code >= 90 && code <= 97) {
            style = { ...style, foreground: ANSI_COLORS[code - 82] };
          } else if (code >= 40 && code <= 47) {
            style = { ...style, background: ANSI_COLORS[code - 40] };
          } else if (code >= 100 && code <= 107) {
            style = { ...style, background: ANSI_COLORS[code - 92] };
          } else if (code === 38 || code === 48) {
            const target = code === 38 ? "foreground" : "background";
            const colorMode = codes[index + 1];
            if (colorMode === 5 && codes[index + 2] !== undefined) {
              style = { ...style, [target]: indexedColor(codes[index + 2]) };
              index += 2;
            } else if (
              colorMode === 2 &&
              codes[index + 2] !== undefined &&
              codes[index + 3] !== undefined &&
              codes[index + 4] !== undefined
            ) {
              style = {
                ...style,
                [target]: rgbHex(codes[index + 2], codes[index + 3], codes[index + 4]),
              };
              index += 4;
            }
          }
        }
        break;
      }
      case "r": {
        pendingWrap = false;
        if (primaryScreen === null) break;
        const top = parameterValue(params, 0, 1) - 1;
        const bottom = parameterValue(params, 1, viewportRows) - 1;
        if (top >= 0 && bottom < viewportRows && top < bottom) {
          scrollTop = top;
          scrollBottom = bottom;
          row = originMode ? scrollTop : 0;
          column = 0;
        }
        break;
      }
      case "s": pendingWrap = false; saveCursor(); break;
      case "u": restoreCursor(); break;
      default: break;
    }
  };

  const consume = (input: string) => {
    let index = 0;
    while (index < input.length) {
      const firstCodeUnit = input.charCodeAt(index);
      if (
        firstCodeUnit >= 0xd800 &&
        firstCodeUnit <= 0xdbff &&
        index + 1 >= input.length
      ) {
        return input.slice(index);
      }
      const codePoint = input.codePointAt(index) as number;
      const value = String.fromCodePoint(codePoint);
      const codeUnitLength = value.length;
      if (
        value === "\u001b" ||
        value === "\u0090" ||
        value === "\u0098" ||
        value === "\u009b" ||
        value === "\u009c" ||
        value === "\u009d" ||
        value === "\u009e" ||
        value === "\u009f"
      ) {
        const isCsi = value === "\u009b" || input[index + 1] === "[";
        const isOsc = value === "\u009d" || input[index + 1] === "]";
        const isStringControl =
          isOsc ||
          value === "\u0090" ||
          value === "\u0098" ||
          value === "\u009e" ||
          value === "\u009f" ||
          (value === "\u001b" && /[PX^_]/.test(input[index + 1] ?? ""));
        if (isCsi) {
          const start = index + (value === "\u001b" ? 2 : 1);
          let end = start;
          while (end < input.length && !/[\x40-\x7e]/.test(input[end] as string)) end += 1;
          if (end >= input.length) return input.slice(index);
          applyCsi(input.slice(start, end), input[end] as string);
          index = end + 1;
          continue;
        }
        if (isStringControl) {
          const start = index + (value === "\u001b" ? 2 : 1);
          let end = start;
          while (
            end < input.length &&
            input[end] !== "\u009c" &&
            !(isOsc && input[end] === "\u0007") &&
            !(input[end] === "\u001b" && input[end + 1] === "\\")
          ) end += 1;
          if (end >= input.length) return input.slice(index);
          index = input[end] === "\u001b" ? end + 2 : end + 1;
          continue;
        }
        if (value === "\u009c") {
          index += 1;
          continue;
        }
        if (index + 1 >= input.length) return input.slice(index);
        const command = input[index + 1] as string;
        pendingWrap = false;
        if (command === "7") saveCursor();
        else if (command === "8") restoreCursor();
        else if (command === "c") {
          lines = [[]];
          row = 0;
          column = 0;
          savedRow = 0;
          savedColumn = 0;
          savedStyle = {};
          style = {};
          primaryScreen = null;
          autoWrap = true;
          insertMode = false;
          originMode = false;
          cursorBlinkOverride = undefined;
          cursorStyleOverride = undefined;
          scrollTop = 0;
          scrollBottom = viewportRows - 1;
        }
        else if (command === "D") lineFeed();
        else if (command === "E") { lineFeed(); column = 0; }
        else if (command === "M") reverseIndex();
        index += command === "(" || command === ")" ? 3 : 2;
        continue;
      }
      if (value === "\r") { column = 0; pendingWrap = false; }
      else if (value === "\n") lineFeed();
      else if (value === "\b") { pendingWrap = false; column = Math.max(0, column - 1); }
      else if (value === "\t") { pendingWrap = false; column = Math.min(columns - 1, (Math.floor(column / 8) + 1) * 8); }
      else if (isCombiningCodePoint(codePoint)) appendCombining(value);
      else if (codePoint >= 0x20 && codePoint !== 0x7f) put(value, codePoint);
      index += codeUnitLength;
    }
    return "";
  };

  const clear = () => {
    lines = [[]];
    row = 0;
    column = 0;
    savedRow = 0;
    savedColumn = 0;
    savedStyle = {};
    pending = "";
    style = {};
    primaryScreen = null;
    autoWrap = true;
    insertMode = false;
    originMode = false;
    pendingWrap = false;
    cursorBlinkOverride = undefined;
    cursorStyleOverride = undefined;
    scrollTop = 0;
    scrollBottom = viewportRows - 1;
  };

  return {
    clear,
    reset(data = "") {
      clear();
      pending = consume(data);
    },
    toCursor() {
      const renderedColumn = Math.min(columns - 1, Math.max(0, column));
      const cursorCell = lines[row]?.[renderedColumn];
      return {
        blink: cursorBlinkOverride ?? cursorBlink,
        cellWidth: cursorCell?.width === 2 ? 2 : 1,
        column: renderedColumn,
        row,
        style: cursorStyleOverride ?? "bar",
        text: cursorCell?.width === 0 ? " " : (cursorCell?.text ?? " "),
        visible: cursorVisible,
      };
    },
    toStyledLines() {
      const lastNonEmptyLine = lines.findLastIndex((line) =>
        line.some(cellHasVisiblePresentation)
      );
      return lines.slice(0, lastNonEmptyLine + 1).map((line, index) => {
        const trimmed = trimUnstyledTrailingCells(line);
        return {
          index,
          runs: cellsToRuns(trimmed),
          text: trimmed.map((cell) => cell.text).join(""),
        };
      });
    },
    toStyledRuns() {
      const runs: TerminalTextRun[] = [];
      const append = (text: string, runStyle: TerminalTextStyle) => {
        if (!text) return;
        const previous = runs.at(-1);
        if (previous && sameStyle(previous.style, runStyle)) {
          runs[runs.length - 1] = { ...previous, text: previous.text + text };
        } else {
          runs.push({ text, style: { ...runStyle } });
        }
      };
      const lastNonEmptyLine = lines.findLastIndex((line) =>
        line.some(cellHasVisiblePresentation)
      );
      lines.slice(0, lastNonEmptyLine + 1).forEach((line, lineIndex) => {
        const trimmed = trimUnstyledTrailingCells(line);
        for (const run of cellsToRuns(trimmed)) append(run.text, run.style);
        if (lineIndex < lastNonEmptyLine) append(String.fromCharCode(10), {});
      });
      return runs;
    },
    toString() {
      const projectedLines = lines.map((line) => {
        const cells = [...line];
        while (cells.at(-1)?.text === " ") cells.pop();
        return cells.map((cell) => cell.text).join("");
      });
      while (projectedLines.at(-1) === "") projectedLines.pop();
      return projectedLines.join(String.fromCharCode(10));
    },
    write(data) {
      pending = consume(`${pending}${data}`);
    },
  };
}

export function projectTerminalText(
  data: string,
  options?: TerminalTextProjectorOptions,
): string {
  const projector = createTerminalTextProjector(options);
  projector.write(data);
  return projector.toString();
}

export function normalizeTerminalClipboardText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[^\S\n]+$/gm, "");
}
