import { describe, expect, it } from "@rstest/core";

import type { ThreadHeaderSummary } from "./queries";
import { buildNativeThreadForkCreateCommand } from "./threadFork.logic";

function message(id: string, role: "user" | "assistant", text: string) {
  return {
    id,
    role,
    text,
    streaming: false,
    createdAt: "2026-09-29T10:00:00.000Z",
    updatedAt: "2026-09-29T10:00:00.000Z",
  };
}

const thread = {
  id: "thread-source",
  title: "Fixture transcript",
  projectId: "project-1",
  branch: "main",
  envMode: "local",
  worktreePath: null,
  associatedWorktreePath: null,
  associatedWorktreeBranch: null,
  associatedWorktreeRef: null,
  workingDirectory: null,
  modelSelection: { provider: "codex", model: "gpt-5" },
  runtimeMode: "full-access",
  interactionMode: "default",
  messages: [
    message("m1", "user", "First question"),
    message("m2", "assistant", "First answer"),
    message("m3", "user", "Second question"),
    message("m4", "assistant", "Second answer"),
  ],
} as unknown as ThreadHeaderSummary;

describe("Lynx fork from message", () => {
  it("forks into the current checkout with the transcript through the clicked turn", () => {
    const command = buildNativeThreadForkCreateCommand({
      createdAt: "2026-09-30T00:00:00.000Z",
      nextThreadId: "thread-fork",
      thread,
      throughMessageId: "m2",
    });

    expect(command.type).toBe("thread.fork.create");
    expect(command.sourceThreadId).toBe("thread-source");
    expect(command.envMode).toBe("local");
    expect(command.branch).toBe("main");
    expect(command.worktreePath).toBeNull();
    expect(command.importedMessages.map((imported) => imported.text)).toEqual([
      "First question",
      "First answer",
    ]);
  });
});
