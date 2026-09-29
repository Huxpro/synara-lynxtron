import { describe, expect, it } from "@rstest/core";

import {
  buildNativeKanbanArchiveCommand,
  buildNativeKanbanRenameCommand,
  buildNativeKanbanStartCommand,
  resolveNativeKanbanMutationError,
} from "./kanbanMutation.logic";

describe("native Kanban mutation commands", () => {
  it("builds a real turn command from the canonical thread execution settings", () => {
    expect(
      buildNativeKanbanStartCommand({
        assistantDeliveryMode: "streaming",
        commandId: "command-start",
        createdAt: "2026-08-02T00:00:00.000Z",
        interactionMode: "plan",
        messageId: "message-start",
        modelSelection: { provider: "codex", model: "gpt-5", options: {} },
        runtimeMode: "approval-required",
        text: "Run the task",
        threadId: "thread-a",
      }),
    ).toMatchObject({
      type: "thread.turn.start",
      threadId: "thread-a",
      message: { role: "user", text: "Run the task" },
      interactionMode: "plan",
      runtimeMode: "approval-required",
      assistantDeliveryMode: "streaming",
    });
  });

  it("builds canonical rename and archive commands", () => {
    expect(
      buildNativeKanbanRenameCommand({
        commandId: "rename-a",
        threadId: "thread-a",
        title: "Renamed task",
      }),
    ).toEqual({
      type: "thread.meta.update",
      commandId: "rename-a",
      threadId: "thread-a",
      title: "Renamed task",
    });
    expect(
      buildNativeKanbanArchiveCommand({
        commandId: "archive-a",
        threadId: "thread-a",
      }),
    ).toEqual({
      type: "thread.archive",
      commandId: "archive-a",
      threadId: "thread-a",
    });
  });

  it("keeps server detail when available and supplies a stable fallback", () => {
    expect(resolveNativeKanbanMutationError(new Error("offline"))).toBe("offline");
    expect(resolveNativeKanbanMutationError(null)).toBe("The server did not accept the change.");
  });
});
