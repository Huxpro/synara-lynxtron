// CSS `color-mix()` evaluation for Lynx: pure and runtime-safe (no Node built-ins).
//
// Lynx does not implement color-mix(): with var() arguments it computes to
// transparent, with literals the declaration is dropped. Native CSS keeps the
// exact recipes Electron uses; each distinct expression is a token
// (`--color-mix-<hash>`) or a custom property defined by name, and both are
// evaluated here against a custom-property map, resolving var() as the browser
// would. Two callers share this module so their arithmetic cannot drift:
//   - scripts/color-mix.logic.mjs (Node, build time): evaluates every recipe
//     against the default theme pack for the generated stylesheet;
//   - src/app/appTheme.logic.ts (Lynx, run time): evaluates the same recipes
//     against the active theme pack and puts the results in the root inline map.
import {
  extendedSrgb255ToOklab,
  formatRgba,
  oklabToExtendedSrgb255,
  parseCssColor,
} from "./css-color.logic.mjs";

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

/**
 * CSS Color 5 color-mix(): normalize percentages, interpolate premultiplied
 * components in the named space, scale alpha when percentages sum below 100%.
 * Channels are not clipped to the sRGB gamut on the way in or out: Chromium mixes
 * the colour as specified (a Tailwind v4 oklch colour can lie outside sRGB) and
 * clips only when it paints, which `formatRgba` does.
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
    space === "oklab"
      ? extendedSrgb255ToOklab(color.r, color.g, color.b)
      : [color.r, color.g, color.b];
  const c1 = toSpace(first);
  const c2 = toSpace(second);
  const alpha = first.a * w1 + second.a * w2;
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mixed = c1.map(
    (value, index) => (value * first.a * w1 + c2[index] * second.a * w2) / alpha,
  );
  const [r, g, b] = space === "oklab" ? oklabToExtendedSrgb255(...mixed) : mixed;
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
  return parseCssColor(text, { quantizeLegacyAlpha: true, clipToGamut: false });
}

/**
 * Evaluates `[name, expression]` recipes against a custom-property map and returns
 * `{ name: "rgba(…)" }` for every recipe that resolves. Recipes that share an
 * expression are evaluated once.
 */
export function evaluateColorMixRecipes(recipes, properties) {
  const byExpression = new Map();
  const values = {};
  for (const [name, expression] of recipes) {
    let value = byExpression.get(expression);
    if (value === undefined) {
      const color = resolveColor(expression, properties);
      value = color ? formatRgba(color) : null;
      byExpression.set(expression, value);
    }
    if (value !== null) values[name] = value;
  }
  return values;
}

/** Custom-property names a value reads through var(), fallbacks included. */
export function referencedCustomProperties(value) {
  return [...String(value).matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);
}
