// FILE: ThreadComposerDock.lynx.tsx
// Purpose: The thread page's composer dock, publishing its height. Upstream's transcript
//   scroller runs under the composer to 16px above the card's bottom edge, and the message
//   trail spans that whole scroller. Lynx stacks the transcript above the dock, so the trail
//   reads the dock's height to reach the same bottom edge.

import { useSyncExternalStore, type ReactNode } from "@lynx-js/react";

/** `.ThreadComposerDock`: `margin-top: -20px` over the transcript, `padding-bottom: 16px`. */
const DOCK_TRANSCRIPT_OVERLAP_PX = 20;
const DOCK_BOTTOM_PADDING_PX = 16;

let dockHeight = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readDockHeight(): number {
  return dockHeight;
}

/** How far below the transcript's bottom edge upstream's transcript scroller extends. */
export function useTranscriptScrollerOverhangPx(): number {
  const height = useSyncExternalStore(subscribe, readDockHeight, readDockHeight);
  return Math.max(0, height - DOCK_TRANSCRIPT_OVERLAP_PX - DOCK_BOTTOM_PADDING_PX);
}

export function ThreadComposerDock(props: { readonly children?: ReactNode }) {
  return (
    <view
      className="ThreadComposerDock"
      bindlayoutchange={(event: { readonly detail?: { readonly height?: number } }) => {
        "background only";
        const height = event.detail?.height;
        if (typeof height !== "number" || height === dockHeight) return;
        dockHeight = height;
        for (const listener of listeners) listener();
      }}
    >
      {props.children}
    </view>
  );
}
