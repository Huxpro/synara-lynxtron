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
    expect(source("./threadSummaryProjection.logic.ts")).not.toContain(
      "projectActiveThreadSummaries",
    );
  });

  it("the store-backed hooks issue no shell request and run no timer", () => {
    const hooks = source("./sidebarSnapshot.lynx.ts");
    for (const forbidden of [
      "refetchInterval",
      "setInterval",
      "setTimeout",
      "useQuery",
      "ShellSnapshot",
      "subscribeOrchestrationShellEvents",
    ]) {
      expect(hooks, forbidden).not.toContain(forbidden);
    }
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
    // The one remaining poll in the router is the thread page's (plan Step 4).
    expect(router.match(/refetchInterval/g)).toHaveLength(1);
  });

  it("the sidebar keeps only its non-shell polls", () => {
    const sidebar = source("../components/sidebar/Sidebar.lynx.tsx");
    // project dev servers, local servers, pull-request review count.
    expect(sidebar.match(/refetchInterval/g)).toHaveLength(3);
    expect(source("../components/composer/Composer.lynx.tsx")).not.toContain("refetchInterval");
  });
});
