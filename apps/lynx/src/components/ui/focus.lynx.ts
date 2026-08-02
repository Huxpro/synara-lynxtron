import type { NodesRef } from '@lynx-js/types';

export interface LynxFocusableRef {
  readonly current: NodesRef | null;
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
  return focusLynxElementBySelector(`#${id}`);
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
