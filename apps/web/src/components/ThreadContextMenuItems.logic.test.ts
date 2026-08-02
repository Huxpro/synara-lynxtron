import { describe, expect, it } from "vitest";

import { buildThreadContextMenuItems } from "./ThreadContextMenuItems.logic";

describe("buildThreadContextMenuItems", () => {
  it("preserves the full Web thread action order and grouping", () => {
    expect(
      buildThreadContextMenuItems({
        isPinned: false,
        clearNotificationAvailable: true,
        middleItems: [{ id: "handoff:claude", label: "Handoff to Claude" }],
        copyPathAvailable: true,
        openPathInTerminalAvailable: true,
        extraItems: [{ id: "return-to-single-chat", label: "Return to single chat" }],
      }),
    ).toEqual([
      { id: "rename", label: "Rename thread" },
      { id: "toggle-pin", label: "Pin thread" },
      { id: "clear-notification", label: "Clear notification" },
      { id: "mark-unread", label: "Mark unread" },
      { id: "handoff:claude", label: "Handoff to Claude" },
      { id: "copy-path", label: "Copy Path", separatorBefore: true },
      { id: "open-path-in-terminal", label: "Open Path in Terminal" },
      { id: "copy-thread-id", label: "Copy Thread ID" },
      { id: "return-to-single-chat", label: "Return to single chat" },
      { id: "archive", label: "Archive", separatorBefore: true },
      { id: "delete", label: "Delete", destructive: true },
    ]);
  });

  it("omits unavailable native actions without leaving empty groups", () => {
    expect(
      buildThreadContextMenuItems({
        isPinned: true,
        renameAvailable: false,
        markUnreadAvailable: false,
        copyPathAvailable: false,
        openPathInTerminalAvailable: false,
      }),
    ).toEqual([
      { id: "toggle-pin", label: "Unpin thread" },
      { id: "copy-thread-id", label: "Copy Thread ID", separatorBefore: true },
      { id: "archive", label: "Archive", separatorBefore: true },
      { id: "delete", label: "Delete", destructive: true },
    ]);
  });
});
