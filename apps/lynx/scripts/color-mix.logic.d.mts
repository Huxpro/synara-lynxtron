// Types for color-mix.logic.mjs (build-time script, consumed by typed tests).

export type { ColorMixSpace, ColorMixStop } from "./color-mix-eval.logic.mjs";
export {
  evaluateColorMixRecipes,
  extractColorMixExpressions,
  mixColors,
  normalizeColorMix,
  parseColorMix,
  resolveColor,
} from "./color-mix-eval.logic.mjs";

export type ColorMixTheme = "light" | "dark";

export interface ColorMixSource {
  readonly path: string;
  readonly text: string;
}

export interface ColorMixDefinition {
  readonly name: string;
  readonly expression: string;
  readonly selectors: readonly string[];
}

export interface ColorMixTokenRecord {
  readonly name: string;
  readonly expression: string;
  readonly files: readonly string[];
}

export interface ColorMixToken extends ColorMixTokenRecord {
  readonly values: Readonly<Record<ColorMixTheme, string>>;
}

export interface ColorMixBuildInput {
  readonly sources: readonly ColorMixSource[];
  readonly themeCss: string;
  readonly baseCss: string;
  /** Tailwind's theme.css: the unclipped source of the restated base palette. */
  readonly paletteCss?: string;
  readonly themePath?: string | null;
}

export interface ColorMixBuildResult {
  readonly css: string;
  readonly tokens: readonly ColorMixToken[];
  readonly unresolved: readonly ColorMixTokenRecord[];
  readonly namedDefinitions: readonly string[];
  readonly runtime: ColorMixRuntimeManifest;
}

/** What the app needs to evaluate the recipes against the active theme pack. */
export interface ColorMixRuntimeManifest {
  /** `--color-mix-<hash>` → expression; the same list in every theme. */
  readonly tokens: Readonly<Record<string, string>>;
  /** Custom properties defined as one color-mix(), per theme (cascade scope applied). */
  readonly named: Readonly<Record<ColorMixTheme, Readonly<Record<string, string>>>>;
  /** Properties the recipes read: the base palette, then each theme block's own. */
  readonly properties: Readonly<Record<"base" | ColorMixTheme, Readonly<Record<string, string>>>>;
  /** Every recipe evaluated against the default pack (what the stylesheet holds). */
  readonly defaults: Readonly<Record<ColorMixTheme, Readonly<Record<string, string>>>>;
}

export const COLOR_MIX_THEMES: Readonly<Record<ColorMixTheme, string>>;
export function colorMixTokenName(expression: string): string;
export function readCustomProperties(css: string, selector: string): Record<string, string>;
export function readColorMixDefinitions(css: string): ColorMixDefinition[];
export function buildColorMixCss(input: ColorMixBuildInput): ColorMixBuildResult;
export function widenPaletteToSource(
  base: Readonly<Record<string, string>>,
  paletteCss: string,
): Record<string, string>;
export function generatedColorMixTokenNames(generatedCss: string): Set<string>;
export function generatedColorMixDefinitionNames(generatedCss: string): Set<string>;
export function projectColorMixValue(value: string, knownTokens: ReadonlySet<string>): string;
