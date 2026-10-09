import type { NodesRef } from "@lynx-js/types";

export interface LynxFocusableRef {
  readonly current: NodesRef | null;
}

const programmaticFocusIds = new Set<string>();

export function markProgrammaticLynxFocus(id: string): void {
  if (id.trim()) programmaticFocusIds.add(id);
}

export function consumeProgrammaticLynxFocus(id: string): boolean {
  if (!programmaticFocusIds.delete(id)) return false;
  return true;
}

export function focusLynxNode(ref: LynxFocusableRef): boolean {
  try {
    const node = ref.current;
    if (!node) return false;
    node
      .invoke({
        method: "setFocus",
        params: { focus: true },
      })
      .exec();
    return true;
  } catch {
    return false;
  }
}

export function focusLynxElementById(id: string): boolean {
  if (!id.trim()) return false;
  markProgrammaticLynxFocus(id);
  const focused = focusLynxElementBySelector(`#${id}`);
  if (!focused) programmaticFocusIds.delete(id);
  else setTimeout(() => programmaticFocusIds.delete(id), 250);
  return focused;
}

export function focusLynxElementBySelector(selector: string): boolean {
  if (!selector.trim()) return false;
  try {
    lynx
      .createSelectorQuery()
      .select(selector)
      .invoke({
        method: "setFocus",
        params: { focus: true },
      })
      .exec();
    return true;
  } catch {
    return false;
  }
}

/**
 * Focuses a text field once it has mounted, for surfaces that open with the caret in place
 * (Electron's autofocused picker search and composers). Attempts run on timers: a ref invoke
 * issued during the first render is deferred into the render flush, where a host without a
 * native field (the test renderer) would throw. Returns the cleanup.
 */
export function scheduleLynxInputFocus(
  ref: { readonly current: unknown },
  delaysMs: ReadonlyArray<number>,
): () => void {
  const focus = () => {
    try {
      void Promise.resolve((ref.current as { focus?: () => unknown } | null)?.focus?.()).catch(
        () => undefined,
      );
    } catch {
      // Focus is a convenience; the field stays usable without it.
    }
  };
  const timers = delaysMs.map((delay) => setTimeout(focus, delay));
  // Lynx's clearTimeout rejects extra arguments, so it cannot be passed to forEach directly.
  return () => timers.forEach((timer) => clearTimeout(timer));
}
