import { describe, expect, it } from "@rstest/core";

import { terminalUnicodeCellWidth } from "./terminalUnicodeWidth";

describe("terminalUnicodeCellWidth", () => {
  it("matches xterm Unicode 11 width for representative glyphs", () => {
    expect(terminalUnicodeCellWidth("A".codePointAt(0)!)).toBe(1);
    expect(terminalUnicodeCellWidth("你".codePointAt(0)!)).toBe(2);
    expect(terminalUnicodeCellWidth("🙂".codePointAt(0)!)).toBe(2);
    expect(terminalUnicodeCellWidth(0x20000)).toBe(2);
  });
});
