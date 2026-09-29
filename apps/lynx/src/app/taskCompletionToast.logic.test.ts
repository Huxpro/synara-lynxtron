import { describe, expect, it, rs } from "@rstest/core";

import type { ThreadSummary } from "./queries";
import { makeThreadSummary } from "./queriesTestFixtures";
import {
  applyLynxTerminalActivityEvent,
  detectLynxTaskCompletionToasts,
  resolveLynxTaskCompletionSummaries,
} from "./taskCompletionToast.logic";

function summary(overrides: Partial<ThreadSummary> = {}): ThreadSummary {
  return makeThreadSummary({
    id: "thread-1",
    projectId: "project-1",
    project: "Synara",
    title: "Background task",
    messageCount: 0,
    updatedAt: "2026-08-18T00:00:00.000Z",
    live: false,
    hasPendingApprovals: false,
    hasPendingUserInput: false,
    ...overrides,
  });
}

describe("Lynx task completion toast detection", () => {
  it("notifies when an off-screen live thread settles", () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [summary({ live: true })],
        current: [
          summary({
            latestTurnCompletedAt: "2026-08-18T00:00:00.000Z",
            latestTurnState: "completed",
          }),
        ],
      }),
    ).toEqual([
      {
        title: "Background task",
        body: "Finished working.",
        kind: "thread-completion",
        threadId: "thread-1",
        tone: "success",
      },
    ]);
  });

  it("notifies when an off-screen thread starts needing input", () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [summary()],
        current: [summary({ hasPendingUserInput: true })],
      }),
    ).toEqual([
      {
        title: "Input needed",
        body: "Background task: User input requested.",
        kind: "thread-attention",
        threadId: "thread-1",
        tone: "warning",
      },
    ]);
  });

  it("does not misclassify input-needed transitions as completion", () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [summary({ live: true })],
        current: [
          summary({
            hasPendingApprovals: true,
            latestTurnState: "running",
          }),
        ],
      }),
    ).toEqual([
      {
        title: "Input needed",
        body: "Background task: Command approval requested.",
        kind: "thread-attention",
        threadId: "thread-1",
        tone: "warning",
      },
    ]);
  });

  it("does not notify when live work stops without a completed turn", () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [summary({ live: true })],
        current: [summary({ latestTurnState: "error" })],
      }),
    ).toEqual([]);
  });

  it("suppresses visible threads and initial hydration", () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: "thread-1",
        previous: [summary({ live: true })],
        current: [
          summary({
            latestTurnCompletedAt: "2026-08-18T00:00:00.000Z",
            latestTurnState: "completed",
          }),
        ],
      }),
    ).toEqual([]);
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [],
        current: [summary()],
      }),
    ).toEqual([]);
  });

  it("can include the active thread for system notification delivery", () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: "thread-1",
        includeActiveThread: true,
        previous: [summary({ live: true })],
        current: [
          summary({
            latestTurnCompletedAt: "2026-08-18T00:00:01.000Z",
            latestTurnState: "completed",
          }),
        ],
      }),
    ).toHaveLength(1);
  });

  it("returns every fresh completion from the same snapshot", () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [
          summary({ id: "thread-1", live: true }),
          summary({ id: "thread-2", live: true }),
        ],
        current: [
          summary({
            id: "thread-1",
            latestTurnCompletedAt: "2026-08-18T00:00:01.000Z",
            latestTurnState: "completed",
          }),
          summary({
            id: "thread-2",
            latestTurnCompletedAt: "2026-08-18T00:00:02.000Z",
            latestTurnState: "completed",
          }),
        ],
      }).map((toast) => toast.threadId),
    ).toEqual(["thread-1", "thread-2"]);
  });

  it("suppresses stale transitions replayed after runtime startup", () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        runtimeStartedAtMs: Date.parse("2026-08-18T00:00:05.000Z"),
        previous: [summary({ live: true })],
        current: [
          summary({
            latestTurnCompletedAt: "2026-08-18T00:00:01.000Z",
            latestTurnState: "completed",
          }),
        ],
      }),
    ).toEqual([]);
  });
});

describe("Lynx task completion summary resolution", () => {
  const completion = detectLynxTaskCompletionToasts({
    activeThreadId: null,
    previous: [summary({ live: true })],
    current: [
      summary({
        latestTurnCompletedAt: "2026-08-18T00:00:01.000Z",
        latestTurnState: "completed",
      }),
    ],
  })[0]!;

  it("loads a detail summary only for thread completions", async () => {
    const loadAssistantSummary = rs.fn().mockResolvedValue("Done — tests and builds passed.");
    const attention = {
      ...completion,
      kind: "thread-attention" as const,
      tone: "warning" as const,
    };

    const resolved = await resolveLynxTaskCompletionSummaries({
      toasts: [attention, completion],
      loadAssistantSummary,
    });

    expect(loadAssistantSummary).toHaveBeenCalledTimes(1);
    expect(loadAssistantSummary).toHaveBeenCalledWith("thread-1");
    expect(resolved[0]).toBe(attention);
    expect(resolved[1]?.body).toBe("Done — tests and builds passed.");
  });

  it("preserves the fallback when detail loading fails or has no summary", async () => {
    await expect(
      resolveLynxTaskCompletionSummaries({
        toasts: [completion],
        loadAssistantSummary: () => Promise.reject(new Error("offline")),
      }),
    ).resolves.toEqual([completion]);
    await expect(
      resolveLynxTaskCompletionSummaries({
        toasts: [completion],
        loadAssistantSummary: () => Promise.resolve(null),
      }),
    ).resolves.toEqual([completion]);
  });
});

describe("Lynx managed terminal toast detection", () => {
  const activity = (agentState: "running" | "attention" | "review" | null) =>
    ({
      type: "activity",
      threadId: "thread-background",
      terminalId: "terminal-1",
      createdAt: "2026-08-18T00:00:00.000Z",
      hasRunningSubprocess: agentState === "running",
      cliKind: "codex",
      agentState,
    }) as const;

  it("emits completion when a managed terminal enters review", () => {
    const running = applyLynxTerminalActivityEvent({
      activeThreadId: null,
      current: new Map(),
      event: activity("running"),
    });
    const completed = applyLynxTerminalActivityEvent({
      activeThreadId: null,
      current: running.next,
      event: activity("review"),
    });

    expect(completed.toast).toMatchObject({
      title: "Terminal task completed",
      body: "Codex CLI finished working.",
      threadId: "thread-background",
      tone: "success",
    });
  });

  it("emits attention only on a fresh off-screen transition", () => {
    const first = applyLynxTerminalActivityEvent({
      activeThreadId: null,
      current: new Map(),
      event: activity("attention"),
    });
    const repeated = applyLynxTerminalActivityEvent({
      activeThreadId: null,
      current: first.next,
      event: activity("attention"),
    });

    expect(first.toast).toMatchObject({
      title: "Terminal input needed",
      body: "Codex CLI needs your attention.",
      tone: "warning",
    });
    expect(repeated.toast).toBeNull();
  });

  it("suppresses the visible thread while retaining terminal state", () => {
    const result = applyLynxTerminalActivityEvent({
      activeThreadId: "thread-background",
      current: new Map(),
      event: activity("review"),
    });

    expect(result.toast).toBeNull();
    expect(result.next.size).toBe(1);
  });
});
