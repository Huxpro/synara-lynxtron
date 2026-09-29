// Build-time projection of CSS `color-mix()` for Lynx.
//
// Lynx does not implement color-mix(): with var() arguments it computes to
// transparent, with literals the declaration is dropped. Native CSS keeps the
// exact recipes Electron uses (so reviews compare like with like); this module
// evaluates each distinct expression per theme — resolving var() against the
// Native theme exactly as the browser would — and the PostCSS plugin in
// postcss.config.mjs swaps every occurrence for its generated token.
import { createHash } from "node:crypto";

import { formatRgba, oklabToSrgb255, parseCssColor, srgb255ToOklab } from "./css-color.logic.mjs";

export const COLOR_MIX_THEMES = Object.freeze({
  light: ".SliceRoot--theme-light",
  dark: ".SliceRoot--theme-dark",
});

/** Every balanced `color-mix(…)` substring in `text`, outermost only. */
export function extractColorMixExpressions(text) {
  const expressions = [];
  let index = 0;
  for (;;) {
    const start = text.indexOf("color-mix(", index);
    if (start < 0) return expressions;
    let depth = 0;
    let end = start + "color-mix(".length;
    for (; end < text.length; end += 1) {
      if (text[end] === "(") depth += 1;
      else if (text[end] === ")") {
        if (depth === 0) break;
        depth -= 1;
      }
    }
    expressions.push(text.slice(start, end + 1));
    index = end + 1;
  }
}

export function normalizeColorMix(expression) {
  return expression.replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
}

export function colorMixTokenName(expression) {
  const digest = createHash("sha1").update(normalizeColorMix(expression)).digest("hex");
  return `--color-mix-${digest.slice(0, 10)}`;
}

function splitTopLevel(text, separator = ",") {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseStop(stop) {
  const tokens = splitTopLevel(stop, " ");
  const percentIndex = tokens.findIndex((token) => /^-?[\d.]+%$/.test(token));
  if (percentIndex < 0) return { color: stop.trim(), percent: null };
  const percent = Number.parseFloat(tokens[percentIndex]);
  tokens.splice(percentIndex, 1);
  return { color: tokens.join(" "), percent };
}

export function parseColorMix(expression) {
  const normalized = normalizeColorMix(expression);
  const inner = normalized.slice("color-mix(".length, -1);
  const [method, first, second, ...rest] = splitTopLevel(inner);
  const space = /^in\s+(\w+)/.exec(method ?? "")?.[1];
  if (!space || !first || !second || rest.length > 0) return null;
  return { space, stops: [parseStop(first), parseStop(second)] };
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
 * CSS Color 5 color-mix(): normalize percentages, interpolate premultiplied
 * components in the named space, scale alpha when percentages sum below 100%.
 */
export function mixColors(space, first, firstPercent, second, secondPercent) {
  let p1 = firstPercent;
  let p2 = secondPercent;
  if (p1 === null && p2 === null) p1 = p2 = 50;
  else if (p1 === null) p1 = 100 - p2;
  else if (p2 === null) p2 = 100 - p1;
  const sum = p1 + p2;
  if (sum <= 0) return null;
  const alphaMultiplier = sum < 100 ? sum / 100 : 1;
  const w1 = p1 / sum;
  const w2 = p2 / sum;
  const toSpace = (color) =>
    space === "oklab" ? srgb255ToOklab(color.r, color.g, color.b) : [color.r, color.g, color.b];
  const c1 = toSpace(first);
  const c2 = toSpace(second);
  const alpha = first.a * w1 + second.a * w2;
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mixed = c1.map(
    (value, index) => (value * first.a * w1 + c2[index] * second.a * w2) / alpha,
  );
  const [r, g, b] = space === "oklab" ? oklabToSrgb255(...mixed) : mixed;
  return { r, g, b, a: alpha * alphaMultiplier };
}

/** Resolves a color value against a custom-property map; null if unresolvable. */
export function resolveColor(value, properties, depth = 0) {
  if (depth > 16) return null;
  const text = value.trim();
  const variable = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(text);
  if (variable) {
    const declared = properties[variable[1]];
    if (declared !== undefined) return resolveColor(declared, properties, depth + 1);
    return variable[2] === undefined ? null : resolveColor(variable[2], properties, depth + 1);
  }
  if (text.startsWith("color-mix(")) {
    const parsed = parseColorMix(text);
    if (!parsed || !["srgb", "oklab"].includes(parsed.space)) return null;
    const [first, second] = parsed.stops.map((stop) =>
      resolveColor(stop.color, properties, depth + 1),
    );
    if (!first || !second) return null;
    return mixColors(parsed.space, first, parsed.stops[0].percent, second, parsed.stops[1].percent);
  }
  return parseCssColor(text, { quantizeLegacyAlpha: true });
}

/**
 * Builds the generated token stylesheet. `baseCss` supplies `:root` custom
 * properties (shared tokens and palette); `themeCss` supplies the per-theme
 * blocks that override them.
 */
export function buildColorMixCss({ sources, themeCss, baseCss, themePath = null }) {
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
  const base = readCustomProperties(baseCss, ":root");
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
  return {
    css: `${lines.join("\n")}\n`,
    tokens,
    unresolved,
    namedDefinitions: [...namedDefinitionNames].sort(),
  };
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
