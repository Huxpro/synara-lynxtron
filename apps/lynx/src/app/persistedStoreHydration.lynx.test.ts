import { afterAll, beforeAll, describe, expect, it, rs } from "@rstest/core";
import type { OrchestrationShellSnapshot } from "@synara/contracts";

// What a previous run saved: a local project name, an appearance and a collapsed row.
const PERSISTED_STATE_KEY = "synara:renderer-state:v8";
const RECENT_VIEWS_KEY = "synara:recent-views:v1";
const SAVED_PROJECT_STATE = {
  expandedProjectCwds: [],
  projectOrderCwds: ["/tmp/project-a"],
  projectNamesByCwd: { "/tmp/project-a": "My renamed project" },
  projectAppearanceByCwd: {},
};
const SAVED_RECENT_VIEWS = {
  state: { recentViews: [{ kind: "settings", section: "general" }] },
  version: 0,
};

const SHELL_SNAPSHOT = {
  snapshotSequence: 1,
  spaces: [],
  projects: [
    {
      id: "project-a",
      kind: "project",
      title: "Project A",
      workspaceRoot: "/tmp/project-a",
      defaultModelSelection: null,
      scripts: [],
      isPinned: false,
      spaceId: null,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
      deletedAt: null,
    },
  ],
  threads: [],
  updatedAt: "2026-08-15T00:00:00.000Z",
} as unknown as OrchestrationShellSnapshot;

function savedProjectNames(raw: string | null): Record<string, string> {
  return (
    (JSON.parse(raw ?? "{}") as { projectNamesByCwd?: Record<string, string> }).projectNamesByCwd ??
    {}
  );
}

describe("Lynx persisted store hydration", () => {
  beforeAll(() => {
    // The host always answers with the saved file: a write from the renderer only
    // changes the mirror, so each test can start again from the same disk state.
    rs.stubGlobal("NativeModules", {
      bridge: {
        call: (name: string, _params: unknown, callback: (reply: string) => void) => {
          const entries = {
            [PERSISTED_STATE_KEY]: JSON.stringify(SAVED_PROJECT_STATE),
            [RECENT_VIEWS_KEY]: JSON.stringify(SAVED_RECENT_VIEWS),
          };
          queueMicrotask(() => callback(JSON.stringify(name === "storageDump" ? { entries } : {})));
        },
      },
    });
  });

  afterAll(() => {
    rs.unstubAllGlobals();
  });

  it("reproduces the loss: stores created before hydration overwrite what was saved", async () => {
    // Importing the store evaluates it against the still-empty mirror, as App's
    // static import of the router does at startup.
    const { useStore, persistAppStateNow } = await import("@synara-web/store");
    const { useRecentViewsStore } = await import("@synara-web/recentViewsStore");
    const { hydrateStorage, webStorage } = await import("../platform/storage");
    await hydrateStorage();
    // A zustand persist store hydrated at creation, from nothing, and stays that way.
    expect(useRecentViewsStore.getState().recentViews).toEqual([]);
    expect(savedProjectNames(webStorage.getItem(PERSISTED_STATE_KEY))).toEqual(
      SAVED_PROJECT_STATE.projectNamesByCwd,
    );

    useStore.getState().syncServerShellSnapshot(SHELL_SNAPSHOT);
    expect(useStore.getState().projects[0]?.localName ?? null).toBeNull();
    persistAppStateNow();
    expect(savedProjectNames(webStorage.getItem(PERSISTED_STATE_KEY))).toEqual({});
  });

  it("reloads project preferences and persist stores before the first snapshot", async () => {
    const { useStore, persistAppStateNow } = await import("@synara-web/store");
    const { initialState } = await import("@synara-web/storeState");
    const { useRecentViewsStore } = await import("@synara-web/recentViewsStore");
    const { retryHydrateStorage, webStorage } = await import("../platform/storage");
    const { rehydratePersistedStores } = await import("./persistedStoreHydration.lynx");
    useStore.setState(initialState);
    await retryHydrateStorage();
    expect(useRecentViewsStore.getState().recentViews).toEqual([]);

    await rehydratePersistedStores();
    useStore.getState().syncServerShellSnapshot(SHELL_SNAPSHOT);

    const project = useStore.getState().projects[0];
    expect(project?.localName).toBe("My renamed project");
    expect(project?.expanded).toBe(false);
    persistAppStateNow();
    expect(savedProjectNames(webStorage.getItem(PERSISTED_STATE_KEY))).toEqual(
      SAVED_PROJECT_STATE.projectNamesByCwd,
    );
    expect(useRecentViewsStore.getState().recentViews).toEqual(
      SAVED_RECENT_VIEWS.state.recentViews,
    );
  });
});
