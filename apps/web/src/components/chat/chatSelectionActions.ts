// FILE: chatSelectionActions.ts
// Purpose: Helpers for reading assistant text selections from the transcript without re-render churn.
// Layer: Chat transcript interaction helpers

import { getViewportHeight, getViewportWidth, isBrowser } from "~/platform/env";
import { resolveSelectionActionLayout } from "@synara/shared/selectionActionLayout";
export { resolveTranscriptMarkerRange } from "@synara/shared/threadMarkers";

import { getWindowSelection } from "./chatSelectionDom";
export interface TranscriptAssistantSelection {
  assistantMessageId: string;
  text: string;
}

export interface TranscriptSelectionActionLayout {
  left: number;
  top: number;
  placement: "top" | "bottom";
  width: number;
}

export function resolveSelectionViewportElement(container: HTMLElement | null): HTMLElement | null {
  let candidate = container;
  while (candidate) {
    const rect = candidate.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return candidate;
    candidate = candidate.parentElement;
  }
  return null;
}

function getSelectionRect(selection: Selection): DOMRect | null {
  if (selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const rects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 || rect.height > 0,
  );
  if (rects.length > 0) {
    return rects[rects.length - 1] ?? null;
  }
  const boundingRect = range.getBoundingClientRect();
  return boundingRect.width > 0 || boundingRect.height > 0 ? boundingRect : null;
}

// Rect of the active window selection, for positioning floating selection actions.
export function getActiveSelectionRect(): DOMRect | null {
  const selection = getWindowSelection();
  if (!selection) {
    return null;
  }
  return getSelectionRect(selection);
}

// `closest()` that escapes open shadow roots (e.g. the @pierre/diffs custom
// element) by hopping from a shadow root to its host element.
export function closestThroughShadow(start: Node | null, selector: string): HTMLElement | null {
  let node: Node | null = start;
  while (node) {
    const element = node instanceof HTMLElement ? node : node.parentElement;
    const match = element?.closest<HTMLElement>(selector) ?? null;
    if (match) {
      return match;
    }
    const root = (element ?? node).getRootNode();
    node = root instanceof ShadowRoot ? root.host : null;
  }
  return null;
}

function selectionContainerForNode(node: Node | null): HTMLElement | null {
  if (!node) {
    return null;
  }
  const element = node instanceof HTMLElement ? node : node.parentElement;
  return element?.closest<HTMLElement>("[data-assistant-message-id]") ?? null;
}

export function readTranscriptAssistantSelection(input: {
  container: HTMLElement | null;
}): { selection: TranscriptAssistantSelection; selectionRect: DOMRect | null } | null {
  const selection = getWindowSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const anchorContainer = selectionContainerForNode(selection.anchorNode);
  const focusContainer = selectionContainerForNode(selection.focusNode);
  if (!anchorContainer || !focusContainer || anchorContainer !== focusContainer) {
    return null;
  }
  const { container } = input;
  if (!container || !container.contains(anchorContainer)) {
    return null;
  }

  const assistantMessageId = anchorContainer.dataset.assistantMessageId?.trim() ?? "";
  const text = selection
    .toString()
    .replace(/\r\n/g, "\n")
    .replace(/^\n+|\n+$/g, "")
    .trim();
  if (assistantMessageId.length === 0 || text.length === 0) {
    return null;
  }

  return {
    selection: {
      assistantMessageId,
      text,
    },
    selectionRect: getSelectionRect(selection),
  };
}

export function resolveTranscriptSelectionActionLayout(input: {
  selectionRect: DOMRect | null;
  pointer: { x: number; y: number };
  viewport?: { left?: number; top?: number; width: number; height: number } | null;
}): TranscriptSelectionActionLayout {
  const viewportWidth =
    input.viewport?.width ?? (isBrowser() ? getViewportWidth() : input.pointer.x + 8);
  const viewportHeight =
    input.viewport?.height ?? (isBrowser() ? getViewportHeight() : input.pointer.y + 8);

  return resolveSelectionActionLayout({
    selectionRect: input.selectionRect
      ? {
          left: input.selectionRect.left,
          top: input.selectionRect.top,
          width: input.selectionRect.width,
          height: input.selectionRect.height,
        }
      : null,
    pointer: input.pointer,
    viewport: {
      ...(input.viewport?.left !== undefined ? { left: input.viewport.left } : {}),
      ...(input.viewport?.top !== undefined ? { top: input.viewport.top } : {}),
      width: viewportWidth,
      height: viewportHeight,
    },
  });
}
