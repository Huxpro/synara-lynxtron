import { ProjectId, ThreadId } from "@synara/contracts";
import { describe, expect, it } from "vitest";

import type { SidebarThreadSummary } from "../../types";
import type { KanbanCard } from "./kanban.logic";
import {
  createKanbanMutationGate,
  resolveKanbanMutationActions,
} from "./kanbanMutation.logic";

const THREAD_ID = ThreadId.makeUnsafe("thread-kanban-mutation");
const PROJECT_ID = ProjectId.makeUnsafe("project-kanban-mutation");

function card(overrides: Partial<KanbanCard> = {}): KanbanCard {
  return {
    cardId: `thread:${THREAD_ID}`,
    threadId: THREAD_ID,
    projectId: PROJECT_ID,
    column: "draft",
    title: "Mutation task",
    provider: "codex",
    isTerminal: false,
    branch: null,
    envMode: "local",
    worktreePath: null,
    thread: {
      id: THREAD_ID,
      projectId: PROJECT_ID,
      title: "Mutation task",
    } as SidebarThreadSummary,
    draftPrompt: "Run the task",
    draftHasAttachments: false,
    sortTimestamp: 0,
    timestamp: null,
    activeWorkStartedAt: null,
    isOptimisticDispatch: false,
    ...overrides,
  };
}

describe("resolveKanbanMutationActions", () => {
  it("offers the real Draft transition plus metadata mutations", () => {
    expect(resolveKanbanMutationActions(card(), { canSupplyStartPrompt: false })).toEqual([
      { id: "start", label: "Start task" },
      { id: "rename", label: "Rename task" },
      { id: "archive", label: "Archive task", destructive: true },
    ]);
  });

  it("does not invent a manual Done transition and blocks archive during live work", () => {
    expect(
      resolveKanbanMutationActions(card({ column: "inProgress" }), {
        canSupplyStartPrompt: false,
      }),
    ).toEqual([{ id: "rename", label: "Rename task" }]);
  });

  it("lets Native collect a missing prompt before starting a server Draft", () => {
    const emptyDraft = card({ draftPrompt: "" });
    expect(resolveKanbanMutationActions(emptyDraft, { canSupplyStartPrompt: false })[0]?.id).toBe(
      "rename",
    );
    expect(resolveKanbanMutationActions(emptyDraft, { canSupplyStartPrompt: true })[0]?.id).toBe(
      "start",
    );
  });

  it("keeps local composer-only cards out of thread metadata mutations", () => {
    const localDraft = card({
      cardId: `draft:${THREAD_ID}`,
      thread: null,
    });
    expect(resolveKanbanMutationActions(localDraft, { canSupplyStartPrompt: false })).toEqual([
      { id: "start", label: "Start task" },
    ]);
  });
});

describe("createKanbanMutationGate", () => {
  it("rejects same-frame duplicates per thread and reopens after settlement", () => {
    const gate = createKanbanMutationGate();
    expect(gate.tryAcquire("a")).toBe(true);
    expect(gate.tryAcquire("a")).toBe(false);
    expect(gate.tryAcquire("b")).toBe(true);
    gate.release("a");
    expect(gate.tryAcquire("a")).toBe(true);
  });
});
