// Types for color-mix.logic.mjs (build-time script, consumed by typed tests).

import type { RgbaColor } from "./css-color.logic.mjs";

export type ColorMixTheme = "light" | "dark";
export type ColorMixSpace = "srgb" | "oklab";

export interface ColorMixSource {
  readonly path: string;
  readonly text: string;
}

export interface ColorMixStop {
  readonly color: string;
  readonly percent: number | null;
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
  readonly themePath?: string | null;
}

export interface ColorMixBuildResult {
  readonly css: string;
  readonly tokens: readonly ColorMixToken[];
  readonly unresolved: readonly ColorMixTokenRecord[];
  readonly namedDefinitions: readonly string[];
}

export const COLOR_MIX_THEMES: Readonly<Record<ColorMixTheme, string>>;
export function extractColorMixExpressions(text: string): string[];
export function normalizeColorMix(expression: string): string;
export function colorMixTokenName(expression: string): string;
export function parseColorMix(
  expression: string,
): { readonly space: string; readonly stops: readonly [ColorMixStop, ColorMixStop] } | null;
export function readCustomProperties(css: string, selector: string): Record<string, string>;
export function readColorMixDefinitions(css: string): ColorMixDefinition[];
export function mixColors(
  space: ColorMixSpace,
  first: RgbaColor,
  firstPercent: number | null,
  second: RgbaColor,
  secondPercent: number | null,
): RgbaColor | null;
export function resolveColor(
  value: string,
  properties: Readonly<Record<string, string>>,
  depth?: number,
): RgbaColor | null;
export function buildColorMixCss(input: ColorMixBuildInput): ColorMixBuildResult;
export function generatedColorMixTokenNames(generatedCss: string): Set<string>;
export function generatedColorMixDefinitionNames(generatedCss: string): Set<string>;
export function projectColorMixValue(value: string, knownTokens: ReadonlySet<string>): string;
