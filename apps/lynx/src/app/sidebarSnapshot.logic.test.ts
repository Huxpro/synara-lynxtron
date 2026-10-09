import { describe, expect, it } from "@rstest/core";
import type {
  OrchestrationShellSnapshot,
  OrchestrationSidebarSearchSnapshot,
} from "@synara/contracts";
import { syncServerShellSnapshot } from "@synara-web/storeProjection";
import { initialState, type AppState } from "@synara-web/storeState";

import {
  createRouteThreadSummariesSelector,
  createSidebarSnapshotSelector,
  projectSidebarSnapshot,
  type SidebarSnapshotLocalInputs,
} from "./sidebarSnapshot.logic";

const MODEL = { provider: "codex", model: "gpt-5.6-sol" } as const;

function shellThread(overrides: Record<string, unknown> & { readonly id: string }) {
  return {
    projectId: "project-a",
    title: overrides.id,
    modelSelection: MODEL,
    runtimeMode: "approval-required",
    interactionMode: "default",
    envMode: "local",
    branch: "main",
    worktreePath: null,
    isPinned: false,
    parentThreadId: null,
    sidechatSourceThreadId: null,
    forkSourceThreadId: null,
    subagentAgentId: null,
    subagentNickname: null,
    subagentRole: null,
    hasPendingApprovals: false,
    hasPendingUserInput: false,
    hasActionableProposedPlan: false,
    latestUserMessageAt: null,
    latestTurn: null,
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
    archivedAt: null,
    handoff: null,
    session: null,
    ...overrides,
  };
}

function shellSession(status: string, providerName: string | null) {
  return {
    threadId: "unused",
    status,
    providerName,
    runtimeMode: "approval-required",
    activeTurnId: status === "running" ? "turn-live" : null,
    lastError: null,
    updatedAt: "2026-08-15T00:00:00.000Z",
  };
}

const SHELL_SNAPSHOT = {
  snapshotSequence: 7,
  spaces: [
    {
      id: "space-b",
      name: "Beta",
      icon: "folder",
      sortOrder: 1,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "space-a",
      name: "Alpha",
      icon: "folder",
      sortOrder: 0,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    },
  ],
  projects: [
    {
      id: "project-a",
      kind: "project",
      title: "Project A",
      workspaceRoot: "/tmp/project-a",
      defaultModelSelection: null,
      scripts: [],
      isPinned: true,
      spaceId: "space-a",
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
      deletedAt: null,
    },
    {
      id: "home",
      kind: "chat",
      title: "Home",
      workspaceRoot: "/tmp/home",
      defaultModelSelection: null,
      scripts: [],
      isPinned: false,
      spaceId: null,
      createdAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z",
      deletedAt: null,
    },
  ],
  threads: [
    shellThread({
      id: "running",
      title: "Running thread",
      isPinned: true,
      updatedAt: "2026-08-16T00:00:00.000Z",
      latestUserMessageAt: "2026-08-16T00:00:00.000Z",
      latestTurn: {
        turnId: "turn-live",
        state: "running",
        requestedAt: "2026-08-16T00:00:00.000Z",
        startedAt: "2026-08-16T00:00:00.000Z",
        completedAt: null,
        assistantMessageId: null,
      },
      session: shellSession("running", "claudeAgent"),
    }),
    shellThread({
      id: "approval",
      title: "Needs approval",
      hasPendingApprovals: true,
      updatedAt: "2026-08-15T00:00:00.000Z",
      latestTurn: {
        turnId: "turn-1",
        state: "completed",
        requestedAt: "2026-08-15T00:00:00.000Z",
        startedAt: "2026-08-15T00:00:00.000Z",
        completedAt: "2026-08-15T00:00:01.000Z",
        assistantMessageId: null,
      },
      session: shellSession("ready", "codex"),
    }),
    shellThread({
      id: "child",
      title: "Subagent",
      parentThreadId: "running",
      subagentAgentId: "agent-1",
      subagentNickname: "Scout",
      subagentRole: "explorer",
    }),
    shellThread({ id: "home-chat", projectId: "home", title: "Home chat" }),
    shellThread({
      id: "archived",
      title: "Archived chat",
      archivedAt: "2026-08-14T12:00:00.000Z",
    }),
  ],
  updatedAt: "2026-08-16T00:00:00.000Z",
} as unknown as OrchestrationShellSnapshot;

const LOCAL: SidebarSnapshotLocalInputs = {
  ready: true,
  searchSnapshot: undefined,
  dismissedThreadStatusKeyByThreadId: {},
};

function hydratedState(): AppState {
  return syncServerShellSnapshot(initialState, SHELL_SNAPSHOT);
}

describe("sidebar snapshot from the shared store", () => {
  it("projects the rows, pills and markers the shell snapshot poll used to produce", () => {
    const snapshot = projectSidebarSnapshot(hydratedState(), LOCAL);

    // Flat display list: unarchived, no subagent children, store order.
    expect(snapshot.threads.map((thread) => thread.id)).toEqual([
      "running",
      "approval",
      "home-chat",
    ]);
    expect(snapshot.threads[0]).toMatchObject({
      id: "running",
      title: "Running thread",
      projectId: "project-a",
      project: "Project A",
      messageCount: 0,
      isPinned: true,
      // `live` is upstream's `hasLiveTailWork`, which needs the thread's
      // messages and activities; a shell-only running thread shows its state
      // through the status pill.
      live: false,
      provider: "claudeAgent",
      sessionStatus: "running",
      activeTurnId: "turn-live",
      updatedAt: "2026-08-16T00:00:00.000Z",
      latestUserMessageAt: "2026-08-16T00:00:00.000Z",
      envMode: "local",
      branch: "main",
    });
    expect(snapshot.threads[0]?.status).toMatchObject({ label: "Working" });
    expect(snapshot.threads[1]).toMatchObject({ id: "approval", live: false, provider: "codex" });
    expect(snapshot.threads[1]?.status).toMatchObject({ label: "Pending Approval" });
    expect(snapshot.threads[2]?.status).toBeNull();

    expect(snapshot.archivedThreads).toEqual([
      expect.objectContaining({
        id: "archived",
        project: "Project A",
        archivedAt: "2026-08-14T12:00:00.000Z",
        live: false,
        provider: "codex",
      }),
    ]);
    // Worktree bookkeeping sees every thread, archived and children included.
    expect(snapshot.workspaceThreads.map((thread) => thread.id)).toEqual([
      "running",
      "approval",
      "child",
      "home-chat",
      "archived",
    ]);
    expect(snapshot.projects).toEqual([
      expect.objectContaining({
        id: "project-a",
        kind: "project",
        title: "Project A",
        workspaceRoot: "/tmp/project-a",
        isPinned: true,
        spaceId: "space-a",
      }),
      expect.objectContaining({ id: "home", kind: "chat", title: "Home", spaceId: null }),
    ]);
    expect(snapshot.kanbanProjects).toEqual([
      { id: "project-a", kind: "project", name: "Project A" },
      { id: "home", kind: "chat", name: "Home" },
    ]);
    expect(snapshot.kanbanThreads.map((thread) => thread.id)).toEqual([
      "running",
      "approval",
      "home-chat",
    ]);
    expect(snapshot.searchProjects.map((project) => project.id)).toEqual(["project-a", "home"]);
    expect(snapshot.searchThreads.map((thread) => thread.id)).toEqual([
      "running",
      "approval",
      "home-chat",
    ]);
  });

  it("does not wait for the optional search message index", () => {
    // Projects and threads render from the store alone; message windows only
    // refine search results and counts when they arrive.
    const select = createSidebarSnapshotSelector();
    const withoutIndex = select(hydratedState(), { ...LOCAL, searchSnapshot: undefined });
    expect(withoutIndex?.projects).toHaveLength(2);
    expect(withoutIndex?.threads).toHaveLength(3);
    expect(withoutIndex?.searchThreads).toHaveLength(3);
  });

  it("orders spaces the way the store does, not the way the snapshot listed them", () => {
    expect(projectSidebarSnapshot(hydratedState(), LOCAL).spaces.map((space) => space.id)).toEqual([
      "space-a",
      "space-b",
    ]);
  });

  it("hides a status the user dismissed", () => {
    const state = hydratedState();
    const pending = projectSidebarSnapshot(state, LOCAL).threads[1]?.status;
    expect(pending).toMatchObject({ label: "Pending Approval" });
    const dismissed = projectSidebarSnapshot(state, {
      ...LOCAL,
      dismissedThreadStatusKeyByThreadId: { approval: String(pending?.dismissalKey) },
    }).threads[1]?.status;
    expect(dismissed?.label).not.toBe("Pending Approval");
    // A key recorded for an earlier status does not hide the current one.
    expect(
      projectSidebarSnapshot(state, {
        ...LOCAL,
        dismissedThreadStatusKeyByThreadId: { approval: "Pending Approval:stale" },
      }).threads[1]?.status,
    ).toEqual(pending);
  });

  it("takes message counts from the search snapshot until the store has the thread's messages", () => {
    const searchSnapshot = {
      snapshotSequence: 7,
      threads: [
        {
          threadId: "approval",
          messages: [
            { id: "m1", role: "user", text: "hello", createdAt: "2026-08-15T00:00:00.000Z" },
            { id: "m2", role: "assistant", text: "hi", createdAt: "2026-08-15T00:00:01.000Z" },
          ],
        },
      ],
    } as unknown as OrchestrationSidebarSearchSnapshot;
    const state = hydratedState();
    const snapshot = projectSidebarSnapshot(state, { ...LOCAL, searchSnapshot });
    expect(snapshot.threads.find((thread) => thread.id === "approval")?.messageCount).toBe(2);

    const withStoreMessages = projectSidebarSnapshot(
      {
        ...state,
        messageIdsByThreadId: {
          ...state.messageIdsByThreadId,
          approval: ["m1", "m2", "m3"],
        } as unknown as AppState["messageIdsByThreadId"],
      },
      { ...LOCAL, searchSnapshot },
    );
    expect(withStoreMessages.threads.find((thread) => thread.id === "approval")?.messageCount).toBe(
      3,
    );
  });

  it("is not limited to the 80 threads the bounded sidebar poll returned", () => {
    const threads = Array.from({ length: 200 }, (_, index) =>
      shellThread({ id: `thread-${index}`, title: `Thread ${index}` }),
    );
    const state = syncServerShellSnapshot(initialState, {
      ...SHELL_SNAPSHOT,
      threads,
    } as unknown as OrchestrationShellSnapshot);
    expect(projectSidebarSnapshot(state, LOCAL).threads).toHaveLength(200);
    expect(createRouteThreadSummariesSelector()(state)).toHaveLength(200);
  });
});

describe("sidebar snapshot selector (first paint and memoization)", () => {
  it("reads as loading until session sync hydrates the store", () => {
    const select = createSidebarSnapshotSelector();
    // The store before the first shell snapshot: empty, not "no projects".
    expect(initialState.threadsHydrated).toBe(false);
    expect(select(initialState, LOCAL)).toBeUndefined();
    // Persisted projects without hydration are still not a snapshot.
    expect(
      select({ ...hydratedState(), threadsHydrated: false } satisfies AppState, LOCAL),
    ).toBeUndefined();
    expect(createRouteThreadSummariesSelector()(initialState)).toBeUndefined();
  });

  it("reads as loading until the renderer-local inputs are read", () => {
    const select = createSidebarSnapshotSelector();
    expect(select(hydratedState(), { ...LOCAL, ready: false })).toBeUndefined();
  });

  it("hydrated and empty is an empty snapshot, not loading", () => {
    const select = createSidebarSnapshotSelector();
    const empty = syncServerShellSnapshot(initialState, {
      ...SHELL_SNAPSHOT,
      spaces: [],
      projects: [],
      threads: [],
    } as unknown as OrchestrationShellSnapshot);
    expect(empty.threadsHydrated).toBe(true);
    expect(select(empty, LOCAL)).toMatchObject({ projects: [], threads: [] });
    expect(createRouteThreadSummariesSelector()(empty)).toEqual([]);
  });

  it("keeps its reference across store updates that do not touch the shell", () => {
    const select = createSidebarSnapshotSelector();
    const state = hydratedState();
    const first = select(state, LOCAL);
    // Streaming message text changes `messageByThreadId`, not the shell slices.
    expect(select({ ...state, messageByThreadId: {} }, LOCAL)).toBe(first);
    expect(select({ ...state, projects: [...state.projects] }, LOCAL)).not.toBe(first);
    expect(select(state, { ...LOCAL })).not.toBe(first);
  });
});

describe("route thread summaries from the shared store", () => {
  // Parity fixture: before the shell poll was removed, this output was compared
  // with `projectActiveThreadSummaries(SHELL_SNAPSHOT)` (the projection of the
  // polled `orchestration.getShellSnapshot`) and was equal field for field.
  it("lists every unarchived thread, children included, in store order", () => {
    const threads = createRouteThreadSummariesSelector()(hydratedState());

    expect(threads?.map((thread) => thread.id)).toEqual([
      "running",
      "approval",
      "child",
      "home-chat",
    ]);
    expect(threads?.[0]).toEqual({
      id: "running",
      title: "Running thread",
      projectId: "project-a",
      project: "Project A",
      messageCount: 0,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-16T00:00:00.000Z",
      archivedAt: null,
      latestUserMessageAt: "2026-08-16T00:00:00.000Z",
      // Server session state, as completion toasts and handoff compare it.
      live: true,
      provider: "claudeAgent",
      isPinned: true,
      sessionStatus: "running",
      hasPendingApprovals: false,
      hasPendingUserInput: false,
      latestTurnCompletedAt: null,
      latestTurnState: "running",
      parentThreadId: null,
      subagentAgentId: null,
      subagentNickname: null,
      subagentRole: null,
      forkSourceThreadId: null,
      sidechatSourceThreadId: null,
      handoffSourceProvider: null,
    });
    expect(threads?.[1]).toMatchObject({
      id: "approval",
      live: false,
      provider: "codex",
      sessionStatus: "ready",
      hasPendingApprovals: true,
      latestTurnCompletedAt: "2026-08-15T00:00:01.000Z",
      latestTurnState: "completed",
    });
    expect(threads?.[2]).toMatchObject({
      id: "child",
      parentThreadId: "running",
      subagentAgentId: "agent-1",
      subagentNickname: "Scout",
      subagentRole: "explorer",
      sessionStatus: null,
      live: false,
    });
    expect(threads?.[3]).toMatchObject({ id: "home-chat", project: "Home" });
  });

  it("keeps its reference until threads or projects change", () => {
    const select = createRouteThreadSummariesSelector();
    const state = hydratedState();
    const first = select(state);
    expect(select({ ...state, messageByThreadId: {} })).toBe(first);
    expect(select({ ...state, projects: [...state.projects] })).not.toBe(first);
  });
});
