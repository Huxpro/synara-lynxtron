import { describe, expect, it } from "@rstest/core";

import { resolveLynxTerminalTypography } from "./terminalAppearance.logic";

describe("resolveLynxTerminalTypography", () => {
  it("preserves the established Lynx monospace fallback", () => {
    expect(resolveLynxTerminalTypography({ fontFamily: "  ", fontSizePx: 12 })).toEqual({
      fontFamily: '"SFMono-Regular", ui-monospace, monospace',
      fontSize: "12px",
      fontWeight: "300",
      lineHeight: "18px",
    });
  });

  it("applies free-form font stacks and canonical size bounds", () => {
    expect(
      resolveLynxTerminalTypography({
        fontFamily: "JetBrains Mono, monospace",
        fontSizePx: 99,
      }),
    ).toEqual({
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "22px",
      fontWeight: "300",
      lineHeight: "33px",
    });
  });
});
