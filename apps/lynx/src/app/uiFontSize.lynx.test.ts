import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@rstest/core";

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
