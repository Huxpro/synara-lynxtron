import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("shared primitive geometry", () => {
  const css = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");

  it("keeps icon-only buttons square across the desktop size axis", () => {
    expect(css).toMatch(
      /\.LxButton--icon-chip,\s*\.LxButton--icon-xs\s*\{[^}]*width:\s*24px;[^}]*min-width:\s*24px;/s,
    );
    expect(css).toMatch(/\.LxButton--icon-sm\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;/s);
    expect(css).toMatch(/\.LxButton--icon\s*\{[^}]*width:\s*32px;[^}]*min-width:\s*32px;/s);
    expect(css).toMatch(/\.LxButton--icon-lg\s*\{[^}]*width:\s*36px;[^}]*min-width:\s*36px;/s);
    expect(css).toMatch(/\.LxButton--icon-xl\s*\{[^}]*width:\s*40px;[^}]*min-width:\s*40px;/s);
  });

  it("matches the Electron extra-small corner radius", () => {
    expect(css).toMatch(
      /\.LxButton--xs,\s*\.LxButton--icon-xs\s*\{[^}]*min-height:\s*24px;[^}]*border-radius:\s*6px;/s,
    );
  });

  it("matches Electron horizontal insets across text button sizes", () => {
    expect(css).toMatch(/\.LxButton\s*\{[^}]*padding:\s*6px 11px;/s);
    expect(css).toMatch(/\.LxButton--xs\s*\{[^}]*padding-left:\s*7px;[^}]*padding-right:\s*7px;/s);
    expect(css).toMatch(/\.LxButton--sm,[^{]*\{[^}]*padding:\s*4px 9px;/s);
    expect(css).toMatch(
      /\.LxButton--lg\s*\{[^}]*padding-left:\s*13px;[^}]*padding-right:\s*13px;/s,
    );
    expect(css).toMatch(
      /\.LxButton--xl\s*\{[^}]*padding-left:\s*15px;[^}]*padding-right:\s*15px;/s,
    );
  });

  it("matches the Electron text line boxes across the Button size axis", () => {
    expect(css).toMatch(
      /\.LxButton__text\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*500;[^}]*line-height:\s*18px;/s,
    );
    expect(css).toMatch(
      /\.LxButton--xs \.LxButton__text\s*\{[^}]*font-size:\s*10px;[^}]*line-height:\s*15px;/s,
    );
    expect(css).toMatch(
      /\.LxButton--xl \.LxButton__text\s*\{[^}]*font-size:\s*13px;[^}]*line-height:\s*19\.5px;/s,
    );
    expect(css).toMatch(
      /\.LxButton--chip \.LxButton__text\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s,
    );
  });

  it("matches the Electron capsule shape typography", () => {
    expect(css).toMatch(/\.LxButton--capsule\s*\{[^}]*border-radius:\s*999px;/s);
    expect(css).toMatch(/\.LxButton--capsule \.LxButton__text\s*\{[^}]*font-weight:\s*400;/s);
  });

  it("matches the Electron radius tokens for generic menus and dialogs", () => {
    expect(css).toMatch(/\.LxMenuPopup\s*\{[^}]*border-radius:\s*18px;[^}]*box-shadow:/s);
    expect(css).toMatch(
      /\.LxDialogPopup\s*\{[^}]*border-color:\s*var\(--color-border-light\);[^}]*border-radius:\s*22px;[^}]*box-shadow:\s*0 16px 50px -12px rgba\(0, 0, 0, 0\.34\);/s,
    );
    expect(css).toMatch(
      /\.SliceRoot--theme-dark \.LxDialogPopup\s*\{[^}]*box-shadow:\s*0 16px 50px -12px rgba\(0, 0, 0, 0\.7\);/s,
    );
  });

  it("keeps control state paint aligned with the Electron primitives", () => {
    const tokens = readFileSync(new URL("../../../../web/src/tokens.css", import.meta.url), "utf8");
    const tooltip = readFileSync(new URL("./tooltip.lynx.tsx", import.meta.url), "utf8");
    const app = readFileSync(new URL("../../app/App.css", import.meta.url), "utf8");

    expect(tokens).toContain("--control-disabled-opacity: 0.64;");
    expect(tokens).toContain("--control-focus-ring-color:");
    expect(tokens).toContain("--control-input-focus-border:");
    expect(app).toContain("--control-focus-ring-color: rgba(1, 105, 204, 0.6);");
    expect(app).toContain("--control-input-focus-border: rgba(13, 13, 13, 0.3);");
    expect(app).toContain("--control-focus-ring-color: rgba(51, 134, 214, 0.378);");
    expect(app).toContain("--control-input-focus-border: rgba(252, 252, 252, 0.3);");
    expect(css.match(/opacity:\s*var\(--control-disabled-opacity\);/g)).toHaveLength(6);
    expect(css).toMatch(
      /\.LxButton\.ui-focus\s*\{[^}]*box-shadow:[^;]*var\(--control-focus-ring-color\);/s,
    );
    expect(css).toMatch(
      /\.LxInputControl\.ui-focus\s*\{[^}]*border-color:\s*var\(--control-input-focus-border\);/s,
    );
    expect(css).toMatch(
      /\.LxButton--prominent\s*\{[^}]*border-radius:\s*999px;[^}]*background-color:\s*var\(--foreground\);[^}]*color:\s*var\(--color-background-surface\);/s,
    );
    expect(css).toMatch(
      /\.LxButton--prominent\.ui-disabled\s*\{[^}]*opacity:\s*0\.2;[^}]*transform:\s*none;/s,
    );
    expect(css).toMatch(
      /\.LxTooltipPopup\s*\{[^}]*width:\s*max-content;[^}]*max-width:\s*260px;[^}]*padding:\s*4px 8px;[^}]*border-radius:\s*10px;[^}]*box-shadow:/s,
    );
    expect(css).toMatch(
      /\.LxTooltipPopup--picker\s*\{[^}]*border-radius:\s*10\.4px;[^}]*box-shadow:/s,
    );
    expect(css).toMatch(/\.LxTooltipText\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s);
    expect(tooltip).toContain("props.variant === 'picker' && 'LxTooltipPopup--picker'");
  });

  it("maps the shared ScrollArea orientation to the native direction property", () => {
    const source = readFileSync(new URL("./scroll-area.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("scroll-orientation={orientation}");
  });
});
