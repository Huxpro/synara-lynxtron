import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@rstest/core";

import {
  APP_LINE_HEIGHT_ROLES,
  appLineHeightVariableName,
  resolveSliceTypographyVariables,
} from "./appTypography.logic";

// UI text follows the size chosen in Settings › Appearance (root AGENTS.md). On Lynx the
// stylesheets size text with `var(--app-font-size-*)`, which the root inline map sets for
// the chosen size (appTypography.logic.ts). This is the Lynx counterpart of upstream's
// apps/web/src/uiFontSize.test.ts: literal sizes in the band the scale covers (9–14.5px)
// may shrink but must not grow. Titles and large headings (15px and up) and sizes below
// the scale (badges, 8px and under) are outside the band, as upstream allows.
//
// What is left: the Components Lab and the host-input probe (developer surfaces, 21), the
// terminal's output cells, which follow the separate terminal font size (2), and four
// fractional sizes that have no step on the scale.
const MAX_FIXED_STYLESHEET_SIZES = 27;
const MAX_FIXED_CLASS_SIZES = 1;

const FIXED_STYLESHEET_SIZE = /font-size:\s*(?:9|1[0-4])(?:\.\d+)?px/g;
// Same pattern as upstream's test.
const FIXED_CLASS_SIZE = /(?<![\w[-])text-(?:xs|sm|base|\[(?:9|1[0-4])(?:\.5)?px\])(?![\w-])/g;

// Line heights follow the size too: `var(--app-line-height-<step>-<px>, <px>px)`, a role
// the root inline map scales with its font step (APP_LINE_HEIGHT_ROLES). Literal pixel
// line heights may shrink but must not grow. What is left: line boxes upstream fixes
// (`leading-4`, `leading-5`, …) or that have not been compared with Electron yet, text
// with a fixed font size, and the developer surfaces.
const MAX_FIXED_STYLESHEET_LINE_HEIGHTS = 271;
// A `--type-*-line-height: 18px` declaration is a role's default, not a rule's line box.
const FIXED_STYLESHEET_LINE_HEIGHT = /(?<![\w-])line-height:\s*\d+(?:\.\d+)?px/g;
const LINE_HEIGHT_ROLE_USE =
  /line-height:\s*var\(--app-line-height-([a-z0-9-]+?)-(\d+(?:p\d+)?),\s*([\d.]+)px\)/g;

const srcDir = fileURLToPath(new URL("..", import.meta.url));

function sourceFiles(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" ? [] : sourceFiles(path, pattern);
    return pattern.test(entry.name) ? [path] : [];
  });
}

function hits(files: readonly string[], pattern: RegExp, stripComments: (code: string) => string) {
  return files.flatMap((path) =>
    [...stripComments(readFileSync(path, "utf8")).matchAll(pattern)].map(
      (match) => `${relative(srcDir, path)}: ${match[0]}`,
    ),
  );
}

describe("Lynx UI font sizes", () => {
  it("does not add literal font sizes to the stylesheets", () => {
    const found = hits(sourceFiles(srcDir, /\.css$/), FIXED_STYLESHEET_SIZE, (code) =>
      code.replace(/\/\*[\s\S]*?\*\//g, ""),
    );
    expect(
      found.length,
      `Use var(--app-font-size-ui | -ui-sm | -ui-xs | -ui-2xs | -ui-lg, <default>px) instead of:\n${found.join("\n")}`,
    ).toBeLessThanOrEqual(MAX_FIXED_STYLESHEET_SIZES);
  });

  it("does not add literal line heights to the stylesheets", () => {
    const found = hits(sourceFiles(srcDir, /\.css$/), FIXED_STYLESHEET_LINE_HEIGHT, (code) =>
      code.replace(/\/\*[\s\S]*?\*\//g, ""),
    );
    expect(
      found.length,
      "Use var(--app-line-height-<step>-<px>, <px>px) with a role from APP_LINE_HEIGHT_ROLES",
    ).toBeLessThanOrEqual(MAX_FIXED_STYLESHEET_LINE_HEIGHTS);
  });

  it("defines every line-height role the stylesheets use, with the literal as its default", () => {
    const defaults = resolveSliceTypographyVariables(13, 12);
    const used = new Set<string>();
    for (const path of sourceFiles(srcDir, /\.css$/)) {
      for (const match of readFileSync(path, "utf8").matchAll(LINE_HEIGHT_ROLE_USE)) {
        const name = `--app-line-height-${match[1]}-${match[2]}`;
        used.add(name);
        // The fallback is the value at the default size: that size keeps its geometry.
        expect(defaults[name], `${relative(srcDir, path)}: ${match[0]}`).toBe(`${match[3]}px`);
        expect(match[2]!.replace("p", ".")).toBe(match[3]);
      }
    }
    const defined = APP_LINE_HEIGHT_ROLES.map(([step, px]) => appLineHeightVariableName(step, px));
    expect([...used].toSorted()).toEqual(defined.toSorted());
  });

  it("scales a line-height role with its font step", () => {
    const at16 = resolveSliceTypographyVariables(16, 12);
    // ui-sm is 12px at 13 and 15px at 16: an 18px line box (1.5) becomes 22.5px.
    expect(at16["--app-font-size-ui-sm"]).toBe("15px");
    expect(at16["--app-line-height-ui-sm-18"]).toBe("22.5px");
    expect(at16["--app-line-height-ui-19p5"]).toBe("24px");
    expect(at16["--app-line-height-ui-xs-16p5"]).toBe("19.5px");
    expect(at16["--app-line-height-ui-lg-21"]).toBe("25.5px");
    // The tokens.css roles: their literals at the default size, the same multiple elsewhere.
    const at13 = resolveSliceTypographyVariables(13, 12);
    const tokens = readFileSync(join(srcDir, "../../web/src/tokens.css"), "utf8");
    for (const role of ["ui-row", "ui-supporting", "ui-meta"]) {
      const literal = new RegExp(`--type-${role}-line-height: ([\\d.]+px);`).exec(tokens)?.[1];
      expect(at13[`--type-${role}-line-height`]).toBe(literal);
    }
    expect(at16["--type-ui-row-line-height"]).toBe("22.5px");
    // A step the scale clamps keeps its line box with it.
    const at11 = resolveSliceTypographyVariables(11, 12);
    expect(at11["--app-font-size-ui-2xs"]).toBe("9px");
    expect(at11["--app-line-height-ui-2xs-15"]).toBe("13.5px");
  });

  it("does not add fixed Tailwind text sizes to Lynx components", () => {
    const files = sourceFiles(srcDir, /\.tsx?$/).filter((path) => !/\.test\.tsx?$/.test(path));
    const found = hits(files, FIXED_CLASS_SIZE, (code) =>
      code
        .split("\n")
        .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line))
        .join("\n"),
    );
    expect(
      found.length,
      `Use text-ui / text-ui-sm / text-ui-xs / text-ui-lg instead of:\n${found.join("\n")}`,
    ).toBeLessThanOrEqual(MAX_FIXED_CLASS_SIZES);
  });
});
