// FILE: chatSelectionDom.ts
// Purpose: Single owner of DOM Selection/Range access for chat & terminal
//   selection features (transcript island support). window.getSelection and
//   document.createRange have no Lynx equivalent; island code must funnel
//   through here so the boundary stays visible.
// Layer: Chat island DOM support
// Exports: getWindowSelection, clearWindowSelection, onDocumentSelectionChange,
//   createDocumentRange

import { addDocumentEventListener, removeDocumentEventListener } from "~/platform/events";

export function getWindowSelection(): Selection | null {
  return typeof window === "undefined" ? null : window.getSelection();
}

export function clearWindowSelection(): void {
  getWindowSelection()?.removeAllRanges();
}

export function onDocumentSelectionChange(listener: () => void): () => void {
  const handler = () => listener();
  addDocumentEventListener("selectionchange", handler);
  return () => {
    removeDocumentEventListener("selectionchange", handler);
  };
}

export function createDocumentRange(): Range | null {
  return typeof document === "undefined" ? null : document.createRange();
}
