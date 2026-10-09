// The Explorer's observers on upstream's project queries, mounted: a project
// invalidation (what session sync issues) refreshes the file on screen, and a
// preview grant the server no longer knows is replaced once, never in a loop.

import { afterEach, beforeEach, describe, expect, it } from "@rstest/core";
import { act, render } from "@lynx-js/react/testing-library";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import type { NativeApi } from "@synara/contracts";
import { projectQueryKeys } from "@synara-web/lib/projectReactQuery";

import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import { useExplorerEntries, useExplorerFile } from "./explorerQueries.lynx";

const CWD = "/repo";
const OUTSIDE = "/Users/someone/notes.md";

interface Seen {
  file: ReturnType<typeof useExplorerFile> | null;
  entries: ReturnType<typeof useExplorerEntries> | null;
}

function Probe(props: { readonly path: string | null; readonly seen: Seen }) {
  props.seen.file = useExplorerFile({
    workspaceRoot: CWD,
    relativePath: props.path,
    enabled: props.path !== null,
  });
  props.seen.entries = useExplorerEntries({ workspaceRoot: CWD, query: "" });
  return <view />;
}

async function settle(): Promise<void> {
  for (let round = 0; round < 6; round += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
}

describe("Explorer observers on upstream project queries", () => {
  let queryClient: QueryClient;
  let seen: Seen;
  let unmount: (() => void) | null;
  let contents: string;
  let listings: number;
  let reads: { readonly relativePath: string; readonly previewGrant?: string }[];
  let grantsMinted: number;
  /** Tokens the "server" currently accepts; a restart empties it. */
  let validGrants: Set<string>;
  let rejectEveryGrant: boolean;

  const mount = (path: string | null) => {
    const view = render(
      <QueryClientContext.Provider value={queryClient}>
        <Probe path={path} seen={seen} />
      </QueryClientContext.Provider>,
    );
    unmount = view.unmount;
  };

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seen = { file: null, entries: null };
    unmount = null;
    contents = "first";
    listings = 0;
    reads = [];
    grantsMinted = 0;
    validGrants = new Set();
    rejectEveryGrant = false;
    setNativeApiForTest({
      projects: {
        listDirectories: async () => {
          listings += 1;
          return {
            entries: [{ name: `entry-${listings}`, path: `entry-${listings}`, kind: "file" }],
          };
        },
        searchEntries: async () => ({ entries: [], truncated: false }),
        createLocalFilePreviewGrant: async () => {
          grantsMinted += 1;
          const grant = `grant-${grantsMinted}`;
          if (!rejectEveryGrant) validGrants.add(grant);
          return { grant, expiresAt: new Date(Date.now() + 120_000).toISOString() };
        },
        readFile: async (input: { relativePath: string; previewGrant?: string }) => {
          reads.push({
            relativePath: input.relativePath,
            ...(input.previewGrant ? { previewGrant: input.previewGrant } : {}),
          });
          if (input.relativePath === OUTSIDE && !validGrants.has(input.previewGrant ?? "")) {
            throw new Error("Local file preview grant is invalid or expired.");
          }
          return { relativePath: input.relativePath, contents };
        },
      },
    } as unknown as NativeApi);
  });

  afterEach(() => {
    unmount?.();
    queryClient.clear();
    setNativeApiForTest(undefined);
  });

  it("shows fresh contents after a project invalidation, under upstream's keys", async () => {
    mount("src/app.ts");
    await settle();
    expect(seen.file?.file?.contents).toBe("first");
    expect(seen.entries?.entries.map((entry) => entry.path)).toEqual(["entry-1"]);
    expect(queryClient.getQueryData(projectQueryKeys.readFile(CWD, "src/app.ts"))).toMatchObject({
      contents: "first",
    });

    // What EventRouter does when a tool edits files in this workspace.
    contents = "second";
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    });
    await settle();
    expect(seen.file?.file?.contents).toBe("second");
    expect(seen.entries?.entries.map((entry) => entry.path)).toEqual(["entry-2"]);
    expect(reads).toHaveLength(2);
  });

  it("replaces a grant the server forgot, once, and reads again", async () => {
    mount(OUTSIDE);
    await settle();
    expect(seen.file?.file?.contents).toBe("first");
    expect(reads).toEqual([{ relativePath: OUTSIDE, previewGrant: "grant-1" }]);

    // Server restart: every issued token is gone, the cached grant is still "fresh".
    validGrants.clear();
    contents = "after restart";
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: projectQueryKeys.readFile(CWD, OUTSIDE),
        exact: true,
      });
    });
    await settle();

    expect(reads).toEqual([
      { relativePath: OUTSIDE, previewGrant: "grant-1" },
      { relativePath: OUTSIDE, previewGrant: "grant-1" }, // rejected
      { relativePath: OUTSIDE, previewGrant: "grant-2" }, // one retry with a fresh grant
    ]);
    expect(grantsMinted).toBe(2);
    expect(seen.file?.isError).toBe(false);
    expect(seen.file?.file?.contents).toBe("after restart");
  });

  it("does not loop when fresh grants keep being rejected; Retry tries once more", async () => {
    rejectEveryGrant = true;
    mount(OUTSIDE);
    await settle();
    await settle();
    // First grant rejected, one automatic retry with a second grant, then stop.
    expect(reads.map((read) => read.previewGrant)).toEqual(["grant-1", "grant-2"]);
    expect(grantsMinted).toBe(2);
    expect(seen.file?.isError).toBe(true);

    await settle();
    expect(reads).toHaveLength(2);

    // The user's Retry gets the same bounded sequence again, and can succeed.
    rejectEveryGrant = false;
    await act(async () => {
      seen.file?.retry();
    });
    for (let round = 0; round < 6; round += 1) await settle();
    expect(reads.map((read) => read.previewGrant)).toEqual([
      "grant-1",
      "grant-2",
      "grant-3", // Retry: one read, with a fresh grant
    ]);
    expect(seen.file?.isError).toBe(false);
    expect(reads.at(-1)?.previewGrant).toBe(`grant-${grantsMinted}`);
  });
});
