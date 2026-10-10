import { describe, expect, it } from "@rstest/core";

import {
  buildCanonicalSliceKanbanBoard,
  createPullRequestActionGate,
  EMPTY_KANBAN_BOARD,
  selectKanbanProjectBoard,
} from "./FeatureListsPage.logic";
import type { KanbanBoard, KanbanProjectBoard } from "@synara-web/components/kanban/kanban.logic";
import { ProjectId } from "@synara/contracts";
import type { SidebarSnapshot } from "./queries";

describe("buildCanonicalSliceKanbanBoard", () => {
  it("folds home chat containers into the trailing canonical Chats board", () => {
    const snapshot = {
      kanbanProjects: [
        { id: "chat-a", kind: "chat", name: "Home thread title" },
        { id: "project-a", kind: "project", name: "Project A" },
        { id: "studio-a", kind: "studio", name: "Studio" },
      ],
      kanbanThreads: [
        {
          id: "thread-a",
          projectId: "chat-a",
          title: "READY-LYNX-COMPOSER",
          createdAt: "2026-07-30T08:00:00.000Z",
          updatedAt: "2026-07-30T09:00:00.000Z",
          latestUserMessageAt: "2026-07-30T09:00:00.000Z",
          latestTurn: null,
          session: null,
          modelSelection: { provider: "codex", providerInstanceId: null, model: null, options: {} },
          hasPendingApprovals: false,
          hasPendingUserInput: false,
          hasLiveTailWork: false,
          branch: null,
          envMode: null,
          worktreePath: null,
        },
      ],
    } as unknown as SidebarSnapshot;

    const board = buildCanonicalSliceKanbanBoard(snapshot);

    expect(board.projects.map((project) => project.projectName)).toEqual(["Project A", "Chats"]);
    expect(board.projects[1]?.draft[0]?.title).toBe("READY-LYNX-COMPOSER");
  });

  it("projects a persisted Lynx composer draft onto its real thread card", () => {
    const snapshot = {
      kanbanProjects: [{ id: "project-a", kind: "project", name: "Project A" }],
      kanbanThreads: [
        {
          id: "thread-draft",
          projectId: "project-a",
          title: "Verify Kanban fidelity",
          createdAt: "2026-08-10T08:00:00.000Z",
          updatedAt: "2026-08-10T08:00:00.000Z",
          latestUserMessageAt: null,
          latestTurn: null,
          session: null,
          modelSelection: {
            provider: "codex",
            model: "gpt-5.6-sol",
            options: {},
          },
          hasPendingApprovals: false,
          hasPendingUserInput: false,
          hasLiveTailWork: false,
          branch: null,
          envMode: "local",
          worktreePath: null,
        },
      ],
    } as unknown as SidebarSnapshot;

    const board = buildCanonicalSliceKanbanBoard(snapshot, {
      "thread-draft": {
        prompt: "Verify Kanban fidelity in both themes.",
        hasAttachments: false,
        provider: "codex",
        providerInstanceId: null,
      },
    });

    expect(board.totalCount).toBe(1);
    expect(board.projects[0]?.draft[0]).toMatchObject({
      threadId: "thread-draft",
      column: "draft",
      title: "Verify Kanban fidelity",
      provider: "codex",
      draftPrompt: "Verify Kanban fidelity in both themes.",
    });
  });
});

describe("selectKanbanProjectBoard", () => {
  it("returns the exact canonical project board without re-projecting cards", () => {
    const project: KanbanProjectBoard = {
      projectId: ProjectId.makeUnsafe("project-a"),
      projectName: "Project A",
      projectKind: "project",
      draft: [],
      inProgress: [],
      awaitingYou: [],
      done: [],
      totalCount: 0,
      hiddenCount: 0,
    };
    const board: KanbanBoard = { projects: [project], totalCount: 0 };

    expect(selectKanbanProjectBoard(board, "project-a")).toBe(project);
    expect(selectKanbanProjectBoard(board, "missing")).toBeUndefined();
  });

  it("provides a stable empty fallback before the real query resolves", () => {
    expect(EMPTY_KANBAN_BOARD).toEqual({
      projects: [],
      totalCount: 0,
    });
  });
});

describe("createPullRequestActionGate", () => {
  it("rejects a same-frame duplicate and opens again after settlement", () => {
    const gate = createPullRequestActionGate();
    expect(gate.tryAcquire()).toBe(true);
    expect(gate.tryAcquire()).toBe(false);
    gate.release();
    expect(gate.tryAcquire()).toBe(true);
  });
});
