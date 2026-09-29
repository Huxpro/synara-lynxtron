import { useEffect, useRef, useState, type ReactNode } from "@lynx-js/react";

import { clampSidebarWidth } from "@synara-web/components/sidebarResize.logic";
import { useViewportLayout } from "../hooks/useViewportLayout.lynx";
import { webStorage } from "../platform/storage";
import {
  createLynxSidebarResizeSession,
  isLynxSidebarPrimaryPointer,
  moveLynxSidebarResizeSession,
  readLynxSidebarPointerX,
  type LynxSidebarPointerEvent,
  type LynxSidebarResizeSession,
} from "./sidebarResize.lynx.logic";
import "./resizable-right-panel.css";

function readPersistedWidth(storageKey: string | undefined): number | null {
  if (!storageKey) return null;
  try {
    const raw = webStorage.getItem(storageKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function ResizableRightPanel(props: {
  readonly availableWidth: number;
  readonly children: ReactNode;
  readonly className: string;
  readonly defaultWidth: number;
  readonly maxWidth?: number | undefined;
  readonly minimumMainWidth: number;
  readonly minWidth: number;
  readonly onWidthChange?: ((width: number) => void) | undefined;
  readonly resizable: boolean;
  readonly hosted?: boolean;
  readonly storageKey?: string | undefined;
}) {
  const viewport = useViewportLayout();
  const [persistedWidth, setPersistedWidth] = useState(() => readPersistedWidth(props.storageKey));
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sessionRef = useRef<LynxSidebarResizeSession | null>(null);
  const availableWidth = props.availableWidth > 0 ? props.availableWidth : viewport.width;
  const width = clampSidebarWidth(persistedWidth ?? props.defaultWidth, {
    maxWidth: props.maxWidth,
    minWidth: props.minWidth,
    minimumContentWidth: props.minimumMainWidth,
    viewportWidth: availableWidth,
  });
  const canResize =
    !props.hosted &&
    props.resizable &&
    !viewport.compact &&
    !viewport.medium &&
    availableWidth > props.minWidth;

  useEffect(() => {
    if (!props.hosted) props.onWidthChange?.(canResize ? width : 0);
  }, [canResize, props.hosted, props.onWidthChange, width]);

  const stopResize = () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    setDragging(false);
    if (!session) return;
    setPersistedWidth(session.width);
    if (props.storageKey) {
      webStorage.setItem(props.storageKey, JSON.stringify(session.width));
    }
  };
  const startResize = (event: LynxSidebarPointerEvent) => {
    if (!canResize || !isLynxSidebarPrimaryPointer(event)) return;
    const startX = readLynxSidebarPointerX(event);
    if (startX === null) return;
    sessionRef.current = createLynxSidebarResizeSession({
      side: "right",
      startWidth: width,
      startX,
    });
    setDragging(true);
  };
  const moveResize = (event: LynxSidebarPointerEvent) => {
    const session = sessionRef.current;
    if (!session) return;
    const result = moveLynxSidebarResizeSession({
      event,
      maxWidth: props.maxWidth,
      minimumContentWidth: props.minimumMainWidth,
      minWidth: props.minWidth,
      session,
      viewportWidth: availableWidth,
    });
    if (result.kind === "ended-missed-mouseup") {
      stopResize();
      return;
    }
    if (result.kind !== "moved") return;
    sessionRef.current = result.session;
    setPersistedWidth(result.session.width);
  };

  return (
    <view
      className={props.className}
      style={props.hosted ? { width: "100%" } : canResize ? { width: `${width}px` } : undefined}
    >
      {canResize ? (
        <view
          className={`RightPanelResizeSash${
            hovered ? " ui-hover" : ""
          }${dragging ? " RightPanelResizeSash--dragging" : ""}`}
          aria-label="Resize panel"
          accessibility-element={true}
          accessibility-label="Resize panel"
          accessibility-trait="adjustable"
          bindmousedown={startResize}
          bindmousemove={moveResize}
          bindmouseup={stopResize}
          bindmouseenter={() => setHovered(true)}
          bindmouseleave={() => setHovered(false)}
          bindtouchstart={startResize}
          bindtouchmove={moveResize}
          bindtouchend={stopResize}
          bindtouchcancel={stopResize}
        >
          <view className="RightPanelResizeSashLine" />
        </view>
      ) : null}
      {props.children}
      {dragging ? (
        <view
          className="RightPanelResizeOverlay"
          bindmousemove={moveResize}
          bindmouseup={stopResize}
          bindtouchmove={moveResize}
          bindtouchend={stopResize}
          bindtouchcancel={stopResize}
        />
      ) : null}
    </view>
  );
}
