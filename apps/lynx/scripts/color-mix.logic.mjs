// Build-time projection of CSS `color-mix()` for Lynx (Node only).
//
// Lynx does not implement color-mix(). This module finds every expression in the
// Native stylesheets, names each one (the token name is a hash, hence
// `node:crypto`), evaluates it per theme against the default theme pack with the
// shared evaluator in color-mix-eval.logic.mjs, and emits:
//   - the generated stylesheet the PostCSS plugin in postcss.config.mjs projects
//     onto (first paint and the default pack);
//   - the runtime manifest the app evaluates against the active theme pack, so the
//     derived colours follow a theme-pack edit.
import { createHash } from "node:crypto";

import {
  evaluateColorMixRecipes,
  extractColorMixExpressions,
  normalizeColorMix,
  referencedCustomProperties,
  resolveColor,
} from "./color-mix-eval.logic.mjs";
import { formatRgba, parseCssColor } from "./css-color.logic.mjs";

export {
  evaluateColorMixRecipes,
  extractColorMixExpressions,
  mixColors,
  normalizeColorMix,
  parseColorMix,
  resolveColor,
} from "./color-mix-eval.logic.mjs";

export const COLOR_MIX_THEMES = Object.freeze({
  light: ".SliceRoot--theme-light",
  dark: ".SliceRoot--theme-dark",
});

export function colorMixTokenName(expression) {
  const digest = createHash("sha1").update(normalizeColorMix(expression)).digest("hex");
  return `--color-mix-${digest.slice(0, 10)}`;
}

/** A block body without its nested blocks (e.g. Tailwind `@variant dark { … }`). */
function ownDeclarations(body) {
  let depth = 0;
  let own = "";
  for (const char of body) {
    if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;
    else if (depth === 0) own += char;
  }
  return own;
}

/**
 * Custom properties declared in top-level blocks whose selector list contains
 * exactly `selector`. Blocks inside at-rules (e.g. Tailwind `@variant dark`)
 * are skipped: they do not apply to the Lynx cascade.
 */
export function readCustomProperties(css, selector) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const properties = {};
  let depth = 0;
  let blockStart = 0;
  let prelude = "";
  let skipDepth = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") {
      if (depth === 0) {
        prelude = text.slice(blockStart, index).trim();
        if (prelude.startsWith("@")) skipDepth = 0;
        blockStart = index + 1;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        if (skipDepth === null) {
          const selectors = prelude.split(",").map((entry) => entry.trim());
          if (selectors.includes(selector)) {
            const body = ownDeclarations(text.slice(blockStart, index));
            for (const declaration of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
              properties[declaration[1]] = declaration[2].trim();
            }
          }
        }
        skipDepth = null;
        blockStart = index + 1;
      }
    }
  }
  return properties;
}

/**
 * Custom properties whose entire value is one color-mix(), declared in
 * top-level (non at-rule) blocks. Lynx does not resolve var() chains inside
 * custom-property values, so these are emitted by name, per theme, with the
 * evaluated literal instead of a token reference.
 */
export function readColorMixDefinitions(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const definitions = [];
  let depth = 0;
  let blockStart = 0;
  let skip = false;
  let prelude = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") {
      if (depth === 0) {
        prelude = text.slice(blockStart, index).trim();
        skip = prelude.startsWith("@");
        blockStart = index + 1;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        if (!skip) {
          const body = ownDeclarations(text.slice(blockStart, index));
          const selectors = prelude.split(",").map((entry) => entry.trim());
          for (const match of body.matchAll(/(--[\w-]+)\s*:\s*(color-mix\([^;]*\))\s*;/g)) {
            const expressions = extractColorMixExpressions(match[2]);
            if (expressions.length === 1 && expressions[0] === match[2].trim()) {
              definitions.push({
                name: match[1],
                expression: normalizeColorMix(match[2]),
                selectors,
              });
            }
          }
        }
        skip = false;
        blockStart = index + 1;
      }
    }
  }
  return definitions;
}

/**
 * Builds the generated token stylesheet. `baseCss` supplies `:root` custom
 * properties (shared tokens and palette); `themeCss` supplies the per-theme
 * blocks that override them.
 */
export function buildColorMixCss({
  sources,
  themeCss,
  baseCss,
  paletteCss = "",
  themePath = null,
}) {
  const occurrences = new Map();
  for (const source of sources) {
    for (const expression of extractColorMixExpressions(source.text)) {
      const normalized = normalizeColorMix(expression);
      if (normalized === "color-mix()") continue; // prose in comments
      const entry = occurrences.get(normalized) ?? { files: new Set() };
      entry.files.add(source.path);
      occurrences.set(normalized, entry);
    }
  }
  const base = widenPaletteToSource(readCustomProperties(baseCss, ":root"), paletteCss);
  const themes = Object.fromEntries(
    Object.entries(COLOR_MIX_THEMES).map(([theme, selector]) => [
      theme,
      { ...base, ...readCustomProperties(themeCss, selector) },
    ]),
  );
  // Root-scoped custom properties defined as one color-mix(). Scope decides
  // which themes receive the literal: a theme block only its own theme; shared
  // `:root` tokens only themes that do not redefine the name (theme blocks are
  // imported later); `.SliceRoot` rules (imported after the theme) every theme.
  const themeSelectors = new Set(Object.values(COLOR_MIX_THEMES));
  const scopeOf = (selectors) =>
    selectors.find((selector) => themeSelectors.has(selector)) ??
    (selectors.includes(".SliceRoot")
      ? ".SliceRoot"
      : selectors.includes(":root")
        ? ":root"
        : null);
  const definitions = new Map();
  for (const source of sources) {
    for (const definition of readColorMixDefinitions(source.text)) {
      const scope = scopeOf(definition.selectors);
      if (!scope) continue;
      const key = `${scope} ${definition.name}`;
      const existing = definitions.get(key);
      if (existing && existing.expression !== definition.expression) {
        throw new Error(
          `${definition.name} is defined as two different color-mix() recipes in ${scope} (${existing.expression} / ${definition.expression}).`,
        );
      }
      definitions.set(key, { name: definition.name, expression: definition.expression, scope });
    }
  }
  const tokens = [];
  const unresolved = [];
  for (const [expression, { files }] of [...occurrences].sort(([a], [b]) => a.localeCompare(b))) {
    const values = {};
    for (const [theme, properties] of Object.entries(themes)) {
      const color = resolveColor(expression, properties);
      if (color) values[theme] = formatRgba(color);
    }
    const record = { name: colorMixTokenName(expression), expression, files: [...files].sort() };
    if (Object.keys(values).length === Object.keys(themes).length)
      tokens.push({ ...record, values });
    else unresolved.push(record);
  }
  const lines = [
    "/*",
    " * GENERATED by apps/lynx/scripts/generate-color-mix-tokens.mjs. Do not edit by hand.",
    " * Lynx has no color-mix(); postcss.config.mjs replaces each expression below with",
    " * its token, evaluated per theme against the Native theme variables.",
    ` * Unresolvable (left as authored): ${unresolved.length}.`,
    " */",
  ];
  const tokenByExpression = new Map(tokens.map((token) => [token.expression, token]));
  const themeDefined = Object.fromEntries(
    Object.entries(COLOR_MIX_THEMES).map(([theme, selector]) => [
      theme,
      new Set(Object.keys(readCustomProperties(themeCss, selector))),
    ]),
  );
  const namedFor = (theme) => {
    const selector = COLOR_MIX_THEMES[theme];
    const chosen = new Map();
    for (const definition of definitions.values()) {
      if (!tokenByExpression.has(definition.expression)) continue;
      const applies =
        definition.scope === selector ||
        definition.scope === ".SliceRoot" ||
        (definition.scope === ":root" && !themeDefined[theme].has(definition.name));
      if (!applies) continue;
      const current = chosen.get(definition.name);
      // Precedence: .SliceRoot (latest import) > theme block > :root.
      const rank = { ".SliceRoot": 3, [selector]: 2, ":root": 1 };
      if (!current || rank[definition.scope] > rank[current.scope])
        chosen.set(definition.name, definition);
    }
    return [...chosen.values()].sort((a, b) => a.name.localeCompare(b.name));
  };
  const namedDefinitionNames = new Set();
  for (const [theme, selector] of Object.entries(COLOR_MIX_THEMES)) {
    lines.push("", `${selector} {`);
    for (const definition of namedFor(theme)) {
      namedDefinitionNames.add(definition.name);
      lines.push(`  /* defined-by-name: ${definition.expression} */`);
      lines.push(
        `  ${definition.name}: ${tokenByExpression.get(definition.expression).values[theme]};`,
      );
    }
    for (const token of tokens) {
      lines.push(`  /* ${token.expression} */`);
      lines.push(`  ${token.name}: ${token.values[theme]};`);
    }
    lines.push("}");
  }
  // The runtime manifest: the same recipes, the properties they read that the app does
  // not compute (the base palette and the theme-block entries the generator adds), and
  // the default-pack values so the default pack costs no evaluation at run time.
  const themeOwn = Object.fromEntries(
    Object.entries(COLOR_MIX_THEMES).map(([theme, selector]) => [
      theme,
      readCustomProperties(themeCss, selector),
    ]),
  );
  const named = Object.fromEntries(
    Object.keys(COLOR_MIX_THEMES).map((theme) => [
      theme,
      Object.fromEntries(
        namedFor(theme).map((definition) => [definition.name, definition.expression]),
      ),
    ]),
  );
  const needed = new Set();
  const visit = (value) => {
    for (const name of referencedCustomProperties(value)) {
      if (needed.has(name)) continue;
      needed.add(name);
      for (const properties of [base, ...Object.values(themeOwn)]) {
        if (properties[name] !== undefined) visit(properties[name]);
      }
    }
  };
  for (const token of tokens) visit(token.expression);
  const pick = (properties) =>
    Object.fromEntries(
      Object.entries(properties)
        .filter(([name]) => needed.has(name))
        .sort(([a], [b]) => a.localeCompare(b)),
    );
  const tokenRecipes = Object.fromEntries(tokens.map((token) => [token.name, token.expression]));
  const runtime = {
    tokens: tokenRecipes,
    named,
    properties: {
      base: pick(base),
      ...Object.fromEntries(
        Object.keys(COLOR_MIX_THEMES).map((theme) => [theme, pick(themeOwn[theme])]),
      ),
    },
    defaults: Object.fromEntries(
      Object.keys(COLOR_MIX_THEMES).map((theme) => [
        theme,
        evaluateColorMixRecipes(
          [...Object.entries(named[theme]), ...Object.entries(tokenRecipes)],
          themes[theme],
        ),
      ]),
    ),
  };
  return {
    css: `${lines.join("\n")}\n`,
    tokens,
    unresolved,
    namedDefinitions: [...namedDefinitionNames].sort(),
    runtime,
  };
}

/**
 * Lynx cannot parse oklch(), so the base palette is restated in sRGB hex, which clips a
 * Tailwind v4 colour that lies outside sRGB. Chromium mixes the colour as specified and
 * clips only when it paints. Where `paletteCss` (Tailwind's theme.css) declares the same
 * name and that colour clips to the restated hex, mix with the source colour instead.
 */
export function widenPaletteToSource(base, paletteCss) {
  const widened = { ...base };
  for (const [, name, source] of paletteCss.matchAll(
    /(--color-[\w-]+):\s*(okl(?:ch|ab)\([^)]*\))/g,
  )) {
    const restated = base[name] === undefined ? null : parseCssColor(base[name]);
    const clipped = parseCssColor(source);
    if (restated && clipped && formatRgba(restated) === formatRgba(clipped)) widened[name] = source;
  }
  return widened;
}

/** Token names present in a generated stylesheet (the plugin's allow-list). */
export function generatedColorMixTokenNames(generatedCss) {
  return new Set(
    [...generatedCss.matchAll(/(--color-mix-[0-9a-f]{10}):/g)].map((match) => match[1]),
  );
}

/** Custom properties the generated stylesheet defines by name (their authored declarations are dropped). */
export function generatedColorMixDefinitionNames(generatedCss) {
  return new Set(
    [...generatedCss.matchAll(/defined-by-name: [^\n]*\*\/\n\s*(--[\w-]+):/g)].map(
      (match) => match[1],
    ),
  );
}

/** Replaces every projected color-mix() in a declaration value with its token. */
export function projectColorMixValue(value, knownTokens) {
  let result = value;
  for (const expression of extractColorMixExpressions(value)) {
    const name = colorMixTokenName(expression);
    if (knownTokens.has(name)) result = result.replace(expression, `var(${name})`);
  }
  return result;
}
