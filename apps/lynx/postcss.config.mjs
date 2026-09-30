// Lynx does not implement CSS color-mix(). Every expression is evaluated per
// theme by scripts/generate-color-mix-tokens.mjs; this plugin swaps each one
// for its generated token so Native CSS can keep Electron's exact recipes.
import { readFileSync } from "node:fs";

import {
  COLOR_MIX_THEMES,
  colorMixTokenName,
  extractColorMixExpressions,
  generatedColorMixDefinitionNames,
  generatedColorMixTokenNames,
  projectColorMixValue,
} from "./scripts/color-mix.logic.mjs";

const generatedCss = readFileSync(
  new URL("./src/generated/native-color-mix-variables.css", import.meta.url),
  "utf8",
);
const knownTokens = generatedColorMixTokenNames(generatedCss);
// Lynx does not resolve var() chains inside custom properties, so properties
// defined as a color-mix() get their per-theme literal from the generated
// stylesheet; the authored declaration is dropped.
const definedByName = generatedColorMixDefinitionNames(generatedCss);
const ROOT_SCOPES = new Set([":root", ".SliceRoot", ...Object.values(COLOR_MIX_THEMES)]);

const synaraLynxColorMix = () => ({
  postcssPlugin: "synara-lynx-color-mix",
  Declaration(declaration) {
    if (!declaration.value.includes("color-mix(")) return;
    const selectors = (declaration.parent?.selector ?? "").split(",").map((entry) => entry.trim());
    if (
      definedByName.has(declaration.prop) &&
      selectors.some((selector) => ROOT_SCOPES.has(selector))
    ) {
      declaration.remove();
      return;
    }
    for (const expression of extractColorMixExpressions(declaration.value)) {
      if (!knownTokens.has(colorMixTokenName(expression))) {
        throw declaration.error(
          `color-mix() has no generated token: ${expression}. Run \`node scripts/generate-color-mix-tokens.mjs\`.`,
        );
      }
    }
    declaration.value = projectColorMixValue(declaration.value, knownTokens);
  },
});
synaraLynxColorMix.postcss = true;

// Tailwind escapes `,` in arbitrary-value class names as `\2c `. Unminified
// (dev) output can wrap those selectors so the escape is followed by a newline
// and indentation, which the Lynx-for-Web CSS encoder cannot parse. A CSS hex
// escape consumes exactly one trailing whitespace, so collapse a wrapped run to
// one space to keep the selector identical while making it single-line.
const HEX_ESCAPE_WRAPPED_WHITESPACE = /(\\[0-9a-fA-F]{1,6})[ \t]*\r?\n\s*/g;
const synaraLynxSelectorEscapes = () => ({
  postcssPlugin: "synara-lynx-selector-escapes",
  Rule(rule) {
    if (!rule.selector.includes("\\")) return;
    const normalized = rule.selector.replace(HEX_ESCAPE_WRAPPED_WHITESPACE, "$1 ");
    if (normalized !== rule.selector) rule.selector = normalized;
  },
});
synaraLynxSelectorEscapes.postcss = true;

export default { plugins: [synaraLynxColorMix, synaraLynxSelectorEscapes] };
