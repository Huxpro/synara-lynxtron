import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";
import postcss from "postcss";

import postcssConfig from "../../postcss.config.mjs";
import {
  buildColorMixCss,
  colorMixTokenName,
  mixColors,
  readCustomProperties,
  resolveColor,
} from "../../scripts/color-mix.logic.mjs";
import { parseCssColor } from "../../scripts/css-color.logic.mjs";
import { collectColorMixInputs } from "../../scripts/generate-color-mix-tokens.mjs";

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

describe("Native color-mix projection", () => {
  it("keeps the generated tokens in sync with every Native stylesheet", () => {
    const result = buildColorMixCss(collectColorMixInputs());
    expect(read("./native-color-mix-variables.css")).toBe(result.css);
    expect(result.unresolved).toEqual([]);
  });

  it("defines the surface divider exactly as Electron does", () => {
    const declaration = (css: string) =>
      /--app-surface-divider:\s*([^;]+);/.exec(css)?.[1]?.trim() ?? null;
    expect(declaration(read("../app/App.css"))).toBe(
      declaration(read("../../../web/src/index.css")),
    );
  });

  it("reproduces Chromium's computed values measured in Electron", () => {
    const border = parseCssColor("rgba(252, 252, 252, 0.072)", { quantizeLegacyAlpha: true })!;
    const transparent = parseCssColor("transparent")!;
    // --app-surface-divider → color(srgb 0.988 0.988 0.988 / 0.0423529)
    expect(mixColors("srgb", border, 60, transparent, null)?.a).toBeCloseTo(0.0423529, 6);
    // border-border/65 → oklab(0.991 … / 0.0458824)
    const explorer = mixColors("oklab", border, 65, transparent, null)!;
    expect(explorer.a).toBeCloseTo(0.0458824, 6);
    expect(Math.round(explorer.r)).toBe(252);
  });

  it("resolves var() chains per theme and ignores at-rule scoped overrides", () => {
    const properties = readCustomProperties(
      ":root { --a: #ffffff; --b: var(--a); }\n@variant dark { :root { --a: #000000; } }",
      ":root",
    );
    expect(resolveColor("color-mix(in srgb, var(--b) 50%, #000000)", properties)).toMatchObject({
      r: 127.5,
      g: 127.5,
      b: 127.5,
      a: 1,
    });
  });

  it("defines color-mix custom properties by name per theme, honoring cascade scope", () => {
    const themeCss = [
      ".SliceRoot--theme-light { --a: #ffffff; --x: var(--a); --y: #111111; }",
      ".SliceRoot--theme-dark { --a: #000000; --x: color-mix(in srgb, var(--a) 50%, transparent); }",
    ].join("\n");
    const result = buildColorMixCss({
      themePath: "theme.css",
      themeCss,
      baseCss: ":root { --a: #ffffff; }",
      sources: [
        { path: "theme.css", text: themeCss },
        {
          path: "tokens.css",
          text: ":root { --y: color-mix(in srgb, var(--a) 20%, transparent); }",
        },
        {
          path: "app.css",
          text: ".SliceRoot { --z: color-mix(in srgb, var(--a) 10%, transparent); }",
        },
      ],
    });
    const block = (selector: string) =>
      result.css.slice(
        result.css.indexOf(`${selector} {`),
        result.css.indexOf("}", result.css.indexOf(`${selector} {`)),
      );
    const light = block(".SliceRoot--theme-light");
    const dark = block(".SliceRoot--theme-dark");
    // Theme-scoped: only the theme that declares it.
    expect(dark).toContain("  --x: rgba(0, 0, 0, 0.5);");
    expect(light).not.toContain("  --x:");
    // Shared :root: only where the theme block does not redefine it.
    expect(dark).toContain("  --y: rgba(0, 0, 0, 0.2);");
    expect(light).not.toContain("  --y:");
    // .SliceRoot (imported after the theme): every theme.
    expect(light).toContain("  --z: rgba(255, 255, 255, 0.1);");
    expect(dark).toContain("  --z: rgba(0, 0, 0, 0.1);");
  });

  it("drops root-scoped definitions it supplies and projects everything else", async () => {
    const definition = "color-mix(in srgb, var(--color-border) 60%, transparent)";
    const projected = await postcss(postcssConfig.plugins).process(
      `.SliceRoot { --app-surface-divider: ${definition}; }\n.Card { --app-surface-divider: ${definition}; }`,
      { from: undefined },
    );
    expect(projected.css).toBe(
      `.SliceRoot { }\n.Card { --app-surface-divider: var(${colorMixTokenName(definition)}); }`,
    );
  });

  it("projects known expressions and rejects unknown ones at build time", async () => {
    const known = "color-mix(in srgb, var(--color-border) 60%, transparent)";
    const projected = await postcss(postcssConfig.plugins).process(`.a { --x: ${known}; }`, {
      from: undefined,
    });
    expect(projected.css).toBe(`.a { --x: var(${colorMixTokenName(known)}); }`);
    await expect(
      postcss(postcssConfig.plugins).process(
        ".a { color: color-mix(in srgb, var(--nope) 13%, transparent); }",
        { from: undefined },
      ),
    ).rejects.toThrow("color-mix() has no generated token");
  });
});
