import { useEffect, useRef, useState, type ReactNode } from "@lynx-js/react";

import {
  THREAD_SIDEBAR_DEFAULT_WIDTH,
  THREAD_SIDEBAR_WIDTH_STORAGE_KEY,
} from "@synara-web/components/sidebarResize.logic";
import { useLynxDisclosurePresence } from "../platform/motion";
import { LynxInteractionScope } from "../components/ui/interaction-scope.lynx";
import { useViewportLayout } from "../hooks/useViewportLayout.lynx";
import { webStorage } from "../platform/storage";
import {
  createLynxSidebarResizeSession,
  isLynxSidebarPrimaryPointer,
  moveLynxSidebarResizeSession,
  readLynxSidebarPointerX,
  resolveLynxSidebarPresentedWidth,
  type LynxSidebarPointerEvent,
  type LynxSidebarResizeSession,
} from "./sidebarResize.lynx.logic";
import "./sidebar-disclosure.css";

function readPersistedSidebarWidth(): number | null {
  try {
    const raw = webStorage.getItem(THREAD_SIDEBAR_WIDTH_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function SidebarDisclosure(props: { readonly children: ReactNode; readonly open: boolean }) {
  const present = useLynxDisclosurePresence(props.open);
  const [revealed, setRevealed] = useState(props.open);
  const viewport = useViewportLayout();
  const [persistedWidth, setPersistedWidth] = useState(readPersistedSidebarWidth);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const resizeSessionRef = useRef<LynxSidebarResizeSession | null>(null);
  const effectiveViewportWidth = viewport.width > 0 ? viewport.width : 1280;
  const width = resolveLynxSidebarPresentedWidth({
    requestedWidth: persistedWidth ?? THREAD_SIDEBAR_DEFAULT_WIDTH,
    viewportWidth: effectiveViewportWidth,
  });
  const resizable = props.open && !viewport.compact;

  useEffect(() => {
    "background only";
    if (!props.open || !present) {
      setRevealed(false);
      return;
    }
    const timeout = setTimeout(() => setRevealed(true), 0);
    return () => clearTimeout(timeout);
  }, [present, props.open]);

  const stopResize = () => {
    const session = resizeSessionRef.current;
    resizeSessionRef.current = null;
    setDragging(false);
    if (!session) return;
    setPersistedWidth(session.width);
    webStorage.setItem(THREAD_SIDEBAR_WIDTH_STORAGE_KEY, JSON.stringify(session.width));
  };
  const startResize = (event: LynxSidebarPointerEvent) => {
    if (!resizable || !isLynxSidebarPrimaryPointer(event)) return;
    const startX = readLynxSidebarPointerX(event);
    if (startX === null) return;
    resizeSessionRef.current = createLynxSidebarResizeSession({
      startWidth: width,
      startX,
    });
    setDragging(true);
  };
  const moveResize = (event: LynxSidebarPointerEvent) => {
    const session = resizeSessionRef.current;
    if (!session) return;
    const result = moveLynxSidebarResizeSession({
      event,
      session,
      viewportWidth: effectiveViewportWidth,
    });
    if (result.kind === "ended-missed-mouseup") {
      stopResize();
      return;
    }
    if (result.kind !== "moved") return;
    resizeSessionRef.current = result.session;
    setPersistedWidth(result.session.width);
  };

  if (!present) return null;
  const interactive = props.open && revealed;
  return (
    <view
      className={`SidebarDisclosure${
        revealed ? " SidebarDisclosure--open" : " SidebarDisclosure--closed"
      }${dragging ? " SidebarDisclosure--resizing" : ""}`}
      aria-hidden={!interactive}
      accessibility-elements-hidden={!interactive}
      style={{ width: `${revealed ? width : 0}px` }}
    >
      <view className="SidebarDisclosureInner" style={{ width: `${width}px` }}>
        <LynxInteractionScope disabled={!interactive}>{props.children}</LynxInteractionScope>
      </view>
      {resizable ? (
        <view
          className={`SidebarResizeSash${
            hovered ? " ui-hover" : ""
          }${dragging ? " SidebarResizeSash--dragging" : ""}`}
          aria-label="Resize Sidebar"
          accessibility-element={true}
          accessibility-label="Resize Sidebar"
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
          <view className="SidebarResizeSashLine" />
        </view>
      ) : null}
      {dragging ? (
        <view
          className="SidebarResizeOverlay"
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
