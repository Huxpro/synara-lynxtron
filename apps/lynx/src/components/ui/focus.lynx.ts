import type { NodesRef } from '@lynx-js/types';

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
        method: 'setFocus',
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
        method: 'setFocus',
        params: { focus: true },
      })
      .exec();
    return true;
  } catch {
    return false;
  }
}
