import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { readWebThemeFontSizes } from "./web-theme-font-sizes.logic.mjs";

test("reads font-size tokens from @theme blocks only", () => {
  const css = `
    :root { --text-outside: 1px; }
    @theme inline {
      --font-sans: var(--font-ui-family);
      /* --text-commented: 1px; */
      --text-ui: var(--app-font-size-ui);
      --text-ui-xl: calc(var(--app-font-size-ui-lg) * 1.3);
      --text-ui--line-height: 1.4;
    }
    @theme inline { --text-ui: 14px; --color-info: var(--info); }
  `;
  assert.deepEqual(readWebThemeFontSizes(css), {
    ui: "14px",
    "ui-xl": "calc(var(--app-font-size-ui-lg) * 1.3)",
  });
});

test("the web theme declares the typography scale the shared components use", () => {
  const css = fs.readFileSync(new URL("../../web/src/index.css", import.meta.url), "utf8");
  const fontSizes = readWebThemeFontSizes(css);
  for (const name of ["ui", "ui-lg", "ui-sm", "ui-xs", "ui-2xs", "ui-meta", "chat", "chat-meta"]) {
    assert.match(fontSizes[name] ?? "", /^var\(--app-font-size-[a-z0-9-]+\)$/, name);
  }
});
