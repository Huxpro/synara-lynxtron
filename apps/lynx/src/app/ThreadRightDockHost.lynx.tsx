import { createContext, useEffect, useMemo, useState, type ReactNode } from "@lynx-js/react";
import { RIGHT_DOCK_MIN_WIDTH_PX } from "@synara/shared/rightDock";

import { ResizableRightPanel } from "./ResizableRightPanel.lynx";
import "./thread-right-dock-host.css";

/**
 * Upstream RightDock's "Maximize panel": the dock covers the chat it sits beside until it is
 * restored or closed. The host owns the state; the tab header's button reads it from here.
 */
export const RightDockMaximizeContext = createContext<{
  readonly maximized: boolean;
  readonly setMaximized: (maximized: boolean) => void;
} | null>(null);

export function ThreadRightDockHost(props: {
  readonly availableWidth: number;
  readonly children?: ReactNode;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly tabs: ReactNode;
}) {
  const [maximizeRequested, setMaximized] = useState(false);
  // Closing the dock restores it, as upstream: the next open is the split again.
  useEffect(() => {
    if (!props.open) setMaximized(false);
  }, [props.open]);
  const maximized = props.open && maximizeRequested;
  const maximize = useMemo(() => ({ maximized, setMaximized }), [maximized]);
  return (
    <ResizableRightPanel
      availableWidth={props.availableWidth}
      className={`ThreadRightDockHost${
        props.open ? " ThreadRightDockHost--open" : " ThreadRightDockHost--closed"
      }${maximized ? " ThreadRightDockHost--maximized" : ""}`}
      interactive={props.open}
      // Full width without a resize sash; the chat keeps the width it was last given.
      hosted={maximized}
      defaultWidth={
        props.availableWidth > 0
          ? Math.max(RIGHT_DOCK_MIN_WIDTH_PX, Math.round(props.availableWidth / 2))
          : RIGHT_DOCK_MIN_WIDTH_PX
      }
      maxWidth={960}
      minimumMainWidth={320}
      minWidth={RIGHT_DOCK_MIN_WIDTH_PX}
      onWidthChange={props.onWidthChange}
      resizable
    >
      <RightDockMaximizeContext.Provider value={maximize}>
        {props.tabs}
      </RightDockMaximizeContext.Provider>
      <view className="ThreadRightDockHostBody">{props.children}</view>
    </ResizableRightPanel>
  );
}
