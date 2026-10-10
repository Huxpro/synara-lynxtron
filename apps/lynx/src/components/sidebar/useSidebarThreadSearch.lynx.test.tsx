// The palette's message search is upstream's server search (`searchThreads`
// through the facade), merged by upstream's `matchSidebarSearchThreads`.

import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { act, render } from "@lynx-js/react/testing-library";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import type { NativeApi } from "@synara/contracts";
import {
  matchSidebarSearchThreads,
  type SidebarSearchServerThreadMatch,
  type SidebarSearchThread,
} from "@synara-web/components/SidebarSearchPalette.logic";
import { useStore } from "@synara-web/store";
import { syncServerShellSnapshot, syncServerThreadDetail } from "@synara-web/storeProjection";
import { initialState } from "@synara-web/storeState";
import { makeReadModelThread, makeShellSnapshot } from "@synara-web/storeTestFixtures";

import { installFakeNativeHost } from "../../adapters/fakeNativeHost.testUtils";
import { setNativeApiForTest } from "../../adapters/nativeApi.lynx";
import {
  THREAD_SEARCH_DEBOUNCE_MS,
  useSidebarSearchThreadsWithLoadedMessages,
  useSidebarThreadSearch,
} from "./useSidebarThreadSearch.lynx";

rs.hoisted(() => {
  (globalThis as { NativeModules?: unknown }).NativeModules = {
    bridge: {
      call: (_name: string, _params: unknown, callback: (reply: string) => void) =>
        queueMicrotask(() => callback("{}")),
    },
  };
});

const row = (id: string, title: string): SidebarSearchThread => ({
  id,
  title,
  projectId: "project-1",
  projectName: "Project",
  projectRemoteName: "Project",
  spaceName: "Global",
  provider: "codex",
  createdAt: "2026-02-27T00:00:00.000Z",
  updatedAt: "2026-02-27T00:00:00.000Z",
  messages: [],
});

describe("search palette message search", () => {
  let searches: string[];
  let respond: (query: string) => Promise<unknown>;
  let matches: ReadonlyMap<string, SidebarSearchServerThreadMatch> | undefined;
  let unmount: (() => void) | null = null;
  let setProps: (next: { query: string; enabled: boolean }) => void = () => undefined;

  function Probe(props: { readonly query: string; readonly enabled: boolean }) {
    matches = useSidebarThreadSearch(props);
    return null;
  }

  function mount(initial: { query: string; enabled: boolean }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (props: { query: string; enabled: boolean }) => (
      <QueryClientContext.Provider value={client}>
        <Probe {...props} />
      </QueryClientContext.Provider>
    );
    const view = render(tree(initial));
    unmount = view.unmount;
    setProps = (next) => view.rerender(tree(next));
  }

  async function elapse(milliseconds: number) {
    await act(async () => {
      await rs.advanceTimersByTimeAsync(milliseconds);
    });
  }

  beforeEach(() => {
    rs.useFakeTimers();
    installFakeNativeHost();
    searches = [];
    respond = async (query) => ({
      matches: [{ threadId: "thread-b", excerpt: `…the ${query} was rewritten…`, matchCount: 3 }],
    });
    setNativeApiForTest({
      orchestration: {
        searchThreads: (input: { query: string; limit: number }) => {
          searches.push(`${input.query}:${input.limit}`);
          return respond(input.query);
        },
      },
    } as unknown as NativeApi);
  });

  afterEach(() => {
    unmount?.();
    unmount = null;
    setNativeApiForTest(undefined);
    rs.useRealTimers();
  });

  it("asks the server once per settled query and merges hits with upstream's ranking", async () => {
    mount({ query: "", enabled: true });
    expect(matches).toBeUndefined();
    act(() => setProps({ query: "p", enabled: true }));
    act(() => setProps({ query: "pa", enabled: true }));
    act(() => setProps({ query: "parser", enabled: true }));
    // Nothing leaves before the debounce; one request after it, for the final query.
    await elapse(THREAD_SEARCH_DEBOUNCE_MS - 1);
    expect(searches).toEqual([]);
    await elapse(1);
    await elapse(0);
    expect(searches).toEqual(["parser:50"]);
    expect(matches?.get("thread-b")).toEqual({
      excerpt: "…the parser was rewritten…",
      matchCount: 3,
    });

    // Upstream's ranking decides the order; the server hit shows as a message
    // match with the server's excerpt and count, next to the title match.
    const ranked = matchSidebarSearchThreads(
      [row("thread-a", "Parser cleanup"), row("thread-b", "Unrelated"), row("thread-c", "Other")],
      "parser",
      undefined,
      matches,
    );
    const byId = new Map(ranked.map((match) => [match.thread.id, match]));
    expect([...byId.keys()].toSorted()).toEqual(["thread-a", "thread-b"]);
    expect(byId.get("thread-a")).toMatchObject({ matchKind: "title" });
    expect(byId.get("thread-b")).toMatchObject({ matchKind: "message", messageMatchCount: 3 });
    expect(byId.get("thread-b")?.snippet).toContain("parser");

    // Typing the same query again inside the stale time reuses the result.
    act(() => setProps({ query: "parse", enabled: true }));
    await elapse(THREAD_SEARCH_DEBOUNCE_MS);
    await elapse(0);
    act(() => setProps({ query: "parser", enabled: true }));
    await elapse(THREAD_SEARCH_DEBOUNCE_MS);
    await elapse(0);
    expect(searches).toEqual(["parser:50", "parse:50"]);
  });

  it("does not ask below the minimum length, while closed, or for a path", async () => {
    mount({ query: "p", enabled: true });
    await elapse(THREAD_SEARCH_DEBOUNCE_MS * 2);
    expect(matches).toBeUndefined();
    act(() => setProps({ query: "parser", enabled: false }));
    await elapse(THREAD_SEARCH_DEBOUNCE_MS * 2);
    expect(searches).toEqual([]);
    // No server answer: title and loaded-message matching still work.
    expect(matches?.size).toBe(0);
  });

  it("keeps the palette usable when the server cannot be reached", async () => {
    respond = async () => {
      throw new Error("Synara is offline.");
    };
    mount({ query: "parser", enabled: true });
    await elapse(THREAD_SEARCH_DEBOUNCE_MS);
    await elapse(0);
    expect(searches).toEqual(["parser:50"]);
    expect(matches?.size).toBe(0);
    expect(
      matchSidebarSearchThreads([row("thread-a", "Parser cleanup")], "parser", undefined, matches),
    ).toHaveLength(1);
  });

  it("drops hits of a previous query that the current one no longer matches", async () => {
    mount({ query: "parser", enabled: true });
    await elapse(THREAD_SEARCH_DEBOUNCE_MS);
    await elapse(0);
    expect(matches?.size).toBe(1);
    // Before the next request settles the previous result is the placeholder;
    // its excerpt does not contain the new query, so it is not shown.
    act(() => setProps({ query: "parser zebra", enabled: true }));
    expect(matches?.size).toBe(0);
  });

  it("adds the message bodies the store holds only while the palette is open", () => {
    const THREAD = "thread-1" as never;
    let state = syncServerShellSnapshot(
      initialState,
      makeShellSnapshot(
        (() => {
          const { messages: _m, activities: _a, ...shell } = makeReadModelThread({ id: THREAD });
          return shell as never;
        })(),
      ),
    );
    state = syncServerThreadDetail(
      state,
      makeReadModelThread({
        id: THREAD,
        messages: [
          {
            id: "message-1",
            role: "assistant",
            text: "streamed zebra text",
            turnId: null,
            streaming: true,
            createdAt: "2026-02-27T00:02:00.000Z",
            updatedAt: "2026-02-27T00:02:00.000Z",
          },
        ] as never,
      }),
    );
    useStore.setState(state);
    const rows = [row("thread-1", "One"), row("thread-2", "Two")];
    let result: readonly SidebarSearchThread[] = [];
    function Threads(props: { readonly open: boolean }) {
      result = useSidebarSearchThreadsWithLoadedMessages(rows, props.open);
      return null;
    }
    const view = render(<Threads open={false} />);
    unmount = view.unmount;
    expect(result).toBe(rows);
    view.rerender(<Threads open />);
    expect(result[0]?.messages).toEqual([{ text: "streamed zebra text" }]);
    expect(result[1]).toBe(rows[1]);
    expect(matchSidebarSearchThreads(result, "zebra")[0]?.matchKind).toBe("message");
  });
});
