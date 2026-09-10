import 'background-only';

import type { ContextMenuItem } from '@synara/contracts';

import { bridgeCall } from './bridge';

// AppKit invokes the popup callback while the dismissing mouse/key event is still
// unwinding. Reacquiring a terminal input owner in that same task can forward the
// Escape used to close the menu into the PTY. Keep restoration just beyond that event.
const CONTEXT_MENU_FOCUS_RESTORE_DELAY_MS = 250;

export function contextMenuBridgePayload<T extends string>(
  items: readonly ContextMenuItem<T>[],
  position: { readonly x: number; readonly y: number }
) {
  return {
    items: items.map((item) => ({ ...item })),
    position: {
      x: Math.round(position.x),
      y: Math.round(position.y),
    },
  };
}

export async function showContextMenu<T extends string>(
  items: readonly ContextMenuItem<T>[],
  position: { readonly x: number; readonly y: number },
  options?: { readonly restoreFocus?: (() => void) | undefined }
): Promise<T | null> {
  try {
    const reply = await bridgeCall<{ readonly id: T | null }>(
      'contextMenuShow',
      contextMenuBridgePayload(items, position)
    );
    return reply.id;
  } finally {
    if (options?.restoreFocus) {
      const restoreFocus = options.restoreFocus;
      setTimeout(restoreFocus, CONTEXT_MENU_FOCUS_RESTORE_DELAY_MS);
    }
  }
}
