// FILE: platform/events.ts (Lynx impl)
// Purpose: L1 app-level event target, contract-aligned with
//   synara/apps/web/src/platform/events.ts. The Web impl delegates to `window`;
//   Lynx has no DOM EventTarget, so renderer-local bus events (the `synara:*`
//   CustomEvents that wsTransportEvents.ts publishes) are kept in an in-memory
//   listener table per thread. Document-level listeners have no Lynx source
//   and are accepted as no-ops, exactly as the Web impl behaves without a
//   document.
// Layer: L1 platform port (lynx implementation)
//
// Thread-neutral on purpose: the Web store imports this port at module scope
// on both Lynx threads.

type Listener = (event: Event) => void;

const windowListeners = new Map<string, Set<Listener>>();

function normalizeListener(listener: EventListenerOrEventListenerObject): Listener {
  return typeof listener === "function"
    ? (listener as Listener)
    : (event) => listener.handleEvent(event);
}

const listenerAliases = new WeakMap<object, Listener>();

function resolveListener(listener: EventListenerOrEventListenerObject): Listener {
  if (typeof listener === "function") return listener as Listener;
  let alias = listenerAliases.get(listener);
  if (!alias) {
    alias = normalizeListener(listener);
    listenerAliases.set(listener, alias);
  }
  return alias;
}

export function addWindowEventListener<Type extends keyof WindowEventMap>(
  type: Type,
  listener: (this: Window, event: WindowEventMap[Type]) => void,
  options?: AddEventListenerOptions | boolean,
): void;
export function addWindowEventListener(
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions | boolean,
): void;
export function addWindowEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  _options?: AddEventListenerOptions | boolean,
): void {
  const entries = windowListeners.get(type) ?? new Set<Listener>();
  entries.add(resolveListener(listener));
  windowListeners.set(type, entries);
}

export function removeWindowEventListener<Type extends keyof WindowEventMap>(
  type: Type,
  listener: (this: Window, event: WindowEventMap[Type]) => void,
  options?: EventListenerOptions | boolean,
): void;
export function removeWindowEventListener(
  type: string,
  listener: EventListener,
  options?: EventListenerOptions | boolean,
): void;
export function removeWindowEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  _options?: EventListenerOptions | boolean,
): void {
  const entries = windowListeners.get(type);
  if (!entries) return;
  entries.delete(resolveListener(listener));
  if (entries.size === 0) windowListeners.delete(type);
}

export function dispatchWindowEvent(event: Event): boolean {
  const entries = windowListeners.get(event.type);
  if (!entries) return true;
  // Snapshot: a listener may remove itself (or others) while dispatching.
  for (const listener of Array.from(entries)) {
    try {
      listener(event);
    } catch {
      // A listener must not prevent delivery to the remaining subscribers.
    }
  }
  return true;
}

export function addDocumentEventListener<Type extends keyof DocumentEventMap>(
  type: Type,
  listener: (this: Document, event: DocumentEventMap[Type]) => void,
  options?: AddEventListenerOptions | boolean,
): void;
export function addDocumentEventListener(
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions | boolean,
): void;
export function addDocumentEventListener(
  _type: string,
  _listener: EventListenerOrEventListenerObject,
  _options?: AddEventListenerOptions | boolean,
): void {
  // No document on Lynx; same no-op as the Web impl without a document.
}

export function removeDocumentEventListener<Type extends keyof DocumentEventMap>(
  type: Type,
  listener: (this: Document, event: DocumentEventMap[Type]) => void,
  options?: EventListenerOptions | boolean,
): void;
export function removeDocumentEventListener(
  type: string,
  listener: EventListener,
  options?: EventListenerOptions | boolean,
): void;
export function removeDocumentEventListener(
  _type: string,
  _listener: EventListenerOrEventListenerObject,
  _options?: EventListenerOptions | boolean,
): void {
  // No document on Lynx.
}

/** Test seam: drop every bus listener. */
export function resetWindowEventListenersForTest(): void {
  windowListeners.clear();
}
