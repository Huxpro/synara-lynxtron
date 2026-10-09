// FILE: adapters/webIcons.lynx.ts
// Purpose: Lynx target of `~/lib/icons` for the shared Web modules Lynx compiles
//   (resolved in its place by lynx.config.ts). Upstream's icon module now inlines
//   Hugeicons as DOM `<svg>` JSX (`lib/hugeicons.tsx`), which cannot enter the
//   Lynx bundle; those modules only need the icon names and the Lynx glyphs.
// Layer: L1 platform adapter (lynx implementation)

export * from "../lib/icons.lynx";

/**
 * Basename of the Keybindings glyph (`settingsNavigation.ts`). Mirrors
 * `apps/web/src/lib/icons.tsx`; `webIcons.lynx.test.ts` fails when they drift.
 */
export const KEYBINDINGS_ICON_NAME = "shortcut";
