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
  resolveSidebarSegmentGeometry,
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
  const segmentGeometry = resolveSidebarSegmentGeometry(activeSegment, segmentCount);

  return (
    <SidebarSegmentedPickerFrameElement>
      <SidebarSegmentedPickerTrackElement>
        <SidebarSegmentedPickerThumbElement
          hidden={activeIndex < 0}
          left={segmentGeometry.left}
          width={segmentGeometry.width}
        />
        {views.map((view, index) => {
          const active = displayedView === view;
          const labelShift = active
            ? resolveSidebarSegmentGeometry(index, segmentCount).labelTranslateX
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
