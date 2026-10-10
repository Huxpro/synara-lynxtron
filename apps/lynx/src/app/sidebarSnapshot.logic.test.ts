import { describe, expect, it } from "@rstest/core";
import type {
  OrchestrationShellSnapshot,
  OrchestrationSidebarSearchSnapshot,
} from "@synara/contracts";
import { applyOrchestrationEventsHotPath } from "@synara-web/storeEventReducer";
import {
  syncServerShellSnapshot,
  syncServerThreadDetailHotPath,
} from "@synara-web/storeProjection";
import { makeDomainEvent, makeReadModelThread } from "@synara-web/storeTestFixtures";
import { initialState, type AppState } from "@synara-web/storeState";

import { linkedThreadsForWorktree, linkedWorktreeCounts } from "./settingsWorktrees.logic";
import {
  createRouteThreadSummariesSelector,
  createSidebarSnapshotSelector,
  projectFreshSidebarSnapshot,
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
      // Upstream's working rule: the running session with a live turn is
      // enough, before any streamed message exists in the store.
      live: true,
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

  it("resolves the statuses upstream's sidebar added: reminder and preparing worktree", () => {
    const state = syncServerShellSnapshot(initialState, {
      ...SHELL_SNAPSHOT,
      threads: [
        shellThread({ id: "local" }),
        shellThread({
          id: "reminder",
          snoozedUntil: null,
          snoozeReminderAt: "2026-08-15T00:00:00.000Z",
        }),
        shellThread({ id: "worktree-first-send", envMode: "worktree" }),
        shellThread({ id: "worktree-idle", envMode: "worktree" }),
      ],
    } as unknown as OrchestrationShellSnapshot);
    const statusById = (local: SidebarSnapshotLocalInputs) =>
      Object.fromEntries(
        projectSidebarSnapshot(state, local).threads.map((thread) => [
          thread.id,
          thread.status ?? null,
        ]),
      );

    const idle = statusById(LOCAL);
    expect(idle.reminder).toMatchObject({ label: "Reminder", dismissible: true });
    expect(idle["worktree-first-send"]).toBeNull();

    // A composer send in flight on a worktree thread with no turn and no session yet.
    const sending = statusById({
      ...LOCAL,
      activeComposerSendThreadIds: new Set(["worktree-first-send", "local"]),
    });
    expect(sending["worktree-first-send"]).toMatchObject({
      label: "Preparing worktree",
      pulse: true,
    });
    expect(sending["worktree-idle"]).toBeNull();
    // Not a worktree thread: the send does not change its status.
    expect(sending.local).toBeNull();

    // The reminder is dismissed by its own key, as upstream stores it.
    expect(
      statusById({
        ...LOCAL,
        dismissedThreadStatusKeyByThreadId: { reminder: "Reminder:2026-08-15T00:00:00.000Z" },
      }).reminder,
    ).toBeNull();
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

function runningRow(snapshot: ReturnType<ReturnType<typeof createSidebarSnapshotSelector>>) {
  return snapshot?.threads.find((thread) => thread.id === "running");
}

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

  // The store's real streaming path: shell first, then thread detail, then
  // growing assistant text through the hot-path reducers session sync uses.
  describe("while a turn streams", () => {
    const RUNNING = "running" as never;
    const assistantDelta = (text: string, updatedAt: string) =>
      makeDomainEvent("thread.message-sent", {
        threadId: RUNNING,
        messageId: "assistant-1" as never,
        role: "assistant",
        text,
        turnId: "turn-live" as never,
        streaming: true,
        attachments: [],
        source: "native",
        createdAt: "2026-08-16T00:00:01.000Z",
        updatedAt,
      } as never);
    const runningDetail = () =>
      makeReadModelThread({
        id: RUNNING,
        projectId: "project-a" as never,
        title: "Running thread",
        branch: "main" as never,
        updatedAt: "2026-08-16T00:00:00.000Z",
        latestTurn: {
          turnId: "turn-live",
          state: "running",
          requestedAt: "2026-08-16T00:00:00.000Z",
          startedAt: "2026-08-16T00:00:00.000Z",
          completedAt: null,
          assistantMessageId: null,
        } as never,
        session: { ...shellSession("running", "claudeAgent"), threadId: "running" } as never,
        messages: [
          {
            id: "user-1",
            role: "user",
            text: "go",
            turnId: null,
            streaming: false,
            createdAt: "2026-08-16T00:00:00.000Z",
            updatedAt: "2026-08-16T00:00:00.000Z",
          },
        ] as never,
      });

    it("guards the running row from the shell on, and text-only deltas keep the snapshot", () => {
      const select = createSidebarSnapshotSelector();
      let state = hydratedState();
      // Shell only: no message has streamed yet, the guard already holds.
      expect(runningRow(select(state, LOCAL))?.live).toBe(true);

      state = syncServerThreadDetailHotPath(state, runningDetail());
      const withDetail = select(state, LOCAL);
      expect(runningRow(withDetail)).toMatchObject({ live: true, messageCount: 1 });

      // The first assistant message is a real change: one more message.
      state = applyOrchestrationEventsHotPath(state, [
        assistantDelta("Hel", "2026-08-16T00:00:01.000Z"),
      ]);
      const firstDelta = select(state, LOCAL);
      expect(firstDelta).not.toBe(withDetail);
      expect(runningRow(firstDelta)).toMatchObject({ live: true, messageCount: 2 });

      // Growing text replaces the message and shell dictionaries in the store,
      // and changes nothing the sidebar shows.
      for (const [index, text] of ["Hello", "Hello wor", "Hello world"].entries()) {
        const before = state;
        state = applyOrchestrationEventsHotPath(state, [
          assistantDelta(text, `2026-08-16T00:00:0${index + 2}.000Z`),
        ]);
        expect(state).not.toBe(before);
        expect(state.messageByThreadId).not.toBe(before.messageByThreadId);
        expect(state.threadShellById).not.toBe(before.threadShellById);
        const snapshot = select(state, LOCAL);
        expect(snapshot).toBe(firstDelta);
        expect(runningRow(snapshot)?.live).toBe(true);
      }
    });

    it("still propagates what the sidebar does show", () => {
      const select = createSidebarSnapshotSelector();
      let state = syncServerThreadDetailHotPath(hydratedState(), runningDetail());
      const before = select(state, LOCAL);

      // A worktree association on any thread reaches the worktree bookkeeping.
      state = {
        ...state,
        threadShellById: {
          ...state.threadShellById,
          [RUNNING]: { ...state.threadShellById![RUNNING]!, worktreePath: "/tmp/wt" },
        },
      };
      const withWorktree = select(state, LOCAL);
      expect(withWorktree).not.toBe(before);
      expect(
        withWorktree?.workspaceThreads.find((thread) => thread.id === "running")?.worktreePath,
      ).toBe("/tmp/wt");

      // The turn ends: the session leaves "running" with the shell, the guard drops.
      state = syncServerShellSnapshot(state, {
        ...SHELL_SNAPSHOT,
        snapshotSequence: 8,
        threads: SHELL_SNAPSHOT.threads.map((thread) =>
          thread.id === "running"
            ? {
                ...thread,
                session: shellSession("ready", "claudeAgent"),
                latestTurn: {
                  ...thread.latestTurn,
                  state: "completed",
                  completedAt: "2026-08-16T00:00:09.000Z",
                },
              }
            : thread,
        ),
      } as unknown as OrchestrationShellSnapshot);
      expect(runningRow(select(state, LOCAL))?.live).toBe(false);
    });
  });
});

describe("fresh sidebar snapshot for a destructive action", () => {
  // Another client linked a conversation to a managed worktree; the shell event
  // has not reached this renderer (delayed, or the stream is recovering). The
  // store is hydrated and stale. Removal is forced and the server does not
  // re-check links, so the decision must come from the server's current shell.
  const WORKTREE = "/tmp/worktrees/feature";
  const serverShell = {
    ...SHELL_SNAPSHOT,
    snapshotSequence: 9,
    threads: [
      ...SHELL_SNAPSHOT.threads,
      shellThread({ id: "late-active", title: "Late active", worktreePath: WORKTREE }),
      shellThread({
        id: "late-archived",
        title: "Late archived",
        associatedWorktreePath: WORKTREE,
        archivedAt: "2026-08-16T01:00:00.000Z",
      }),
    ],
  } as unknown as OrchestrationShellSnapshot;

  it("sees conversations linked on the server before their shell event arrives", () => {
    const staleStore = hydratedState();
    expect(staleStore.threadsHydrated).toBe(true);
    // What the store alone would tell the dialog: nothing is linked.
    expect(
      linkedThreadsForWorktree(
        projectSidebarSnapshot(staleStore, LOCAL).workspaceThreads,
        WORKTREE,
      ),
    ).toEqual([]);

    const fresh = projectFreshSidebarSnapshot(staleStore, serverShell, LOCAL);
    const linked = linkedThreadsForWorktree(fresh.workspaceThreads, WORKTREE);
    expect(linked.map((thread) => thread.id)).toEqual(["late-active", "late-archived"]);
    expect(linkedWorktreeCounts(linked)).toEqual({ active: 1, archived: 1 });
  });

  it("does not write the store", () => {
    const staleStore = hydratedState();
    const frozen = { ...staleStore };
    projectFreshSidebarSnapshot(staleStore, serverShell, LOCAL);
    expect(staleStore).toEqual(frozen);
    expect(staleStore.threadIds).toHaveLength(SHELL_SNAPSHOT.threads.length);
  });

  it("drops a link the server no longer has", () => {
    const linkedStore = syncServerShellSnapshot(initialState, serverShell);
    const fresh = projectFreshSidebarSnapshot(
      linkedStore,
      { ...SHELL_SNAPSHOT, snapshotSequence: 10 } as OrchestrationShellSnapshot,
      LOCAL,
    );
    expect(linkedThreadsForWorktree(fresh.workspaceThreads, WORKTREE)).toEqual([]);
  });

  it("keeps the store's state when the read predates what the stream already applied", () => {
    // The store's projection rejects a snapshot older than the one it integrated
    // (it could resurrect deleted rows), so the stream's newer state decides.
    const linkedStore = syncServerShellSnapshot(initialState, serverShell);
    const fresh = projectFreshSidebarSnapshot(linkedStore, SHELL_SNAPSHOT, LOCAL);
    expect(
      linkedThreadsForWorktree(fresh.workspaceThreads, WORKTREE).map((thread) => thread.id),
    ).toEqual(["late-active", "late-archived"]);
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
