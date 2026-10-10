import { describe, expect, it } from "@rstest/core";

import {
  createTerminalTextProjector,
  normalizeTerminalClipboardText,
  projectTerminalText,
} from "./terminalTextProjection";

describe("terminal text projection", () => {
  it("normalizes clipboard newlines and removes projected padding per line", () => {
    expect(normalizeTerminalClipboardText("first   \r\nsecond\t \r\nthird")).toBe(
      "first\nsecond\nthird",
    );
  });

  it("removes SGR, mode, OSC title, and bracketed-paste control sequences", () => {
    expect(
      projectTerminalText(
        "\u001b[?2004h\u001b]0;project title\u0007\u001b[34;1mOpenAI Codex\u001b[0m\r\nmarker\u001b[?2004l",
      ),
    ).toBe("OpenAI Codex\nmarker");
  });

  it("applies carriage return, backspace, erase-line, and cursor positioning", () => {
    expect(projectTerminalText("progress 10%\rprogress 20%\b\b5\u001b[K")).toBe("progress 25");
    expect(projectTerminalText("first\r\nthird\u001b[2;1Hsecond")).toBe("first\nsecond");
  });

  it("retains split escape sequences across incremental writes and bounds lines", () => {
    const projector = createTerminalTextProjector({ maxLines: 2 });
    projector.write("one\r\ntwo\r\n\u001b[3");
    projector.write("1mthree\u001b[0m");
    expect(projector.toString()).toBe("two\nthree");
  });

  it("discards DCS/APC payloads and supports C1 string terminators across writes", () => {
    const projector = createTerminalTextProjector();
    projector.write("before\u001bP$qpayload");
    projector.write("\u001b\\after\u009fprivate");
    projector.write(" payload\u009cend");
    expect(projector.toString()).toBe("beforeafterend");
  });

  it("retains bounded SGR foreground and text styles as merged runs", () => {
    const projector = createTerminalTextProjector();
    projector.write("plain \u001b[31;1mred\u001b[22m!\u001b[39m \u001b[3;4mnote\u001b[0m");
    expect(projector.toString()).toBe("plain red! note");
    expect(projector.toStyledRuns()).toEqual([
      { text: "plain ", style: {} },
      { text: "red", style: { bold: true, foreground: "red" } },
      { text: "!", style: { bold: undefined, foreground: "red" } },
      { text: " ", style: { bold: undefined, foreground: undefined } },
      {
        text: "note",
        style: { bold: undefined, foreground: undefined, italic: true, underline: true },
      },
    ]);
  });

  it("preserves SGR state across split writes and overwrites styled cells", () => {
    const projector = createTerminalTextProjector();
    projector.write("\u001b[9");
    projector.write("4mblue\r\u001b[32mgreen\u001b[0m");
    expect(projector.toString()).toBe("green");
    expect(projector.toStyledRuns()).toEqual([{ text: "green", style: { foreground: "green" } }]);
  });

  it("maps bright ANSI and indexed palette boundaries without shifting colors", () => {
    const projector = createTerminalTextProjector();
    projector.write("\u001b[95mmagenta \u001b[96mcyan \u001b[97mwhite \u001b[38;5;16mcube-black");
    expect(projector.toStyledRuns()).toEqual([
      { text: "magenta ", style: { foreground: "bright-magenta" } },
      { text: "cyan ", style: { foreground: "bright-cyan" } },
      { text: "white ", style: { foreground: "bright-white" } },
      { text: "cube-black", style: { foreground: "#000000" } },
    ]);
  });
});
