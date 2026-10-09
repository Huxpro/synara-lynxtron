// The Environment / Git / Explorer data paths over the real facade and the
// transport compat, against the host double: what reaches the host for each
// mutation (compared with what the legacy client sent), that stacked actions
// keep their per-phase progress, and that no surface of the group still
// reaches for the legacy client.

import { existsSync, readFileSync } from "node:fs";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@rstest/core";
import { QueryClient } from "@tanstack/react-query";
import {
  gitBranchesQueryOptions,
  gitInitMutationOptions,
  gitPullMutationOptions,
  gitStageFilesMutationOptions,
  gitStatusQueryOptions,
  gitUnstageFilesMutationOptions,
  gitWorkingTreeDiffQueryOptions,
  gitWorkingTreeDiffStatsQueryOptions,
} from "@synara-web/lib/gitReactQuery";
import {
  projectListDirectoriesQueryOptions,
  projectReadFileQueryOptions,
  projectSearchEntriesQueryOptions,
} from "@synara-web/lib/projectReactQuery";
import { serverStopLocalServerMutationOptions } from "@synara-web/lib/serverReactQuery";
import { resetWsNativeApiForTest } from "@synara-web/wsNativeApi";

import { installFakeNativeHost, type FakeNativeHost } from "../adapters/fakeNativeHost.testUtils";
import { ensureNativeApi, setNativeApiForTest } from "../adapters/nativeApi.lynx";
import { highlightExplorerCode } from "../data/hostSyntaxHighlight.lynx";
import { refreshServerProviderStatuses } from "./settingsServerData.lynx";

const CWD = "/repo";

function hostPayload(call: Record<string, unknown>): unknown {
  return typeof call.payloadJson === "string" ? JSON.parse(call.payloadJson) : call.payload;
}

describe("Environment and Git requests over the upstream facade", () => {
  let host: FakeNativeHost;
  let queryClient: QueryClient;
  let firstCall = 0;
  /** Every plain request the host received in this test: [tag, payload], none with `baseUrl`. */
  const requests = () =>
    host
      .callsNamed("synaraRpc")
      .slice(firstCall)
      .map((call) => {
        expect(call.params).not.toHaveProperty("baseUrl");
        return [call.params.tag, hostPayload(call.params)] as const;
      });
  const run = <TArgs, TResult>(
    options: { mutationFn?: (args: TArgs, context: never) => Promise<TResult> },
    args: TArgs,
  ) => options.mutationFn!(args, undefined as never);

  // One host and one facade for the file: upstream's modules reach the facade
  // through two import paths (`~/nativeApi` and a relative import redirected by
  // the build), and only one of them is reachable from `setNativeApiForTest`.
  beforeAll(() => {
    host = installFakeNativeHost({
      rpc: (tag) => {
        if (tag === "server.refreshProviders") return { providers: [{ provider: "codex" }] };
        if (tag === "server.getConfig") return { providers: [], cwd: CWD };
        return { tag };
      },
    });
  });

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    firstCall = host.callsNamed("synaraRpc").length;
  });

  afterAll(async () => {
    await resetWsNativeApiForTest();
    setNativeApiForTest(undefined);
  });

  it("sends the same payloads the legacy client sent for index and branch mutations", async () => {
    await run(gitStageFilesMutationOptions({ cwd: CWD, queryClient }), ["a.ts", "b.ts"]);
    await run(gitUnstageFilesMutationOptions({ cwd: CWD, queryClient }), ["a.ts"]);
    await run(gitPullMutationOptions({ cwd: CWD, queryClient }), undefined);
    await run(gitInitMutationOptions({ cwd: CWD, queryClient }), undefined);
    await ensureNativeApi().git.checkout({ cwd: CWD, branch: "feature" });
    await ensureNativeApi().git.statusLocal({ cwd: CWD });
    await run(serverStopLocalServerMutationOptions({ queryClient }), { pid: 42, port: 3000 });
    await ensureNativeApi().shell.openInEditor("/repo/file.ts", "vscode");

    expect(requests()).toEqual([
      ["git.stageFiles", { cwd: CWD, paths: ["a.ts", "b.ts"] }],
      ["git.unstageFiles", { cwd: CWD, paths: ["a.ts"] }],
      ["git.pull", { cwd: CWD }],
      ["git.init", { cwd: CWD }],
      ["git.checkout", { cwd: CWD, branch: "feature" }],
      ["git.statusLocal", { cwd: CWD }],
      ["server.stopLocalServer", { pid: 42, port: 3000 }],
      ["shell.openInEditor", { cwd: "/repo/file.ts", editor: "vscode" }],
    ]);
  });

  it("reads status, branches, diffs and explorer files through upstream's queries", async () => {
    await queryClient.fetchQuery(gitStatusQueryOptions(CWD));
    await queryClient.fetchQuery(gitBranchesQueryOptions(CWD));
    await queryClient.fetchQuery(gitWorkingTreeDiffQueryOptions({ cwd: CWD, scope: "staged" }));
    await queryClient.fetchQuery(gitWorkingTreeDiffStatsQueryOptions({ cwd: CWD }));
    await queryClient.fetchQuery(
      projectListDirectoriesQueryOptions({ cwd: CWD, relativePath: "src", includeFiles: true }),
    );
    await queryClient.fetchQuery(
      projectSearchEntriesQueryOptions({ cwd: CWD, query: "app", kind: "file", limit: 80 }),
    );
    await queryClient.fetchQuery(
      projectReadFileQueryOptions({ cwd: CWD, relativePath: "src/app.ts" }),
    );

    expect(requests()).toEqual([
      ["git.status", { cwd: CWD }],
      ["git.listBranches", { cwd: CWD }],
      ["git.readWorkingTreeDiff", { cwd: CWD, scope: "staged" }],
      ["git.workingTreeDiffStats", { cwd: CWD, scope: "workingTree" }],
      ["projects.listDirectories", { cwd: CWD, includeFiles: true, relativePath: "src" }],
      ["projects.searchEntries", { cwd: CWD, query: "app", limit: 80, kind: "file" }],
      ["projects.readFile", { cwd: CWD, relativePath: "src/app.ts" }],
    ]);
  });

  it("refreshes provider statuses into upstream's config query", async () => {
    const config = await refreshServerProviderStatuses(queryClient);

    expect(config.providers).toEqual([{ provider: "codex" }]);
    expect(requests().map(([tag]) => tag)).toEqual(["server.refreshProviders", "server.getConfig"]);
  });

  it("asks the host, not the server, for syntax highlighting", async () => {
    await highlightExplorerCode({ code: "const a = 1;", path: "a.ts" });

    expect(requests()).toEqual([
      ["host.syntaxHighlightCode", { code: "const a = 1;", path: "a.ts" }],
    ]);
  });

  it("refuses an empty stage or unstage instead of sending it", async () => {
    await expect(run(gitStageFilesMutationOptions({ cwd: CWD, queryClient }), [])).rejects.toThrow(
      "No files selected to stage.",
    );
    await expect(
      run(gitUnstageFilesMutationOptions({ cwd: CWD, queryClient }), []),
    ).rejects.toThrow("No files selected to unstage.");
    expect(requests()).toEqual([]);
  });
});

describe("Environment / Git / Explorer sources and the legacy client", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const GROUP = [
    "./EnvironmentPanel.lynx.tsx",
    "./environmentBootstrap.lynx.ts",
    "./DiffDock.lynx.tsx",
    "./GitDockPane.lynx.tsx",
    "./threadDock.lynx.tsx",
    "./BrowserDockPane.lynx.tsx",
    "./ExplorerPdfFallback.lynx.tsx",
    "./ExplorerPreviewHeader.lynx.tsx",
    "./threadHandoff.lynx.ts",
    "./ProviderUpdatePrompt.lynx.tsx",
    "../components/markdown/ChatMarkdown.lynx.tsx",
    "../data/hostSyntaxHighlight.lynx.ts",
  ];

  it("no file of the group imports synaraClient or keeps a Lynx-only git cache key", () => {
    for (const path of GROUP) {
      const source = read(path);
      expect(source, path).not.toMatch(/data\/synaraClient|\.\/synaraClient/);
      for (const legacyKey of [
        '"environment-local-servers"',
        '"environment-git-branches"',
        '"environment-git-action-branches"',
        '"environment-github-repository"',
        '"thread-header-git-state"',
        '"git-dock-diff"',
        '"working-tree-diff"',
        '"diff-dock-git-status"',
        '"browser-local-servers"',
      ]) {
        expect(source, `${path} ${legacyKey}`).not.toContain(legacyKey);
      }
    }
  });

  it("keeps the explorer readers off the legacy client and off a second cache", () => {
    const queries = read("./queries.ts");
    for (const removed of [
      "fetchExplorerEntries",
      "fetchExplorerDirectory",
      "fetchExplorerFile(",
      "explorerEntriesCache",
    ]) {
      expect(queries, removed).not.toContain(removed);
    }
    const explorer = read("./explorerQueries.lynx.ts");
    expect(explorer).not.toContain("synaraClient");
    expect(explorer).not.toContain("fetchQuery");
    const router = read("./router.tsx");
    for (const legacyKey of ['"explorer-entries"', '"explorer-file"', '"explorer-directories"']) {
      expect(router, legacyKey).not.toContain(legacyKey);
    }
  });

  it("the legacy client is gone: one request path, the shared facade", () => {
    expect(existsSync(new URL("../data/synaraClient.lynx.ts", import.meta.url))).toBe(false);
  });
});
