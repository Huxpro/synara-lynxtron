// FILE: scripts/web-theme-font-sizes.logic.mjs
// Purpose: Read the font-size theme tokens upstream declares in the web app's
//   Tailwind v4 `@theme` blocks (`--text-<name>: <value>;`), so the Tailwind v3
//   config that generates the Lynx utility CSS emits the same `text-<name>`
//   utilities (`text-ui`, `text-ui-sm`, `text-chat-meta`, …) with no hand list.
// Layer: build tooling (pure)

const THEME_BLOCK_PATTERN = /@theme[^{]*\{([^}]*)\}/g;
const FONT_SIZE_TOKEN_PATTERN = /--text-([a-z0-9-]+)\s*:\s*([^;]+);/g;

/**
 * `{ ui: "var(--app-font-size-ui)", … }` from every `@theme` block of `cssText`.
 * A later declaration of the same token wins, as in CSS. Tokens that only
 * qualify another one (`--text-ui--line-height`) are not font sizes.
 */
export function readWebThemeFontSizes(cssText) {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const fontSizes = {};
  for (const block of withoutComments.matchAll(THEME_BLOCK_PATTERN)) {
    for (const [, name, value] of block[1].matchAll(FONT_SIZE_TOKEN_PATTERN)) {
      if (name.includes("--")) continue;
      fontSizes[name] = value.trim();
    }
  }
  return fontSizes;
}
