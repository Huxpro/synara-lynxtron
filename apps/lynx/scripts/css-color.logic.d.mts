// Types for css-color.logic.mjs (build-time script, consumed by typed tests).

export interface RgbaColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export function srgb255ToOklab(r: number, g: number, b: number): [number, number, number];
export function oklabToSrgb255(l: number, a: number, b: number): [number, number, number];
export function parseCssColor(
  value: unknown,
  options?: { readonly quantizeLegacyAlpha?: boolean },
): RgbaColor | null;
export function formatRgba(color: RgbaColor): string;
