import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const SIDEBAR_SNAPSHOT_CONSUMERS = [
  "../components/sidebar/Sidebar.lynx.tsx",
  "../components/sidebar/SidebarSearchPaletteHost.lynx.tsx",
  "../components/composer/Composer.lynx.tsx",
  "./FeatureListsPage.tsx",
  "./AutomationsPage.lynx.tsx",
  "./SettingsAdvancedPanel.lynx.tsx",
  "./SettingsArchivedPanel.lynx.tsx",
  "./SettingsIntegrationsPanel.lynx.tsx",
  "./SettingsWorktreesPanel.lynx.tsx",
] as const;

describe("sidebar read path (plan Step 3)", () => {
  it("every sidebar surface reads the shared store, not a polled snapshot", () => {
    for (const path of SIDEBAR_SNAPSHOT_CONSUMERS) {
      const consumer = source(path);
      expect(consumer, path).toContain("useSidebarSnapshot()");
      expect(consumer, path).not.toContain("fetchSidebarSnapshot");
      // No query observer on the old key (two injected `invalidate` callbacks
      // still name it; they are no-ops now).
      expect(consumer, path).not.toMatch(/queryKey: \["sidebar-snapshot"[^\]]*\],\s*queryFn/);
    }
  });

  it("the polled snapshot fetchers and their projection caches are gone", () => {
    const queries = source("./queries.ts");
    for (const removed of [
      "fetchSidebarSnapshot",
      "fetchThreads",
      "sidebarSnapshotCache",
      "sidebarSearchSnapshotCache",
      "invalidateSidebarSnapshotProjectionCache",
      "projectShellSnapshot",
    ]) {
      expect(queries, removed).not.toContain(removed);
    }
  });

  it("the store-backed hooks poll nothing and request the shell only on demand", () => {
    const hooks = source("./sidebarSnapshot.lynx.ts");
    for (const forbidden of [
      "refetchInterval",
      "setInterval",
      "useQuery",
      "getSidebarShellSnapshot",
      "subscribeOrchestrationShellEvents",
      "synaraClient",
    ]) {
      expect(hooks, forbidden).not.toContain(forbidden);
    }
    // Two on-demand shell reads through the upstream facade: the user's Retry
    // of a bootstrap that never completed, and the fresh read a destructive
    // action decides on. The render path has none.
    expect(hooks.match(/orchestration\.getShellSnapshot\(\)/g)).toHaveLength(2);
    const renderPath = hooks.slice(
      hooks.indexOf("export function useSidebarSnapshot"),
      hooks.indexOf("export async function readFreshSidebarSnapshot"),
    );
    expect(renderPath).not.toContain("getShellSnapshot");
    // The only store write is the Retry commit, guarded by the bootstrap watch.
    expect(hooks.match(/syncServer\w+\(/g)).toEqual(["syncServerShellSnapshot("]);
    // The one timer is the bootstrap deadline, not a poll.
    expect(hooks.match(/setTimeout\(/g)).toHaveLength(1);
    expect(hooks).toContain("useStore((state) => selectSidebarSnapshot(state, local))");
    expect(hooks).toContain("useStore(selectRouteThreadSummaries)");
    // The projection itself is pure: no client, no store import.
    const projection = source("./sidebarSnapshot.logic.ts");
    expect(projection).not.toContain("synaraClient");
    expect(projection).not.toContain('@synara-web/store"');
    expect(projection).toContain("createSidebarDisplayThreadsSelector");
    expect(projection).toContain("createSidebarTreeThreadsSelector");
    expect(projection).toContain("createThreadShellsSelector");
    expect(projection).toContain("resolveThreadStatusPill");
  });

  it("the route shell takes threads from the store and keeps no thread-list poll", () => {
    const router = source("./router.tsx");
    expect(router).toContain(
      "const [routeThreads, routeThreadsHydrated] = useRouteThreadSummaries();",
    );
    expect(router).not.toContain('queryKey: ["threads"]');
    expect(router).not.toContain("refetchInterval: 5_000");
    // No Lynx-authored interval is left in the router: with query-core running
    // as a client they would all start firing.
    expect(router).not.toContain("refetchInterval");
  });

  it("the sidebar keeps only its non-shell polls", () => {
    const sidebar = source("../components/sidebar/Sidebar.lynx.tsx");
    // The three intervals here never ran on Lynx; they are gone, not revived.
    expect(sidebar).not.toContain("refetchInterval");
    expect(source("../components/composer/Composer.lynx.tsx")).not.toContain("refetchInterval");
  });
});
