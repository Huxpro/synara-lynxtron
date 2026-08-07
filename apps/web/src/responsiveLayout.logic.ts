export const VIEWPORT_BREAKPOINTS = {
  "2xl": 1536,
  "3xl": 1600,
  "4xl": 2000,
  lg: 1024,
  md: 768,
  sm: 640,
  xl: 1280,
} as const;

export const VIEWPORT_HEIGHT_BREAKPOINTS = {
  short: 320,
} as const;

export type ViewportBreakpoint = keyof typeof VIEWPORT_BREAKPOINTS;
export type ViewportLayoutBand = "unknown" | "compact" | "medium" | "wide";

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface ViewportLayout {
  readonly band: ViewportLayoutBand;
  readonly height: number;
  readonly width: number;
  readonly compact: boolean;
  readonly medium: boolean;
  readonly wide: boolean;
}

export const UNKNOWN_VIEWPORT_SIZE: ViewportSize = {
  width: 0,
  height: 0,
};

export function resolveViewportLayout(size: ViewportSize): ViewportLayout {
  const width = Number.isFinite(size.width) ? Math.max(0, size.width) : 0;
  const height = Number.isFinite(size.height) ? Math.max(0, size.height) : 0;
  const band: ViewportLayoutBand =
    width === 0
      ? "unknown"
      : width < VIEWPORT_BREAKPOINTS.md
        ? "compact"
        : width < VIEWPORT_BREAKPOINTS.lg
          ? "medium"
          : "wide";
  return {
    band,
    width,
    height,
    compact: band === "compact",
    medium: band === "medium",
    wide: band === "wide",
  };
}

export function viewportLayoutClassName(layout: ViewportLayout): string {
  return `SliceRoot--viewport-${layout.band}`;
}

export function viewportBreakpointClassNames(layout: ViewportLayout): string {
  if (layout.width <= 0) return "";
  return (Object.entries(VIEWPORT_BREAKPOINTS) as Array<
    [ViewportBreakpoint, number]
  >)
    .filter(([, minimumWidth]) => layout.width >= minimumWidth)
    .sort((left, right) => left[1] - right[1])
    .map(([breakpoint]) => `SliceRoot--viewport-${breakpoint}-up`)
    .join(" ");
}

export function viewportHeightClassNames(layout: ViewportLayout): string {
  if (layout.height <= 0) return "";
  return layout.height < VIEWPORT_HEIGHT_BREAKPOINTS.short
    ? "SliceRoot--viewport-short-height"
    : "";
}
