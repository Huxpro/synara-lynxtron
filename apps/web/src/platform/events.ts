// FILE: platform/events.ts
// Purpose: L1 platform port — app-level event target. Web impl delegates to
//   window (custom synara:* bus events, storage events, resize, key handling).
//   The Lynx impl maps the used subset onto GlobalEventEmitter / Lynx lifecycle
//   events; no DOM EventTarget exists there.
// Layer: L1 platform port (web implementation)
// Exports: addWindowEventListener, removeWindowEventListener, dispatchWindowEvent

export function addWindowEventListener(
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions | boolean,
): void {
  // Capability check mirrors the pre-port call-site guards: partial window
  // stubs (node test envs) may lack these methods entirely.
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  window.addEventListener(type, listener, options);
}

export function removeWindowEventListener(
  type: string,
  listener: EventListener,
  options?: EventListenerOptions | boolean,
): void {
  if (typeof window === "undefined" || typeof window.removeEventListener !== "function") return;
  window.removeEventListener(type, listener, options);
}

export function dispatchWindowEvent(event: Event): boolean {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return false;
  return window.dispatchEvent(event);
}

export function addDocumentEventListener(
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions | boolean,
): void {
  if (typeof document === "undefined") return;
  document.addEventListener(type, listener, options);
}

export function removeDocumentEventListener(
  type: string,
  listener: EventListener,
  options?: EventListenerOptions | boolean,
): void {
  if (typeof document === "undefined") return;
  document.removeEventListener(type, listener, options);
}
