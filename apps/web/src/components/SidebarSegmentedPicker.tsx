import { useCallback, useEffect, useRef, useState } from "react";

import {
  SidebarSegmentButtonElement,
  SidebarSegmentLabelElement,
  SidebarSegmentedPickerFrameElement,
  SidebarSegmentedPickerThumbElement,
  SidebarSegmentedPickerTrackElement,
} from "~/components/SidebarSegmentedPickerElements";
import {
  resolvePendingSidebarViewSelection,
  type SidebarView,
} from "~/components/SidebarSegmentedPicker.logic";

const SIDEBAR_VIEW_LABELS: Record<SidebarView, string> = {
  threads: "Projects",
  studio: "Studio",
  workspace: "Workspace",
};

/** Snap the optimistic segment selection back if the navigation never lands. */
const SIDEBAR_SEGMENT_PENDING_RESET_MS = 2000;

export function SidebarSegmentedPicker({
  views,
  activeView,
  onSelectView,
  onPrewarmView,
}: {
  views: ReadonlyArray<SidebarView>;
  activeView: SidebarView;
  onSelectView: (view: SidebarView) => void;
  onPrewarmView?: (view: SidebarView) => void;
}) {
  const [pendingView, setPendingView] = useState<{
    key: SidebarView;
    value: SidebarView | null;
  }>(() => ({ key: activeView, value: null }));
  if (pendingView.key !== activeView) {
    setPendingView({ key: activeView, value: null });
  }
  const pendingViewResetTimeoutRef = useRef<number | null>(null);
  const clearPendingViewResetTimeout = useCallback(() => {
    if (pendingViewResetTimeoutRef.current !== null) {
      clearTimeout(pendingViewResetTimeoutRef.current);
      pendingViewResetTimeoutRef.current = null;
    }
  }, []);
  useEffect(() => {
    clearPendingViewResetTimeout();
  }, [activeView, clearPendingViewResetTimeout]);
  useEffect(() => clearPendingViewResetTimeout, [clearPendingViewResetTimeout]);

  if (views.length < 2) {
    return null;
  }

  const effectivePendingView = pendingView.key === activeView ? pendingView.value : null;
  const displayedView = effectivePendingView ?? activeView;
  const handleSelectView = (view: SidebarView) => {
    const nextPendingView = resolvePendingSidebarViewSelection(activeView, view);
    clearPendingViewResetTimeout();
    setPendingView({ key: activeView, value: nextPendingView });
    if (nextPendingView !== null) {
      onPrewarmView?.(view);
      pendingViewResetTimeoutRef.current = setTimeout(() => {
        pendingViewResetTimeoutRef.current = null;
        setPendingView((current) => ({ ...current, value: null }));
      }, SIDEBAR_SEGMENT_PENDING_RESET_MS);
    }
    onSelectView(view);
  };

  const activeIndex = views.indexOf(displayedView);
  const segmentCount = views.length;
  const activeSegment = Math.max(0, activeIndex);
  const isFirstActive = activeSegment === 0;
  const isLastActive = activeSegment === segmentCount - 1;
  const cell = `(100% - 0.25rem) / ${segmentCount}`;
  const overhang = "5px";
  const chipLeft = isFirstActive
    ? `calc(-1px - ${overhang})`
    : `calc(0.125rem + ${activeSegment} * (${cell}))`;
  const chipWidth =
    isFirstActive || isLastActive
      ? `calc(${cell} + 0.125rem + 1px + ${overhang})`
      : `calc(${cell})`;

  return (
    <SidebarSegmentedPickerFrameElement>
      <SidebarSegmentedPickerTrackElement>
        <SidebarSegmentedPickerThumbElement
          hidden={activeIndex < 0}
          left={chipLeft}
          width={chipWidth}
        />
        {views.map((view, index) => {
          const active = displayedView === view;
          const isOuterSegment = index === 0 || index === segmentCount - 1;
          const labelShift =
            active && isOuterSegment
              ? `calc(${index === 0 ? "-1 * " : ""}(0.125rem + 1px + ${overhang}) / 2)`
              : "0px";
          return (
            <SidebarSegmentButtonElement
              key={view}
              active={active}
              onPrewarm={() => {
                if (view !== activeView) {
                  onPrewarmView?.(view);
                }
              }}
              onActivate={() => handleSelectView(view)}
            >
              <SidebarSegmentLabelElement translateX={labelShift}>
                {SIDEBAR_VIEW_LABELS[view]}
              </SidebarSegmentLabelElement>
            </SidebarSegmentButtonElement>
          );
        })}
      </SidebarSegmentedPickerTrackElement>
    </SidebarSegmentedPickerFrameElement>
  );
}
