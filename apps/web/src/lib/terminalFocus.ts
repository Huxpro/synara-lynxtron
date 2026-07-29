import { getDocumentActiveElement } from "~/platform/env";

export function isTerminalFocused(): boolean {
  const activeElement = getDocumentActiveElement();
  if (!(activeElement instanceof HTMLElement)) return false;
  if (!activeElement.isConnected) return false;
  if (activeElement.classList.contains("xterm-helper-textarea")) return true;
  return activeElement.closest(".thread-terminal-drawer .xterm") !== null;
}
