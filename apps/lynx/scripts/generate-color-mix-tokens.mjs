#!/usr/bin/env node
// Regenerates src/generated/native-color-mix-variables.css: one per-theme token
// for every color-mix() expression in the Native stylesheets. A test fails while
// the committed file is stale; the PostCSS plugin only projects known tokens.
import { globSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildColorMixCss } from "./color-mix.logic.mjs";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
export const COLOR_MIX_OUTPUT = "src/generated/native-color-mix-variables.css";
export const COLOR_MIX_SHARED_TOKENS = "../web/src/tokens.css";

export function collectColorMixInputs(root = appRoot) {
  const read = (path) => readFileSync(resolve(root, path), "utf8");
  const files = [
    ...globSync("src/**/*.css", { cwd: root }).filter((path) => path !== COLOR_MIX_OUTPUT),
    COLOR_MIX_SHARED_TOKENS,
  ].sort();
  return {
    sources: files.map((path) => ({ path: relative(root, resolve(root, path)), text: read(path) })),
    themeCss: read("src/generated/native-theme-variables.css"),
    baseCss: `${read(COLOR_MIX_SHARED_TOKENS)}\n${read("src/app/lynx-overrides.css")}`,
    themePath: "src/generated/native-theme-variables.css",
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = buildColorMixCss(collectColorMixInputs());
  writeFileSync(new URL(`../${COLOR_MIX_OUTPUT}`, import.meta.url), result.css);
  console.log(`[color-mix] ${result.tokens.length} tokens, ${result.unresolved.length} unresolved`);
  for (const entry of result.unresolved) {
    console.log(`  unresolved: ${entry.expression} (${entry.files.join(", ")})`);
  }
}
