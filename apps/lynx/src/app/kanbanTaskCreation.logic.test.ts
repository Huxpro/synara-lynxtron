import { describe, expect, it } from "@rstest/core";

import { buildNativeKanbanTaskCreateCommand } from "./kanbanTaskCreation.logic";

describe("native Kanban task creation", () => {
  it("builds a persistent draft thread from the task prompt", () => {
    expect(
      buildNativeKanbanTaskCreateCommand({
        commandId: "command-1",
        createdAt: "2026-08-10T00:00:00.000Z",
        envMode: "worktree",
        modelSelection: { provider: "codex", model: "gpt-5.6-sol" },
        projectId: "project-1" as never,
        prompt: "  Fix the settings search layout and verify dark mode.  ",
        threadId: "thread-1",
      }),
    ).toEqual({
      type: "thread.create",
      commandId: "command-1",
      threadId: "thread-1",
      projectId: "project-1",
      title: "Fix the settings search layout and",
      modelSelection: { provider: "codex", model: "gpt-5.6-sol" },
      runtimeMode: "full-access",
      interactionMode: "default",
      envMode: "worktree",
      branch: null,
      worktreePath: null,
      createdAt: "2026-08-10T00:00:00.000Z",
    });
  });
});
