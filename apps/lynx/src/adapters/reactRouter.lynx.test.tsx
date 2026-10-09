import { afterEach, describe, expect, it } from "@rstest/core";
import { act, render } from "@lynx-js/react/testing-library";
import { createMemoryHistory } from "@tanstack/history";
import { ThreadId } from "@synara/contracts";
import { useCommittedPathname } from "@synara-web/hooks/useCommittedPathname";
import { useDiffRouteSearch } from "@synara-web/hooks/useDiffRouteSearch";

import {
  bindLynxRouterHistory,
  resolveLynxNavigationPath,
  useNavigate,
  useParams,
  useRouter,
  useRouterState,
} from "./reactRouter.lynx";

interface Observed {
  pathname: string;
  routeThreadId: ThreadId | null;
  splitViewId: string | null;
  navigate: ReturnType<typeof useNavigate>;
  renders: number;
}

const observed: Observed[] = [];

// The exact call shapes of the generated `EventRouter`.
function Probe() {
  const navigate = useNavigate();
  const pathname = useCommittedPathname();
  const routeThreadId = useParams({
    strict: false,
    select: (params) => (params.threadId ? ThreadId.makeUnsafe(params.threadId) : null),
  });
  const routeSearch = useDiffRouteSearch();
  observed.push({
    pathname,
    routeThreadId,
    splitViewId: routeSearch.splitViewId ?? null,
    navigate,
    renders: observed.length + 1,
  });
  return null;
}

function latest(): Observed {
  return observed.at(-1)!;
}

describe("Lynx router hook adapter", () => {
  let unbind: (() => void) | null = null;

  afterEach(() => {
    unbind?.();
    unbind = null;
    observed.length = 0;
  });

  it("reports the root location until a history is bound", () => {
    render(<Probe />);
    expect(latest()).toMatchObject({ pathname: "/", routeThreadId: null, splitViewId: null });
  });

  it("follows the memory history: thread param, pathname and search", () => {
    const history = createMemoryHistory({ initialEntries: ["/thread/thread-1"] });
    unbind = bindLynxRouterHistory(history);
    render(<Probe />);
    expect(latest()).toMatchObject({
      pathname: "/thread/thread-1",
      routeThreadId: "thread-1",
      splitViewId: null,
    });

    act(() => history.push("/settings/general"));
    expect(latest()).toMatchObject({ pathname: "/settings/general", routeThreadId: null });

    act(() => history.push("/thread/thread-2?splitViewId=split%201&diff=1"));
    expect(latest()).toMatchObject({
      pathname: "/thread/thread-2",
      routeThreadId: "thread-2",
      splitViewId: "split 1",
    });
  });

  it("keeps navigate stable and does not re-render for an unchanged location", () => {
    const history = createMemoryHistory({ initialEntries: ["/"] });
    unbind = bindLynxRouterHistory(history);
    render(<Probe />);
    const first = latest();

    act(() => history.replace("/"));
    expect(latest().renders).toBe(first.renders);

    act(() => history.push("/thread/thread-1"));
    expect(latest().navigate).toBe(first.navigate);
  });

  it("serves upstream's committed-pathname hook: one router identity, never loading", () => {
    const seen: Array<{ router: object; isLoading: boolean }> = [];
    function RouterProbe() {
      const router = useRouter();
      const isLoading = useRouterState({ select: (state) => state.isLoading });
      seen.push({ router, isLoading });
      return null;
    }
    const history = createMemoryHistory({ initialEntries: ["/"] });
    unbind = bindLynxRouterHistory(history);
    render(<RouterProbe />);
    render(<Probe />);
    act(() => history.push("/thread/thread-1"));

    expect(latest()).toMatchObject({ pathname: "/thread/thread-1", routeThreadId: "thread-1" });
    expect(new Set(seen.map((entry) => entry.router)).size).toBe(1);
    expect(seen.every((entry) => entry.isLoading === false)).toBe(true);
  });

  it("maps upstream's bootstrap navigation onto the Lynx thread route", async () => {
    const history = createMemoryHistory({ initialEntries: ["/"] });
    unbind = bindLynxRouterHistory(history);
    render(<Probe />);

    await act(async () => {
      await latest().navigate({
        to: "/$threadId",
        params: { threadId: "thread-9" },
        replace: true,
      });
    });

    expect(history.location.href).toBe("/thread/thread-9");
    expect(history.length).toBe(1);
    expect(latest().routeThreadId).toBe("thread-9");
  });

  it("pushes by default, fills named params, and rejects a missing one", async () => {
    const history = createMemoryHistory({ initialEntries: ["/"] });
    unbind = bindLynxRouterHistory(history);
    render(<Probe />);

    await act(async () => {
      await latest().navigate({ to: "/kanban/$projectId", params: { projectId: "project-1" } });
    });
    expect(history.location.href).toBe("/kanban/project-1");
    expect(history.length).toBe(2);

    expect(resolveLynxNavigationPath({ to: "/settings/general" })).toBe("/settings/general");
    await expect(latest().navigate({ to: "/$threadId" })).rejects.toThrow(
      'Missing route param "threadId"',
    );
  });

  it("returns to the root location and ignores navigation once unbound", async () => {
    const history = createMemoryHistory({ initialEntries: ["/thread/thread-1"] });
    const disconnect = bindLynxRouterHistory(history);
    render(<Probe />);
    expect(latest().routeThreadId).toBe("thread-1");

    act(() => disconnect());
    expect(latest()).toMatchObject({ pathname: "/", routeThreadId: null });

    await latest().navigate({ to: "/$threadId", params: { threadId: "thread-2" } });
    expect(history.location.href).toBe("/thread/thread-1");
  });
});
