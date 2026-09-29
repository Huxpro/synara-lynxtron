import { describe, expect, it } from "@rstest/core";

import { colorizeLynxSvg, resolveLynxSvgColor } from "./themedSvg.lynx";

const palette = {
  foreground: "#fcfcfc",
  mutedForeground: "rgba(252, 252, 252, 0.6)",
  iconSecondary: "rgba(252, 252, 252, 0.58)",
};

describe("Lynx SVG theme projection", () => {
  it("maps semantic current and muted colors to explicit SVG paint", () => {
    expect(resolveLynxSvgColor("currentColor", palette)).toBe("#fcfcfc");
    expect(resolveLynxSvgColor("var(--foreground)", palette)).toBe("#fcfcfc");
    expect(resolveLynxSvgColor("var(--muted-foreground)", palette)).toBe(
      "rgba(252, 252, 252, 0.6)",
    );
    expect(resolveLynxSvgColor("var(--color-icon-secondary)", palette)).toBe(
      "rgba(252, 252, 252, 0.58)",
    );
    expect(resolveLynxSvgColor("#22a06b", palette)).toBe("#22a06b");
  });

  it("replaces every currentColor occurrence in inline SVG content", () => {
    expect(
      colorizeLynxSvg('<svg fill="currentColor"><path stroke="currentColor"/></svg>', "#fcfcfc"),
    ).toBe('<svg fill="#fcfcfc"><path stroke="#fcfcfc"/></svg>');
  });
});
