// FILE: ThreadContextMenuItems.logic.ts
// Purpose: Platform-neutral ordering and copy for thread context actions.

import type { ContextMenuItem } from "@synara/contracts";

import { pinActionLabel } from "~/lib/pin.logic";

export type ThreadContextMenuActionId =
  | "rename"
  | "toggle-pin"
  | "clear-notification"
  | "mark-unread"
  | "copy-path"
  | "open-path-in-terminal"
  | "copy-thread-id"
  | "archive"
  | "delete";

export function buildThreadContextMenuItems(input: {
  readonly isPinned: boolean;
  readonly renameAvailable?: boolean;
  readonly pinAvailable?: boolean;
  readonly clearNotificationAvailable?: boolean;
  readonly markUnreadAvailable?: boolean;
  readonly middleItems?: readonly ContextMenuItem<string>[];
  readonly copyPathAvailable?: boolean;
  readonly openPathInTerminalAvailable?: boolean;
  readonly copyThreadIdAvailable?: boolean;
  readonly extraItems?: readonly ContextMenuItem<string>[];
  readonly archiveAvailable?: boolean;
  readonly deleteAvailable?: boolean;
}): ContextMenuItem<string>[] {
  const items: ContextMenuItem<string>[] = [];

  if (input.renameAvailable !== false) {
    items.push({ id: "rename", label: "Rename thread" });
  }
  if (input.pinAvailable !== false) {
    items.push({
      id: "toggle-pin",
      label: pinActionLabel("thread", input.isPinned),
    });
  }
  if (input.clearNotificationAvailable) {
    items.push({ id: "clear-notification", label: "Clear notification" });
  }
  if (input.markUnreadAvailable !== false) {
    items.push({ id: "mark-unread", label: "Mark unread" });
  }
  items.push(...(input.middleItems ?? []));

  let copyGroupStarted = false;
  if (input.copyPathAvailable) {
    items.push({
      id: "copy-path",
      label: "Copy Path",
      separatorBefore: true,
    });
    copyGroupStarted = true;
  }
  if (input.openPathInTerminalAvailable) {
    items.push({
      id: "open-path-in-terminal",
      label: "Open Path in Terminal",
      ...(!copyGroupStarted ? { separatorBefore: true } : {}),
    });
    copyGroupStarted = true;
  }
  if (input.copyThreadIdAvailable !== false) {
    items.push({
      id: "copy-thread-id",
      label: "Copy Thread ID",
      ...(!copyGroupStarted ? { separatorBefore: true } : {}),
    });
  }
  items.push(...(input.extraItems ?? []));

  if (input.archiveAvailable !== false) {
    items.push({ id: "archive", label: "Archive", separatorBefore: true });
  }
  if (input.deleteAvailable !== false) {
    items.push({ id: "delete", label: "Delete", destructive: true });
  }

  return items;
}
