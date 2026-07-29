// FILE: useCodeSelectionAction.ts
// Purpose: Generic highlight -> floating "Add to chat" flow for read-only code
//          surfaces (file preview, diff view), mirroring the transcript behavior.
// Layer: Chat selection interaction controller

import { useEffect, useState, type MouseEventHandler } from "react";

import {
  getActiveSelectionRect,
  resolveTranscriptSelectionActionLayout,
} from "./chatSelectionActions";

import { raf } from "~/platform/frame";
import { addWindowEventListener, removeWindowEventListener } from "~/platform/events";
import { clearWindowSelection, onDocumentSelectionChange } from "./chatSelectionDom";
export interface PendingCodeSelectionAction<T> {
  payload: T;
  left: number;
  top: number;
  placement: "top" | "bottom";
}

// Caller attaches `onContainerMouseUp` to the selectable surface and renders
// `TranscriptSelectionAction` while `pendingAction` is set. `readSelection`
// inspects the live window selection scoped to the container and returns the
// commit payload (or null when the selection is not actionable).
export function useCodeSelectionAction<T>(options: {
  enabled: boolean;
  readSelection: (container: HTMLElement) => T | null;
  onCommit: (payload: T) => void;
}): {
  pendingAction: PendingCodeSelectionAction<T> | null;
  onContainerMouseUp: MouseEventHandler<HTMLElement>;
  commit: () => void;
} {
  const { enabled, onCommit, readSelection } = options;
  const [pendingActionState, setPendingAction] = useState<PendingCodeSelectionAction<T> | null>(
    null,
  );
  // Derived: disabling clears the visible action in the same render, with no
  // state-resetting effect (the stale state simply stops being surfaced).
  const pendingAction = enabled ? pendingActionState : null;

  const onContainerMouseUp: MouseEventHandler<HTMLElement> = (event) => {
    const container = event.currentTarget;
    const pointer = { x: event.clientX, y: event.clientY };
    // Wait a frame so the browser finalizes the selection before reading it.
    raf(() => {
      if (!enabled || !container.isConnected) {
        setPendingAction(null);
        return;
      }
      const payload = readSelection(container);
      if (payload === null) {
        setPendingAction(null);
        return;
      }
      const layout = resolveTranscriptSelectionActionLayout({
        selectionRect: getActiveSelectionRect(),
        pointer,
      });
      setPendingAction({ payload, ...layout });
    });
  };

  const commit = () => {
    if (!pendingAction) {
      return;
    }
    onCommit(pendingAction.payload);
    setPendingAction(null);
    clearWindowSelection();
  };

  useEffect(() => {
    if (!pendingAction) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-transcript-selection-action='true']")
      ) {
        return;
      }
      setPendingAction(null);
    };
    const handleWindowChange = () => {
      setPendingAction(null);
    };

    addWindowEventListener("pointerdown", handlePointerDown);
    addWindowEventListener("resize", handleWindowChange);
    addWindowEventListener("scroll", handleWindowChange, true);
    const removeSelectionListener = onDocumentSelectionChange(handleWindowChange);
    return () => {
      removeWindowEventListener("pointerdown", handlePointerDown);
      removeWindowEventListener("resize", handleWindowChange);
      removeWindowEventListener("scroll", handleWindowChange, true);
      removeSelectionListener();
    };
  }, [pendingAction]);

  return { pendingAction, onContainerMouseUp, commit };
}
