import type { ThreadId } from "@synara/contracts";
import { useEffect, useEffectEvent } from "react";

import { getDesktopBridge } from "~/platform/desktopBridge";
export function useBrowserPanelDesktopBridge(input: {
  onToggle: (() => void) | null;
  onOpen: ((threadId: ThreadId) => void) | null;
}) {
  const { onOpen, onToggle } = input;
  const handleToggle = useEffectEvent(() => onToggle?.());
  const handleOpen = useEffectEvent((threadId: ThreadId) => onOpen?.(threadId));
  const toggleEnabled = onToggle !== null;
  const openEnabled = onOpen !== null;

  useEffect(() => {
    const onMenuAction = getDesktopBridge()?.onMenuAction;
    if (typeof onMenuAction !== "function" || !toggleEnabled) {
      return;
    }

    const unsubscribe = onMenuAction((action) => {
      if (action === "toggle-browser") {
        handleToggle();
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [toggleEnabled]);

  useEffect(() => {
    const onOpenBrowserPanelRequest = getDesktopBridge()?.browser.onBrowserUseOpenPanelRequest;
    if (typeof onOpenBrowserPanelRequest !== "function" || !openEnabled) {
      return;
    }

    const unsubscribe = onOpenBrowserPanelRequest(({ threadId }) => {
      handleOpen(threadId);
    });

    return () => {
      unsubscribe?.();
    };
  }, [openEnabled]);
}
