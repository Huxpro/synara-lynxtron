// Types for color-mix-eval.logic.mjs (pure; shared by the build-time generator and the app).

import type { RgbaColor } from "./css-color.logic.mjs";

export type ColorMixSpace = "srgb" | "oklab";

export interface ColorMixStop {
  readonly color: string;
  readonly percent: number | null;
}

export function extractColorMixExpressions(text: string): string[];
export function normalizeColorMix(expression: string): string;
export function parseColorMix(
  expression: string,
): { readonly space: string; readonly stops: readonly [ColorMixStop, ColorMixStop] } | null;
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
export function evaluateColorMixRecipes(
  recipes: Iterable<readonly [name: string, expression: string]>,
  properties: Readonly<Record<string, string>>,
): Record<string, string>;
export function referencedCustomProperties(value: string): string[];
