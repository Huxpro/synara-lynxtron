import { describe, expect, it } from "@rstest/core";
import type { TerminalEvent, TerminalSessionSnapshot } from "@synara/contracts";
import {
  createTerminalTextProjector,
  decorateTerminalTextLine,
  findTerminalTextMatches,
  flattenTerminalTextLines,
  nextTerminalTextMatchIndex,
  projectTerminalText,
} from "@synara/shared/terminalTextProjection";

import { applyTerminalEventToSnapshot, utf8ByteLength } from "./terminalEventProjection.logic";

const snapshot: TerminalSessionSnapshot = {
  threadId: "thread-1",
  terminalId: "terminal-1",
  cwd: "/tmp/project",
  status: "running",
  pid: 42,
  history: "before",
  replayPreamble: "",
  exitCode: null,
  exitSignal: null,
  updatedAt: "2026-08-26T00:00:00.000Z",
};

function event<T extends TerminalEvent>(value: T): T {
  return value;
}

describe("Native terminal event projection", () => {
  it("keeps ANSI foreground and emphasis in renderer-independent runs", () => {
    const projector = createTerminalTextProjector();
    projector.write("plain \u001b[31;1mred\u001b[22m!\u001b[39m");
    expect(projector.toString()).toBe("plain red!");
    expect(projector.toStyledRuns()).toEqual([
      { text: "plain ", style: {} },
      { text: "red", style: { bold: true, foreground: "red" } },
      { text: "!", style: { bold: undefined, foreground: "red" } },
    ]);
  });

  it("retains ANSI background and inverse state without changing plain text", () => {
    const projector = createTerminalTextProjector();
    projector.write("\u001b[44mblue-bg\u001b[7m reversed\u001b[27;49m plain");
    expect(projector.toString()).toBe("blue-bg reversed plain");
    expect(projector.toStyledRuns()).toEqual([
      { text: "blue-bg", style: { background: "blue" } },
      { text: " reversed", style: { background: "blue", inverse: true } },
      {
        text: " plain",
        style: { background: undefined, inverse: undefined },
      },
    ]);
  });

  it("projects xterm 256-color and truecolor SGR values", () => {
    const projector = createTerminalTextProjector();
    projector.write("\u001b[38;5;196mindexed\u001b[48;2;1;2;255m rgb\u001b[0m");
    expect(projector.toStyledRuns()).toEqual([
      { text: "indexed", style: { foreground: "#ff0000" } },
      {
        text: " rgb",
        style: { background: "#0102ff", foreground: "#ff0000" },
      },
    ]);
  });

  it("projects dim and strikethrough with their standard resets", () => {
    const projector = createTerminalTextProjector();
    projector.write("\u001b[1;2;9mdim strike\u001b[22m strike\u001b[29m plain");
    expect(projector.toStyledRuns()).toEqual([
      {
        text: "dim strike",
        style: { bold: true, dim: true, strikethrough: true },
      },
      {
        text: " strike",
        style: { bold: undefined, dim: undefined, strikethrough: true },
      },
      {
        text: " plain",
        style: { bold: undefined, dim: undefined, strikethrough: undefined },
      },
    ]);
  });

  it("preserves styled blank cells while trimming unstyled terminal padding", () => {
    const projector = createTerminalTextProjector();
    projector.write("label\u001b[44m  \u001b[0m  \r\n\u001b[7m   \u001b[0m");
    expect(projector.toString()).toBe("label");
    expect(projector.toStyledLines()).toEqual([
      {
        index: 0,
        text: "label  ",
        runs: [
          { text: "label", style: {} },
          { text: "  ", style: { background: "blue" } },
        ],
      },
      {
        index: 1,
        text: "   ",
        runs: [{ text: "   ", style: { inverse: true } }],
      },
    ]);
  });

  it("restores the primary screen after split alternate-screen mode sequences", () => {
    const projector = createTerminalTextProjector();
    projector.write("shell prompt\u001b[?10");
    projector.write("49hfull-screen app\u001b[?1049");
    expect(projector.toString()).toBe("full-screen app");
    projector.write("l");
    expect(projector.toString()).toBe("shell prompt");
    expect(projector.toStyledRuns()).toEqual([{ text: "shell prompt", style: {} }]);
  });

  it("keeps the original primary screen across repeated alternate-screen enter and clears it on reset", () => {
    const projector = createTerminalTextProjector();
    projector.write("primary\u001b[?1049halt\u001b[?1049hnested\u001b[?1049l");
    expect(projector.toString()).toBe("primary");

    projector.write("\u001b[?1049halt again");
    projector.clear();
    projector.write("\u001b[?1049lclean");
    expect(projector.toString()).toBe("clean");
  });

  it("discards split terminal control strings and recognizes C1 string terminators", () => {
    const projector = createTerminalTextProjector();
    projector.write("before\u001bP$qm");
    projector.write("payload\u001b\\after\u009d0;title");
    projector.write(" text\u009cmid\u009fprivate");
    projector.write(" payload\u009cend");
    expect(projector.toString()).toBe("beforeaftermidend");
  });

  it("applies alternate-screen line insertion, deletion, and viewport scrolling", () => {
    const projector = createTerminalTextProjector({ columns: 40, rows: 4 });
    projector.write("primary\u001b[?1049hone\r\ntwo\r\nthree\r\nfour");
    projector.write("\u001b[2;1H\u001b[Linserted");
    expect(projector.toString()).toBe("one\ninserted\ntwo\nthree");

    projector.write("\u001b[2;1H\u001b[M");
    expect(projector.toString()).toBe("one\ntwo\nthree");

    projector.write("\u001b[2");
    projector.write("S");
    expect(projector.toString()).toBe("three");
    projector.write("\u001b[T");
    expect(projector.toString()).toBe("\nthree");

    projector.write("\u001b[?1049l");
    expect(projector.toString()).toBe("primary");
  });

  it("keeps DECSTBM scrolling inside alternate-screen margins", () => {
    const projector = createTerminalTextProjector({ columns: 40, rows: 5 });
    projector.write(
      "primary\u001b[?1049hheader\r\none\r\ntwo\r\nthree\r\nfooter" + "\u001b[2;4r\u001b[4;1H\nnew",
    );
    expect(projector.toString()).toBe("header\ntwo\nthree\nnew\nfooter");

    projector.write("\u001b[2;1H\u001bMtop");
    expect(projector.toString()).toBe("header\ntop\ntwo\nthree\nfooter");

    projector.write("\u001b[?1049l");
    expect(projector.toString()).toBe("primary");
  });

  it("does not mutate primary scrollback for viewport-only line commands", () => {
    const projector = createTerminalTextProjector({ rows: 2 });
    projector.write("one\r\ntwo\u001b[1;1H\u001b[L\u001b[M\u001b[S\u001b[T");
    expect(projector.toString()).toBe("one\ntwo");
  });

  it("delays autowrap until the next printable cell and preserves it across SGR", () => {
    const projector = createTerminalTextProjector({ columns: 4 });
    projector.write("abcd");
    expect(projector.toString()).toBe("abcd");
    projector.write("\u001b[31me");
    expect(projector.toString()).toBe("abcd\ne");
    expect(projector.toStyledLines()[1]?.runs).toEqual([
      { text: "e", style: { foreground: "red" } },
    ]);
  });

  it("exposes the xterm-rendered cursor cell across delayed wrap and movement", () => {
    const projector = createTerminalTextProjector({ columns: 4 });
    expect(projector.toCursor()).toEqual({
      blink: true,
      cellWidth: 1,
      column: 0,
      row: 0,
      style: "bar",
      text: " ",
      visible: true,
    });
    projector.write("abcd");
    expect(projector.toCursor()).toEqual({
      blink: true,
      cellWidth: 1,
      column: 3,
      row: 0,
      style: "bar",
      text: "d",
      visible: true,
    });
    projector.write("e");
    expect(projector.toCursor()).toEqual({
      blink: true,
      cellWidth: 1,
      column: 1,
      row: 1,
      style: "bar",
      text: " ",
      visible: true,
    });
    projector.write("\u001b[3;4H");
    expect(projector.toCursor()).toEqual({
      blink: true,
      cellWidth: 1,
      column: 3,
      row: 2,
      style: "bar",
      text: " ",
      visible: true,
    });
  });

  it("tracks DECTCEM across split writes, alternate screens, RIS, clear, and replay reset", () => {
    const projector = createTerminalTextProjector({ columns: 4, rows: 3 });
    projector.write("\u001b[?25");
    expect(projector.toCursor().visible).toBe(true);
    projector.write("l");
    expect(projector.toCursor().visible).toBe(false);
    projector.write("\u001b[?1049hX\u001b[?1049l");
    expect(projector.toCursor()).toMatchObject({ column: 0, row: 0, visible: false });
    projector.write("\u001bc");
    expect(projector.toCursor()).toMatchObject({ column: 0, row: 0, visible: false });
    projector.clear();
    expect(projector.toCursor()).toMatchObject({ column: 0, row: 0, visible: false });
    projector.reset("A");
    expect(projector.toCursor()).toEqual({
      blink: true,
      cellWidth: 1,
      column: 1,
      row: 0,
      style: "bar",
      text: " ",
      visible: false,
    });
    projector.write("\u001b[?25l\u001b[?25h");
    expect(projector.toCursor().visible).toBe(true);
    const replayProjector = createTerminalTextProjector();
    replayProjector.reset("A");
    expect(replayProjector.toCursor()).toMatchObject({
      column: 1,
      visible: true,
    });
  });

  it("matches xterm DECSCUSR styles, blink overrides, and DEC mode 12 defaults", () => {
    const projector = createTerminalTextProjector();
    projector.write("\u001b[ q");
    expect(projector.toCursor()).toMatchObject({ blink: true, style: "block" });
    projector.write("\u001b[2 q");
    expect(projector.toCursor()).toMatchObject({ blink: false, style: "block" });
    projector.write("\u001b[3 q");
    expect(projector.toCursor()).toMatchObject({ blink: true, style: "underline" });
    projector.write("\u001b[6 q");
    expect(projector.toCursor()).toMatchObject({ blink: false, style: "bar" });
    projector.write("\u001b[?12l\u001b[0 q");
    expect(projector.toCursor()).toMatchObject({ blink: false, style: "bar" });
    projector.write("\u001b[1 q\u001bc");
    expect(projector.toCursor()).toMatchObject({ blink: false, style: "bar" });
    projector.reset("\u001b[1 q");
    expect(projector.toCursor()).toMatchObject({ blink: true, style: "block" });
  });

  it("exposes the cursor cell text and wide-cell width for block rendering", () => {
    const projector = createTerminalTextProjector({ columns: 4 });
    projector.write("你\u001b[1G\u001b[2 q");
    expect(projector.toCursor()).toMatchObject({
      cellWidth: 2,
      column: 0,
      style: "block",
      text: "你",
    });
    projector.write("\u001b[2G");
    expect(projector.toCursor()).toMatchObject({
      cellWidth: 1,
      column: 1,
      text: " ",
    });
  });

  it("overwrites the final cell while DECAWM is disabled and resumes delayed wrap", () => {
    const projector = createTerminalTextProjector({ columns: 4 });
    projector.write("abcd\u001b[?7lXY");
    expect(projector.toString()).toBe("abcY");
    projector.write("\u001b[?7hZ");
    expect(projector.toString()).toBe("abcZ");
    projector.write("!");
    expect(projector.toString()).toBe("abcZ\n!");
  });

  it("cancels pending wrap on carriage return and cursor movement", () => {
    const projector = createTerminalTextProjector({ columns: 4 });
    projector.write("abcd\rZ");
    expect(projector.toString()).toBe("Zbcd");
    projector.reset("abcd\u001b[2DX");
    expect(projector.toString()).toBe("aXcd");
  });

  it("keeps the visible screen for ED 3 and clamps absolute columns", () => {
    const projector = createTerminalTextProjector({ columns: 4 });
    projector.write("abcd\u001b[3J\u001b[999GZ");
    expect(projector.toString()).toBe("abcZ");
  });

  it("supports relative and tabular cursor movement used by TUIs", () => {
    const projector = createTerminalTextProjector({ columns: 20 });
    projector.write("a\u001b[2aX\u001b[2eY\u001b[`B\u001b[IC\u001b[ZD");
    expect(projector.toString()).toBe("a  X\n\nB   Y   D");
  });

  it("keeps Unicode code points intact and attaches combining marks to one cell", () => {
    const projector = createTerminalTextProjector({ columns: 3 });
    projector.write("A🙂");
    expect(projector.toString()).toBe("A🙂");
    projector.write("e\u0301");
    expect(projector.toString()).toBe("A🙂\né");
    projector.write("Z");
    expect(projector.toString()).toBe("A🙂\néZ");
  });

  it("retains a split surrogate pair across incremental writes", () => {
    const projector = createTerminalTextProjector();
    projector.write("before\ud83d");
    expect(projector.toString()).toBe("before");
    projector.write("\ude42after");
    expect(projector.toString()).toBe("before🙂after");
  });

  it("matches xterm Unicode 11 wide-cell wrapping at the final column", () => {
    expect(projectTerminalText("abc你", { columns: 4 })).toBe("abc\n你");
    expect(projectTerminalText("ab你Z", { columns: 4 })).toBe("ab你\nZ");
  });

  it("clears both halves when overwriting a wide-cell lead or continuation", () => {
    expect(projectTerminalText("你\u001b[1GX", { columns: 4 })).toBe("X");
    expect(projectTerminalText("你\u001b[2GX", { columns: 4 })).toBe(" X");
    expect(projectTerminalText("你\bX", { columns: 4 })).toBe(" X");
  });

  it("keeps delete/insert cell operations from leaving orphaned wide cells", () => {
    expect(projectTerminalText("你Z\u001b[1G\u001b[P", { columns: 4 })).toBe(" Z");
    expect(projectTerminalText("你Z\u001b[2G\u001b[@", { columns: 5 })).toBe("   Z");
  });

  it("attaches combining marks to the wide-cell lead", () => {
    expect(projectTerminalText("你\u0301Z", { columns: 4 })).toBe("你́Z");
  });

  it("renders one styled run for a wide glyph without exposing its continuation", () => {
    const projector = createTerminalTextProjector({ columns: 4 });
    projector.write("\u001b[44;31m你\u001b[0mZ");
    expect(projector.toStyledRuns()).toEqual([
      { text: "你", style: { background: "blue", foreground: "red" } },
      { text: "Z", style: {} },
    ]);
  });

  it("restores saved cursor attributes for DEC and CSI save/restore", () => {
    for (const [save, restore] of [
      ["\u001b7", "\u001b8"],
      ["\u001b[s", "\u001b[u"],
    ]) {
      const projector = createTerminalTextProjector();
      projector.write(`\u001b[31mA${save}\u001b[32mB${restore}C`);
      expect(projector.toStyledRuns()).toEqual([{ text: "AC", style: { foreground: "red" } }]);
    }
  });

  it("fully resets modes, margins, saved cursor, and style on RIS", () => {
    const projector = createTerminalTextProjector({ columns: 4, rows: 4 });
    projector.write("\u001b[?7l\u001b[31mABCD\u001b7\u001b[2;3r\u001bcEFGHI");
    expect(projector.toString()).toBe("EFGH\nI");
    expect(projector.toStyledRuns()).toEqual([{ text: "EFGH\nI", style: {} }]);
  });

  it("matches xterm insert mode for narrow and wide cells", () => {
    expect(
      projectTerminalText("abcd\u001b[2G\u001b[4hXY\u001b[4lZ", {
        columns: 6,
      }),
    ).toBe("aXYZcd");
    expect(projectTerminalText("你Z\u001b[1G\u001b[4hA", { columns: 6 })).toBe("A你Z");
  });

  it("applies origin mode to CUP and VPA inside scroll margins", () => {
    const projector = createTerminalTextProjector({ columns: 8, rows: 6 });
    projector.write(
      "\u001b[?1049h0\r\n1\r\n2\r\n3\r\n4\r\n5" +
        "\u001b[2;5r\u001b[?6h\u001b[1;2HX\u001b[4dY" +
        "\u001b[?6l\u001b[1;3HZ",
    );
    expect(projector.toString()).toBe("0 Z\n1X\n2\n3\n4 Y\n5");
  });

  it("erases a complete wide glyph when EL starts on its continuation", () => {
    expect(projectTerminalText("你Z\u001b[2G\u001b[K", { columns: 4 })).toBe("");
  });

  it("uses current background attributes for erased and inserted blank cells", () => {
    const lineProjector = createTerminalTextProjector({ columns: 4 });
    lineProjector.write("abcd\u001b[2G\u001b[44m\u001b[2X");
    expect(lineProjector.toStyledLines()[0]?.runs).toEqual([
      { text: "a", style: {} },
      { text: "  ", style: { background: "blue" } },
      { text: "d", style: {} },
    ]);

    const insertProjector = createTerminalTextProjector({ columns: 4 });
    insertProjector.write("abcd\u001b[2G\u001b[44m\u001b[2@");
    expect(insertProjector.toStyledLines()[0]?.runs).toEqual([
      { text: "a", style: {} },
      { text: "  ", style: { background: "blue" } },
      { text: "b", style: {} },
    ]);

    const deleteProjector = createTerminalTextProjector({ columns: 4 });
    deleteProjector.write("abcd\u001b[2G\u001b[44m\u001b[2P");
    expect(deleteProjector.toStyledLines()[0]?.runs).toEqual([
      { text: "ad", style: {} },
      { text: "  ", style: { background: "blue" } },
    ]);
  });

  it("uses current background attributes for ED before and after the cursor", () => {
    const after = createTerminalTextProjector({ columns: 4, rows: 3 });
    after.write("abcd\r\nefgh\r\nijkl\u001b[2;3H\u001b[44m\u001b[J");
    expect(after.toStyledLines()).toEqual([
      { index: 0, text: "abcd", runs: [{ text: "abcd", style: {} }] },
      {
        index: 1,
        text: "ef  ",
        runs: [
          { text: "ef", style: {} },
          { text: "  ", style: { background: "blue" } },
        ],
      },
      { index: 2, text: "    ", runs: [{ text: "    ", style: { background: "blue" } }] },
    ]);

    const before = createTerminalTextProjector({ columns: 4, rows: 3 });
    before.write("abcd\r\nefgh\r\nijkl\u001b[2;3H\u001b[44m\u001b[1J");
    expect(before.toStyledLines()[0]?.runs).toEqual([
      { text: "    ", style: { background: "blue" } },
    ]);
    expect(before.toStyledLines()[1]?.runs).toEqual([
      { text: "   ", style: { background: "blue" } },
      { text: "h", style: {} },
    ]);
  });

  it("keeps the cursor and current background when ED 2 clears the viewport", () => {
    const projector = createTerminalTextProjector({ columns: 4, rows: 3 });
    projector.write("abc\u001b[2;3H\u001b[44m\u001b[2JX");
    expect(projector.toStyledLines()).toEqual([
      { index: 0, text: "    ", runs: [{ text: "    ", style: { background: "blue" } }] },
      {
        index: 1,
        text: "  X ",
        runs: [{ text: "  X ", style: { background: "blue" } }],
      },
    ]);
  });

  it("exposes stable styled lines without flattening line boundaries", () => {
    const projector = createTerminalTextProjector();
    projector.write("one\r\n\u001b[31mtwo\u001b[0m\r\n");
    expect(projector.toStyledLines()).toEqual([
      { index: 0, text: "one", runs: [{ text: "one", style: {} }] },
      {
        index: 1,
        text: "two",
        runs: [{ text: "two", style: { foreground: "red" } }],
      },
    ]);
  });

  it("flattens styled lines while preserving newlines and merging adjacent styles", () => {
    expect(
      flattenTerminalTextLines([
        { index: 0, text: "one", runs: [{ text: "one", style: {} }] },
        { index: 1, text: "two", runs: [{ text: "two", style: {} }] },
        {
          index: 2,
          text: "red",
          runs: [{ text: "red", style: { foreground: "red" } }],
        },
      ]),
    ).toEqual([
      { text: "one\ntwo\n", style: {} },
      { text: "red", style: { foreground: "red" } },
    ]);
  });

  it("finds, wraps, and decorates matches across ANSI run boundaries", () => {
    const projector = createTerminalTextProjector();
    projector.write("Error one\r\nEr\u001b[31mror\u001b[0m two");
    const lines = projector.toStyledLines();
    const matches = findTerminalTextMatches(lines, "error");
    expect(matches).toEqual([
      { lineIndex: 0, start: 0, end: 5 },
      { lineIndex: 1, start: 0, end: 5 },
    ]);
    expect(findTerminalTextMatches(lines, "error", true)).toEqual([]);
    expect(nextTerminalTextMatchIndex(2, -1, "previous")).toBe(1);
    expect(nextTerminalTextMatchIndex(2, 1, "next")).toBe(0);
    expect(decorateTerminalTextLine(lines[1]!, matches, 1)).toEqual([
      { text: "Er", style: {}, match: true, activeMatch: true },
      {
        text: "ror",
        style: { foreground: "red" },
        match: true,
        activeMatch: true,
      },
      { text: " two", style: {}, match: false, activeMatch: false },
    ]);
  });

  it("counts UTF-8 bytes without requiring TextEncoder in the Lynx runtime", () => {
    expect(utf8ByteLength("abc")).toBe(3);
    expect(utf8ByteLength("你好")).toBe(6);
    expect(utf8ByteLength("🙂")).toBe(4);
  });
  it("appends matching output and ignores another PTY session", () => {
    const output = event({
      type: "output",
      threadId: "thread-1",
      terminalId: "terminal-1",
      createdAt: "2026-08-26T00:00:01.000Z",
      data: " after",
    });
    expect(
      applyTerminalEventToSnapshot({
        event: output,
        snapshot,
        terminalId: "terminal-1",
        threadId: "thread-1",
      })?.history,
    ).toBe("before after");
    expect(
      applyTerminalEventToSnapshot({
        event: { ...output, terminalId: "terminal-2" },
        snapshot,
        terminalId: "terminal-1",
        threadId: "thread-1",
      }),
    ).toBe(snapshot);
  });

  it("replaces from lifecycle snapshots and projects clear/exit/error", () => {
    const restarted = event({
      type: "restarted",
      threadId: "thread-1",
      terminalId: "terminal-1",
      createdAt: "2026-08-26T00:00:02.000Z",
      snapshot: { ...snapshot, history: "restarted" },
    });
    expect(
      applyTerminalEventToSnapshot({
        event: restarted,
        snapshot,
        terminalId: "terminal-1",
        threadId: "thread-1",
      })?.history,
    ).toBe("restarted");
    const cleared = applyTerminalEventToSnapshot({
      event: event({
        type: "cleared",
        threadId: "thread-1",
        terminalId: "terminal-1",
        createdAt: "2026-08-26T00:00:03.000Z",
      }),
      snapshot,
      terminalId: "terminal-1",
      threadId: "thread-1",
    });
    expect(cleared?.history).toBe("");
    const exited = applyTerminalEventToSnapshot({
      event: event({
        type: "exited",
        threadId: "thread-1",
        terminalId: "terminal-1",
        createdAt: "2026-08-26T00:00:04.000Z",
        exitCode: 0,
        exitSignal: null,
      }),
      snapshot,
      terminalId: "terminal-1",
      threadId: "thread-1",
    });
    expect(exited).toMatchObject({ status: "exited", pid: null, exitCode: 0 });
    const errored = applyTerminalEventToSnapshot({
      event: event({
        type: "error",
        threadId: "thread-1",
        terminalId: "terminal-1",
        createdAt: "2026-08-26T00:00:05.000Z",
        message: "failed",
      }),
      snapshot,
      terminalId: "terminal-1",
      threadId: "thread-1",
    });
    expect(errored?.status).toBe("error");
  });
});
