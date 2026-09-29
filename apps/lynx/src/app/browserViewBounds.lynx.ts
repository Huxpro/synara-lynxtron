import type { BrowserViewBounds } from "../main/desktop/browserViewProbe";

export interface BrowserViewMeasuredRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function resolveBrowserViewBounds(
  pane: BrowserViewMeasuredRect,
  content: BrowserViewMeasuredRect,
  chromeHeight: number,
): BrowserViewBounds | null {
  const left = Math.max(content.left, pane.left);
  const top = Math.max(content.top, pane.top + chromeHeight);
  const right = Math.min(content.left + content.width, pane.left + pane.width);
  const bottom = Math.min(content.top + content.height, pane.top + pane.height);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  return width === 0 || height === 0 ? null : { x: left, y: top, width, height };
}
