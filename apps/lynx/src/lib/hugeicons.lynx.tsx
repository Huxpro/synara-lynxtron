// FILE: lib/hugeicons.lynx.tsx
// Purpose: Upstream's Hugeicons on Lynx. The drawings are generated from upstream's
//   `lib/hugeicons.tsx` (scripts/generate-hugeicons.mjs) under the names `~/lib/icons`
//   exports, so `<Hugeicon name="HomeIcon" />` is the glyph Electron shows for HomeIcon.
// Layer: Lynx icon primitive

import type { CSSProperties } from "@lynx-js/types";

import { useTheme } from "../adapters/useTheme.lynx";
import { HUGEICON_SVG, type HugeiconName } from "../generated/hugeicons.generated";
import { colorizeLynxSvg, resolveLynxSvgColor } from "./themedSvg.lynx";

export type { HugeiconName };

/** The drawing with upstream's stroke width replaced, as a caller's `strokeWidth` prop does. */
export function hugeiconSvg(name: HugeiconName, strokeWidth?: number): string {
  const content: string = HUGEICON_SVG[name];
  return strokeWidth === undefined
    ? content
    : content.replace(/ stroke-width="[^"]*"/, ` stroke-width="${strokeWidth}"`);
}

export function Hugeicon(props: {
  readonly name: HugeiconName;
  readonly className?: string;
  readonly color?: string;
  /** Pixels, or a CSS length. Omit when the class sizes the glyph. */
  readonly size?: number | string;
  readonly strokeWidth?: number;
  readonly style?: CSSProperties;
  readonly accessibilityLabel?: string;
}) {
  const { svgColors } = useTheme();
  const dimension = typeof props.size === "number" ? `${props.size}px` : props.size;
  return (
    <svg
      className={props.className}
      content={colorizeLynxSvg(
        hugeiconSvg(props.name, props.strokeWidth),
        resolveLynxSvgColor(props.color ?? "currentColor", svgColors),
      )}
      accessibility-element={Boolean(props.accessibilityLabel)}
      accessibility-label={props.accessibilityLabel}
      accessibility-trait={props.accessibilityLabel ? "image" : undefined}
      style={dimension ? { width: dimension, height: dimension, ...props.style } : props.style}
    />
  );
}
