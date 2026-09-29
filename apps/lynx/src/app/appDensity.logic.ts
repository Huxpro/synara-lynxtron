import { DEFAULT_UI_DENSITY, normalizeUiDensity, type UiDensity } from "@synara-web/lib/appDensity";

export function resolveSliceUiDensity(value: unknown): UiDensity {
  return normalizeUiDensity(value, DEFAULT_UI_DENSITY);
}

export function sliceUiDensityClassName(value: unknown): string {
  return `SliceRoot--density-${resolveSliceUiDensity(value)}`;
}
