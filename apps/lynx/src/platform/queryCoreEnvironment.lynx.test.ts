// query-core must run as a client on the Lynx background thread. Without a
// `window` it decides it is on a server and never starts refetch intervals:
// the status, pull-request and usage refreshes the app relies on would be dead.

import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { QueryClient, QueryObserver, focusManager, isServer } from "@tanstack/react-query";
import type { NativeApi } from "@synara/contracts";
import {
  gitPullRequestSnapshotQueryOptions,
  gitStatusQueryOptions,
} from "@synara-web/lib/gitReactQuery";

import {
  QUERY_CORE_MODULE_PATTERN,
  QUERY_CORE_SERVER_PROBE,
  provideQueryCoreEnvironment,
} from "../../scripts/query-core-environment-loader.mjs";
import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import { dispatchQueryCoreWindowEvent, queryCoreWindow } from "./queryCoreEnvironment.lynx";

const require = createRequire(import.meta.url);
const reactQueryEntry = require.resolve("@tanstack/react-query");
const queryCoreDir = path.dirname(
  createRequire(reactQueryEntry).resolve("@tanstack/query-core/package.json"),
);
const modernDir = path.join(queryCoreDir, "build/modern");

describe("query-core environment on Lynx", () => {
  let statusReads = 0;
  let snapshotReads = 0;
  let queryClient: QueryClient;

  beforeEach(() => {
    rs.useFakeTimers();
    statusReads = 0;
    snapshotReads = 0;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.mount();
    // The relative `../nativeApi` import of upstream's git module is not
    // reachable from `setNativeApiForTest` in tests, so the double is installed
    // where that module reads it too.
    const api = {
      git: {
        status: async () => {
          statusReads += 1;
          return { branch: `read-${statusReads}`, pr: null };
        },
        pullRequestSnapshot: async () => {
          snapshotReads += 1;
          return { pullRequest: { state: snapshotReads < 3 ? "open" : "merged" } };
        },
      },
    } as unknown as NativeApi;
    setNativeApiForTest(api);
  });

  afterEach(() => {
    queryClient.unmount();
    queryClient.clear();
    setNativeApiForTest(undefined);
    rs.useRealTimers();
  });

  it("is a client: the bundle's query-core does not run in server mode", () => {
    expect(isServer).toBe(false);
    expect(queryCoreWindow).toBeDefined();
  });

  it("refetches git status on upstream's interval with no event from the server", async () => {
    const observer = new QueryObserver(queryClient, gitStatusQueryOptions("/repo"));
    const stop = observer.subscribe(() => undefined);
    await rs.advanceTimersByTimeAsync(0);
    expect(statusReads).toBe(1);

    // Nothing invalidates: a branch switched in a terminal is only seen by the interval.
    await rs.advanceTimersByTimeAsync(299_000);
    expect(statusReads).toBe(1);
    await rs.advanceTimersByTimeAsync(2_000);
    expect(statusReads).toBe(2);
    expect(observer.getCurrentResult().data).toMatchObject({ branch: "read-2" });
    await rs.advanceTimersByTimeAsync(300_000);
    expect(statusReads).toBe(3);

    stop();
    await rs.advanceTimersByTimeAsync(900_000);
    expect(statusReads).toBe(3);
  });

  it("polls an open pull request every minute and stops once it is merged", async () => {
    const observer = new QueryObserver(
      queryClient,
      gitPullRequestSnapshotQueryOptions({ cwd: "/repo", reference: "https://example.test/pr/1" }),
    );
    const stop = observer.subscribe(() => undefined);
    await rs.advanceTimersByTimeAsync(0);
    expect(snapshotReads).toBe(1);
    await rs.advanceTimersByTimeAsync(60_000);
    expect(snapshotReads).toBe(2);
    // Merged on GitHub, no Synara event: the third read sees it and polling ends.
    await rs.advanceTimersByTimeAsync(60_000);
    expect(snapshotReads).toBe(3);
    await rs.advanceTimersByTimeAsync(600_000);
    expect(snapshotReads).toBe(3);
    stop();
  });

  it("refetches stale focused queries when the host reports the window visible again", async () => {
    const observer = new QueryObserver(queryClient, gitStatusQueryOptions("/repo"));
    const stop = observer.subscribe(() => undefined);
    await rs.advanceTimersByTimeAsync(0);
    await rs.advanceTimersByTimeAsync(31_000); // past the 30 s stale time
    expect(statusReads).toBe(1);

    dispatchQueryCoreWindowEvent("visibilitychange");
    await rs.advanceTimersByTimeAsync(0);
    expect(focusManager.isFocused()).toBe(true);
    expect(statusReads).toBe(2);
    stop();
  });
});

describe("query-core environment loader", () => {
  const sourceOf = (file: string) => readFileSync(path.join(modernDir, file), "utf8");
  const environmentModule = "/abs/queryCoreEnvironment.lynx.ts";

  it("covers every module of the pinned query-core that mentions `window`", () => {
    const withWindow = readdirSync(modernDir)
      .filter((file) => file.endsWith(".js"))
      .filter((file) => /\bwindow\b/.test(sourceOf(file)))
      .sort();
    expect(withWindow).toEqual(["focusManager.js", "onlineManager.js", "utils.js"]);
    for (const file of withWindow) {
      const resourcePath = path.join(modernDir, file);
      expect(QUERY_CORE_MODULE_PATTERN.test(resourcePath)).toBe(true);
      expect(provideQueryCoreEnvironment(sourceOf(file), resourcePath, environmentModule)).toMatch(
        /^import \{ queryCoreWindow as window \} from "\/abs\/queryCoreEnvironment\.lynx\.ts";\n/,
      );
    }
    // Stock query-core is a server wherever `window` is missing.
    expect(sourceOf("utils.js")).toContain(`var isServer = ${QUERY_CORE_SERVER_PROBE}`);
    // The observer guard this rule exists for.
    expect(sourceOf("queryObserver.js")).toMatch(/if \(isServer \|\| resolveEnabled\(/);
  });

  it("leaves other modules alone and refuses a query-core it does not recognize", () => {
    const untouched = sourceOf("queryCache.js");
    expect(
      provideQueryCoreEnvironment(
        untouched,
        path.join(modernDir, "queryCache.js"),
        environmentModule,
      ),
    ).toBe(untouched);
    expect(() =>
      provideQueryCoreEnvironment(
        "var isServer = detect();",
        path.join(modernDir, "utils.js"),
        environmentModule,
      ),
    ).toThrow(/no longer contains/);
  });

  it("keeps the main thread in server mode", () => {
    const environmentSource = readFileSync(
      new URL("./queryCoreEnvironment.lynx.ts", import.meta.url),
      "utf8",
    );
    expect(environmentSource).toMatch(
      /export const queryCoreWindow: QueryCoreWindow \| undefined = isMainThread\s*\? undefined\s*: backgroundWindow;/,
    );
  });
});
