import { describe, expect, it } from "@rstest/core";

import {
  buildCanonicalSliceKanbanBoard,
  buildCanonicalSlicePullRequestList,
  createPullRequestActionGate,
  EMPTY_KANBAN_BOARD,
  EMPTY_PULL_REQUEST_LIST,
  selectKanbanProjectBoard,
} from "./FeatureListsPage.logic";
import type { KanbanBoard, KanbanProjectBoard } from "@synara-web/components/kanban/kanban.logic";
import { ProjectId, type PullRequestListEntry } from "@synara/contracts";
import type { PullRequestSnapshot, SidebarSnapshot } from "./queries";

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

describe("buildCanonicalSlicePullRequestList", () => {
  it("uses the canonical pinned-first grouping without rebuilding entries", () => {
    const regular = makePullRequest("regular", false, true);
    const pinned = makePullRequest("pinned", true, false);
    const list = buildCanonicalSlicePullRequestList(
      makePullRequestSnapshot("viewer", [regular, pinned]),
    );

    expect(list.entries).toEqual([pinned, regular]);
    expect(list.entries[0]?.mergeability).toBe("unknown");
    expect(list.grouped?.map((group) => group.label)).toEqual(["Pinned", "Needs my review"]);
  });

  it("provides a stable empty fallback before the query resolves", () => {
    expect(buildCanonicalSlicePullRequestList(undefined)).toBe(EMPTY_PULL_REQUEST_LIST);
  });

  it("uses the canonical involvement filter and ungroups a scoped tab", () => {
    const requested = makePullRequest("requested", false, true);
    const authored: PullRequestListEntry = {
      ...makePullRequest("authored", false, false),
      author: { login: "viewer", name: "Viewer", url: null, avatarUrl: null },
    };

    const list = buildCanonicalSlicePullRequestList(
      makePullRequestSnapshot("viewer", [requested, authored]),
      "authored",
    );

    expect(list.entries).toEqual([authored]);
    expect(list.grouped).toBeNull();
  });

  it("uses the shared free-text matcher without changing canonical ordering", () => {
    const branchMatch: PullRequestListEntry = {
      ...makePullRequest("unrelated title", false, false),
      headBranch: "feature/Search-Fidelity",
      author: { login: "reviewer", name: "Reviewer", url: null, avatarUrl: null },
    };
    const numberMatch: PullRequestListEntry = {
      ...makePullRequest("number match", true, false),
      number: 350,
    };
    const snapshot = makePullRequestSnapshot("viewer", [branchMatch, numberMatch]);

    expect(
      buildCanonicalSlicePullRequestList(snapshot, "all", "  SEARCH-fidelity ").entries,
    ).toEqual([branchMatch]);
    expect(buildCanonicalSlicePullRequestList(snapshot, "all", "#350").entries).toEqual([
      numberMatch,
    ]);
    expect(buildCanonicalSlicePullRequestList(snapshot, "all", "reviewer").entries).toEqual([
      branchMatch,
    ]);
    expect(buildCanonicalSlicePullRequestList(snapshot, "all", "no match").entries).toEqual([]);
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

function makePullRequestSnapshot(
  viewer: string,
  entries: readonly PullRequestListEntry[],
): PullRequestSnapshot {
  return { viewer, entries, errors: [], repositoryBatches: [] };
}

function makePullRequest(
  title: string,
  isPinned: boolean,
  viewerReviewRequested: boolean,
): PullRequestListEntry {
  return {
    projectId: ProjectId.makeUnsafe("project-a"),
    projectTitle: "Project A",
    repository: `acme/${title}`,
    number: isPinned ? 1 : 2,
    title,
    url: `https://github.com/acme/${title}/pull/1`,
    author: null,
    headBranch: title,
    baseBranch: "main",
    state: "open",
    isDraft: false,
    additions: 1,
    deletions: 0,
    createdAt: "2026-07-30T08:00:00.000Z",
    updatedAt: "2026-07-30T09:00:00.000Z",
    reviewDecision: null,
    viewerReviewRequested,
    isPinned,
    projectContexts: [
      {
        projectId: ProjectId.makeUnsafe("project-a"),
        projectTitle: "Project A",
        isPinned,
      },
    ],
    mergeability: "unknown",
    labels: [],
  };
}
