// `~/nativeApi` (alias) and upstream's relative `../nativeApi` imports must be
// one module, and one facade must mean one transport handshake with the host.

import { afterEach, describe, expect, it } from "@rstest/core";
import { QueryClient } from "@tanstack/react-query";
import type { NativeApi } from "@synara/contracts";
import { gitStatusQueryOptions } from "@synara-web/lib/gitReactQuery";
import { checkpointDiffQueryOptions } from "@synara-web/lib/providerReactQuery";
import { serverConfigQueryOptions } from "@synara-web/lib/serverReactQuery";
import { projectListDirectoriesQueryOptions } from "@synara-web/lib/projectReactQuery";
import { resetWsNativeApiForTest } from "@synara-web/wsNativeApi";
import { ensureNativeApi as ensureViaAlias } from "~/nativeApi";

import { installFakeNativeHost } from "./fakeNativeHost.testUtils";
import { ensureNativeApi, setNativeApiForTest } from "./nativeApi.lynx";

describe("Lynx NativeApi module identity", () => {
  afterEach(async () => {
    await resetWsNativeApiForTest();
    setNativeApiForTest(undefined);
  });

  it("serves alias and relative importers from one module instance", async () => {
    const seen: string[] = [];
    const double = {
      git: { status: async () => (seen.push("git.status"), { branch: "main", pr: null }) },
      server: { getConfig: async () => (seen.push("server.getConfig"), { providers: [] }) },
      projects: { listDirectories: async () => (seen.push("projects.list"), { entries: [] }) },
      orchestration: { getTurnDiff: async () => (seen.push("getTurnDiff"), { diff: "" }) },
    } as unknown as NativeApi;
    setNativeApiForTest(double);
    expect(ensureViaAlias()).toBe(double);
    expect(ensureNativeApi()).toBe(double);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // `serverReactQuery` and `projectReactQuery` import `~/nativeApi`;
    // `gitReactQuery` and `providerReactQuery` import `../nativeApi`.
    await queryClient.fetchQuery(serverConfigQueryOptions());
    await queryClient.fetchQuery(projectListDirectoriesQueryOptions({ cwd: "/repo" }));
    await queryClient.fetchQuery({ ...gitStatusQueryOptions("/repo"), retry: false });
    await queryClient.fetchQuery({
      ...checkpointDiffQueryOptions({
        threadId: "thread-1" as never,
        fromTurnCount: 1,
        toTurnCount: 2,
        ignoreWhitespace: true,
      }),
      retry: false,
    });
    expect(seen).toEqual(["server.getConfig", "projects.list", "git.status", "getTurnDiff"]);
    expect(
      (globalThis as { __synaraLynxNativeApiModules?: number }).__synaraLynxNativeApiModules,
    ).toBe(1);
  });

  it("performs one stream-reset handshake for requests from both import paths", async () => {
    const host = installFakeNativeHost({ rpc: (tag) => ({ tag, providers: [], entries: [] }) });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await queryClient.fetchQuery(serverConfigQueryOptions());
    await queryClient.fetchQuery({ ...gitStatusQueryOptions("/repo"), retry: false });
    await ensureNativeApi().git.listBranches({ cwd: "/repo" });

    expect(host.callsNamed("synaraRpcStreamReset")).toHaveLength(1);
    expect(host.callsNamed("synaraRpc").map((call) => call.params.tag)).toEqual([
      "server.getConfig",
      "git.status",
      "git.listBranches",
    ]);
  });
});
