// Lynx replacement for `~/components/ui/contextMenuFallback` (a DOM popup
// positioned with window.innerWidth). Delegates to the native context menu
// port from a background-only function; see confirmDialogFallback.lynx.ts.

import type { ContextMenuItem } from "@synara/contracts";

export async function showContextMenuFallback<T extends string>(
  items: readonly ContextMenuItem<T>[],
  position?: { readonly x: number; readonly y: number },
): Promise<T | null> {
  "background only";
  const { showContextMenu } = await import(/* webpackMode: "eager" */ "../platform/contextMenu");
  return showContextMenu(items, position ?? { x: 0, y: 0 });
}
