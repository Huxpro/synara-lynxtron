import type { ClientOrchestrationCommand } from "@synara/contracts";

import type { ThreadContextMenuActionId } from "@synara-web/components/ThreadContextMenuItems.logic";

const THREAD_CONTEXT_MENU_ACTIONS: Readonly<Record<ThreadContextMenuActionId, true>> = {
  rename: true,
  "toggle-pin": true,
  "clear-notification": true,
  "mark-unread": true,
  "copy-path": true,
  "open-path-in-terminal": true,
  "copy-thread-id": true,
  archive: true,
  delete: true,
};

/** Narrows a native context-menu reply (menu ids are plain strings). */
export function isThreadContextMenuActionId(value: string): value is ThreadContextMenuActionId {
  return Object.hasOwn(THREAD_CONTEXT_MENU_ACTIONS, value);
}

export function resolveSecondaryPointerOffset(event: {
  readonly button?: number;
  readonly buttons?: number;
  readonly x?: number;
  readonly y?: number;
}): { readonly x: number; readonly y: number } | null {
  // Clay currently publishes `button: 0` for every mouse event and preserves
  // the actual pressed buttons in the W3C bitfield instead. Accept either
  // representation so production right-clicks and synthetic events agree.
  const secondaryPressed =
    event.button === 2 || (typeof event.buttons === "number" && (event.buttons & 2) === 2);
  if (!secondaryPressed) return null;
  if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return null;
  return { x: event.x!, y: event.y! };
}

/**
 * Element-local offset of a Lynx `longpress`. Unlike mouse events it has no
 * top-level x/y: the element-relative point lives on the touch entry.
 */
export function resolveLongPressOffset(event: {
  readonly touches?: readonly { readonly x?: number; readonly y?: number }[];
  readonly changedTouches?: readonly { readonly x?: number; readonly y?: number }[];
}): { readonly x: number; readonly y: number } | null {
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];
  const x = touch?.x;
  const y = touch?.y;
  if (x === undefined || y === undefined || !Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

export function buildNativeThreadContextCommand(input: {
  readonly action: ThreadContextMenuActionId;
  readonly commandId: string;
  readonly isPinned: boolean;
  readonly threadId: string;
}): ClientOrchestrationCommand | null {
  if (input.action === "toggle-pin") {
    return {
      type: "thread.meta.update",
      commandId: input.commandId as never,
      threadId: input.threadId as never,
      isPinned: !input.isPinned,
    };
  }
  if (input.action === "archive") {
    return {
      type: "thread.archive",
      commandId: input.commandId as never,
      threadId: input.threadId as never,
    };
  }
  // Deletion requires session, terminal, draft, and dock cleanup. It is owned
  // by deleteNativeProjectThreads even for a single thread, never this builder.
  return null;
}

export function nativeThreadContextConfirmation(
  action: ThreadContextMenuActionId,
  title: string,
  preferences: {
    readonly confirmThreadArchive: boolean;
    readonly confirmThreadDelete: boolean;
  },
): string | null {
  if (action === "archive" && preferences.confirmThreadArchive) {
    return [
      `Archive thread "${title}"?`,
      "Archived threads are hidden from the sidebar but can be restored later.",
    ].join("\n");
  }
  if (action === "delete" && preferences.confirmThreadDelete) {
    return [
      `Delete thread "${title}"?`,
      "This permanently clears conversation history for this thread.",
    ].join("\n");
  }
  return null;
}
