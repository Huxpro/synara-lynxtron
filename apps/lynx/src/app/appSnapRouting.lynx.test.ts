import { describe, expect, it, rs } from "@rstest/core";

import {
  appSnapCaptureTimestampMs,
  buildFreshAppSnapThreadCreateCommand,
  createFreshAppSnapTask,
  findAppSnapCaptureThreadId,
} from "./appSnapRouting.lynx";

const bootstrap = {
  homeProject: {
    id: "project-home",
    kind: "chat",
    title: "Home",
    workspaceRoot: "/Users/tester",
    defaultModelSelection: {
      provider: "claudeAgent",
      model: "claude-sonnet-5",
    },
  },
  projects: [],
  normalizedProjects: [],
  spaces: [],
  localFolders: [],
  localFoldersError: null,
  homeDir: "/Users/tester",
  generalSettings: {
    defaultProvider: "codex",
    defaultThreadEnvMode: "worktree",
  },
  serverConfig: {
    homeDir: "/Users/tester",
  },
} as never;

describe("Lynx AppSnap fresh-task routing", () => {
  it("builds a canonical Home task with landing defaults", () => {
    expect(
      buildFreshAppSnapThreadCreateCommand({
        bootstrap,
        commandId: "command-1",
        createdAt: "2026-08-19T00:00:00.000Z",
        defaultProvider: "codex",
        threadId: "thread-fresh",
      }),
    ).toEqual({
      type: "thread.create",
      commandId: "command-1",
      threadId: "thread-fresh",
      projectId: "project-home",
      title: "New chat",
      modelSelection: {
        provider: "claudeAgent",
        model: "claude-sonnet-5",
      },
      runtimeMode: "full-access",
      interactionMode: "default",
      envMode: "worktree",
      branch: null,
      worktreePath: null,
      createdAt: "2026-08-19T00:00:00.000Z",
    });
  });

  it("creates the task through orchestration before returning its route", async () => {
    const dispatchCommand = rs.fn().mockResolvedValue({ sequence: 1 });
    const fetchSnapshot = rs.fn();

    await expect(
      createFreshAppSnapTask({
        defaultProvider: "codex",
        loadBootstrap: rs.fn().mockResolvedValue(bootstrap),
        dispatchCommand,
        fetchSnapshot,
        createCommandId: () => "command-1",
        createThreadId: () => "thread-fresh",
        now: () => new Date("2026-08-19T00:00:00.000Z"),
      }),
    ).resolves.toBe("thread-fresh");
    expect(dispatchCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "thread.create",
        threadId: "thread-fresh",
      }),
    );
    expect(fetchSnapshot).not.toHaveBeenCalled();
  });

  it("recovers an acknowledged create whose response was lost", async () => {
    await expect(
      createFreshAppSnapTask({
        defaultProvider: "codex",
        loadBootstrap: rs.fn().mockResolvedValue(bootstrap),
        dispatchCommand: rs.fn().mockRejectedValue(new Error("socket closed")),
        fetchSnapshot: rs.fn().mockResolvedValue({
          projects: [],
          threads: [{ id: "thread-fresh" }],
        }),
        createCommandId: () => "command-1",
        createThreadId: () => "thread-fresh",
        now: () => new Date("2026-08-19T00:00:00.000Z"),
      }),
    ).resolves.toBe("thread-fresh");
  });

  it("leaves creation failed when neither dispatch nor recovery succeeds", async () => {
    await expect(
      createFreshAppSnapTask({
        defaultProvider: "codex",
        loadBootstrap: rs.fn().mockResolvedValue(bootstrap),
        dispatchCommand: rs.fn().mockRejectedValue(new Error("offline")),
        fetchSnapshot: rs.fn().mockResolvedValue({
          projects: [],
          threads: [],
        }),
        createCommandId: () => "command-1",
        createThreadId: () => "thread-fresh",
        now: () => new Date("2026-08-19T00:00:00.000Z"),
      }),
    ).rejects.toThrow("offline");
  });

  it("restores a pending capture to its persisted draft thread", () => {
    expect(
      findAppSnapCaptureThreadId(
        {
          "thread-other": { images: [{}] },
          "thread-restored": {
            images: [{ appSnapCaptureId: "capture-1" }],
          },
        },
        "capture-1",
      ),
    ).toBe("thread-restored");
  });

  it("uses capture time when valid and a bounded fallback otherwise", () => {
    expect(appSnapCaptureTimestampMs({ capturedAt: "2026-08-19T00:00:00.000Z" }, 123)).toBe(
      Date.parse("2026-08-19T00:00:00.000Z"),
    );
    expect(appSnapCaptureTimestampMs({ capturedAt: "not-a-date" }, 123)).toBe(123);
  });
});
