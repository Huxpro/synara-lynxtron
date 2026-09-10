// FILE: platform/env.ts
// Purpose: L1 platform port — environment detection and navigator-derived
//   facts. Keeps bare `typeof window` guards and `navigator.*` reads out of
//   feature code so the Lynx runtime (no window/navigator globals) only has to
//   satisfy this one module.
// Layer: L1 platform port (web implementation)
// Exports: isBrowser, getNavigatorPlatform, getNavigatorUserAgent, matchMediaSafe

/**
 * True when a real DOM window exists (browser / Electron renderer).
 * A function (not a const) on purpose: evaluation must happen at call time —
 * tests redefine globalThis.window after module load, and a load-time constant
 * would freeze the wrong value (see F2 regression, synara-lynx plan LOG).
 */
export function isBrowser(): boolean {
  // window-only check, exactly mirroring the pre-port `typeof window !==
  // "undefined"` guards: tests stub a window without a document, and real
  // environments never have one without the other.
  return typeof window !== "undefined";
}

export function getNavigatorPlatform(): string {
  return typeof navigator === "undefined" ? "" : navigator.platform;
}

export function getNavigatorUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

export function getNavigatorLanguage(): string {
  return typeof navigator === "undefined" ? "" : navigator.language;
}

/** navigator.hardwareConcurrency; 1 when unavailable. */
export function getHardwareConcurrency(): number {
  return typeof navigator === "undefined" ? 1 : navigator.hardwareConcurrency || 1;
}

/** window.devicePixelRatio; 1 when unavailable. */
export function getDevicePixelRatio(): number {
  return typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
}

/** window.matchMedia with an environment guard; null when unavailable. */
export function matchMediaSafe(query: string): MediaQueryList | null {
  return typeof window === "undefined" ? null : window.matchMedia(query);
}

/** Viewport width in px (window.innerWidth); 0 when no DOM exists. */
export function getViewportWidth(): number {
  return typeof window === "undefined" ? 0 : window.innerWidth;
}

/** Viewport height in px (window.innerHeight); 0 when no DOM exists. */
export function getViewportHeight(): number {
  return typeof window === "undefined" ? 0 : window.innerHeight;
}

/** window.location.origin; empty string when no DOM exists. */
export function getLocationOrigin(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

/** window.location.hostname; empty string when no DOM exists. */
export function getLocationHostname(): string {
  return typeof window === "undefined" ? "" : window.location.hostname;
}

export function getLocationSearch(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}

export function getLocationHash(): string {
  return typeof window === "undefined" ? "" : window.location.hash;
}

/** window.location.assign with an environment guard. */
export function assignLocation(url: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(url);
}

/** window.location.reload with an environment guard. */
export function reloadPage(): void {
  if (typeof window === "undefined") return;
  window.location.reload();
}

export function isSecureContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

/** document.visibilityState === "visible"; false when no DOM exists. */
export function isDocumentVisible(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "visible";
}

export function isDocumentFocused(): boolean {
  return typeof document !== "undefined" && document.hasFocus();
}

/** Subscribe to document visibilitychange; returns unsubscribe (noop off-DOM). */
export function onDocumentVisibilityChange(listener: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("visibilitychange", listener);
  return () => {
    document.removeEventListener("visibilitychange", listener);
  };
}

export function getDocumentElement(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.documentElement;
}

export function getDocumentActiveElement(): Element | null {
  return typeof document === "undefined" ? null : document.activeElement;
}

export function focusWindow(): void {
  if (typeof window === "undefined") return;
  window.focus();
}

/** Focus an element by id on the next tick of the caller's choosing; null-safe. */
export function focusElementById(id: string): void {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.focus();
}

export function getComputedStyleSafe(element: Element): CSSStyleDeclaration | null {
  return typeof window === "undefined" ? null : window.getComputedStyle(element);
}

export function isGetUserMediaAvailable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

/** "Notification" in window — desktop/web Notification API presence. */
export function hasNotificationApi(): boolean {
  return isBrowser() && "Notification" in window;
}

/** The global document object; null off-DOM. Prefer focused helpers over this. */
export function getDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

/** Scroll an element into view by id; null-safe with an environment guard. */
export function scrollElementIntoViewById(id: string, options?: ScrollIntoViewOptions): void {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView(options);
}

export function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(new Error("getUserMedia unavailable."));
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}
