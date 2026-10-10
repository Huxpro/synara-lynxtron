import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx thread page read path", () => {
  it("reads the routed thread from the shared store in the SliceRouter owner", () => {
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const routerOwnerSource = routerSource.slice(
      routerSource.indexOf("export function SliceRouter"),
      routerSource.indexOf("const [persistedLastRoute"),
    );

    expect(routerSource).not.toContain("function useThreadTranscriptPolling");
    expect(routerOwnerSource).toContain("parseRoute(initialRoute).params.threadId ?? null");
    expect(routerOwnerSource).toContain('"background only"');
    // Session sync is the only source of thread detail: no request, no query
    // key, no shell-event invalidation and no timer in the router (plan Step 4).
    expect(routerOwnerSource).toContain("useThreadPageData(activeThreadId)");
    expect(routerSource).not.toContain("thread-detail");
    expect(routerSource).not.toContain("fetchThreadTranscriptRows");
    expect(routerSource).not.toContain("fetchThreadHeaderSummary");
    expect(routerSource).not.toContain("onShellEvent");
    expect(routerSource).not.toContain("getThreadDetailSnapshot");
    expect(routerOwnerSource).toContain("useRouteThreadSummaries()");
    expect(routerOwnerSource).not.toContain("refetchInterval");
    expect(routerSource).not.toContain('queryKey: ["threads"]');
    expect(routerSource).not.toContain('queryKey: ["sidebar-snapshot"]');
    expect(routerOwnerSource).toContain("className={`AppNotificationStack${");
    expect(routerOwnerSource).toContain('route.pathname === "/components-lab"');

    const storeReadSource = readFileSync(
      new URL("./threadPageStore.lynx.ts", import.meta.url),
      "utf8",
    );
    expect(storeReadSource).toContain("createThreadSelector(id)");
    expect(storeReadSource).toContain("state.threadDetailSyncById?.[id]");
    expect(storeReadSource).not.toMatch(/ensureNativeApi|useQuery|invalidateQueries|setState\(/);
    const projectionSource = readFileSync(
      new URL("./threadPageProjection.logic.ts", import.meta.url),
      "utf8",
    );
    expect(projectionSource).not.toMatch(/ensureNativeApi|syncServer\w+|setState\(/);
  });

  it("has one request-backed thread detail read, shared by every one-shot reader", () => {
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
    const queries = read("./queries.ts");
    expect(queries).not.toContain("getThreadDetailSnapshot");
    expect(queries).not.toContain("fetchThreadTranscriptRows");
    expect(queries).not.toContain("fetchThreadHeaderSummary");
    expect(read("./threadDetailRead.lynx.ts").match(/getThreadDetailSnapshot\(/g)).toHaveLength(1);
    // Projected on top of the store, never committed (EventRouter is the only writer).
    expect(read("./threadDetailRead.lynx.ts")).not.toMatch(
      /setState\(|syncServerThreadDetailHotPath/,
    );
    for (const consumer of [
      "./useNativeKanbanCardActions.lynx.tsx",
      "../components/sidebar/Sidebar.lynx.tsx",
      "./TaskCompletionToastHost.lynx.tsx",
      "./EnvironmentPanel.lynx.tsx",
      "./EmbeddedSidechatPane.lynx.tsx",
    ]) {
      expect(read(consumer)).not.toContain("getThreadDetailSnapshot");
    }
  });

  it("passes the query state into the thread surface", () => {
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(routerSource).toContain("currentThread={resolvedActiveThreadData?.summary}");
    expect(routerSource).toContain("data={resolvedActiveThreadData?.data}");
    expect(routerSource).toContain("error={activeThreadError}");
    expect(routerSource).toContain("isPending={resolvedActiveThreadPending}");
  });

  it("delivers the startup route back to the background router", () => {
    const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");

    expect(routerSource).toContain(
      'bridgeCall<{ readonly route?: unknown }>("shellRendererReady")',
    );
    expect(appSource).toContain('bridgeCall("shellUiReady", { route: initialRoute ?? "/" })');
    expect(routerSource).toContain(
      "Memory-history navigation remains available without shell events.",
    );
    expect(routerSource).toContain("setRoute(parseRoute(reply.route))");
    expect(routerSource).toContain("history.replace(reply.route)");
  });

  it("hydrates the initial route through shared Lynx init data", () => {
    const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");

    expect(appSource).toContain("const initData = useInitData()");
    expect(appSource).toContain("initialRoute={initialRoute}");
    expect(appSource).not.toContain("initialThreadBootstrap=");
    expect(appSource).toContain("initialExplorerPath={initialExplorerPath}");
    expect(appSource).toContain("initialExplorerQuery={initialExplorerQuery}");
    expect(appSource).not.toContain("fetchThreadTranscriptRows(");
    expect(appSource).not.toContain("fetchThreadHeaderSummary(");
    expect(appSource).not.toContain("fetchExplorerEntries(");
    expect(appSource).not.toContain("fetchExplorerFile(");
    expect(appSource).not.toContain("queryClient.fetchQuery(");
    expect(appSource).toContain("readPersistedAppearanceFallback(readPersistedAppearance).then(");
    expect(appSource).not.toContain(
      "Promise.all([\n      readPersistedAppearanceFallback(readPersistedAppearance)",
    );
    expect(appSource).not.toContain("Preparing Synara…");
    expect(appSource).toContain('<SynaraLogo className="AppHydrationLogo" aria-label="Synara" />');
    expect(routerSource).toContain("readonly initialRoute: string | null");
    expect(routerSource).toContain("useRoute(initialRoute)");
    expect(routerSource).toContain("resolvedActiveThreadData");
    expect(routerSource).not.toContain("matchingInitialThreadBootstrap");
  });
});
