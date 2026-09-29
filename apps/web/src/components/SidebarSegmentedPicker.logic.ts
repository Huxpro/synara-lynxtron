export type SidebarView = "threads" | "studio" | "workspace";

export interface SidebarSegmentGeometry {
  readonly left: string;
  readonly width: string;
  readonly labelTranslateX: string;
}

function calcLength(percent: number, pixels: number): string {
  const roundedPercent = Math.round(percent * 1_000_000) / 1_000_000;
  const roundedPixels = Math.round(pixels * 1_000_000) / 1_000_000;
  const percentPart = `${roundedPercent}%`;
  if (Math.abs(roundedPixels) < 0.000_001) return percentPart;
  return `calc(${percentPart} ${roundedPixels < 0 ? "-" : "+"} ${Math.abs(roundedPixels)}px)`;
}

export function resolveSidebarSegmentGeometry(
  activeIndex: number,
  segmentCount: number,
): SidebarSegmentGeometry {
  const safeCount = Math.max(1, segmentCount);
  const safeIndex = Math.min(Math.max(0, activeIndex), safeCount - 1);
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === safeCount - 1;
  const segmentPercent = 100 / safeCount;
  const cellPixelAdjustment = -4 / safeCount;
  const leftPixelAdjustment = 2 + safeIndex * cellPixelAdjustment;
  const edgeWidthOverhang = isFirst || isLast ? 8 : 0;

  return {
    left: isFirst ? "-6px" : calcLength(safeIndex * segmentPercent, leftPixelAdjustment),
    width: calcLength(segmentPercent, cellPixelAdjustment + edgeWidthOverhang),
    labelTranslateX: isFirst ? "-4px" : isLast ? "4px" : "0px",
  };
}

/** The optimistic segment follows a destination click and clears when the user returns. */
export function resolvePendingSidebarViewSelection(
  activeView: SidebarView,
  selectedView: SidebarView,
): SidebarView | null {
  return selectedView === activeView ? null : selectedView;
}
