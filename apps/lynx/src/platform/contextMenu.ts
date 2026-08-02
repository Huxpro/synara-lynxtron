import 'background-only';

import type { ContextMenuItem } from '@synara/contracts';

import { bridgeCall } from './bridge';

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
  position: { readonly x: number; readonly y: number }
): Promise<T | null> {
  const reply = await bridgeCall<{ readonly id: T | null }>(
    'contextMenuShow',
    contextMenuBridgePayload(items, position)
  );
  return reply.id;
}
