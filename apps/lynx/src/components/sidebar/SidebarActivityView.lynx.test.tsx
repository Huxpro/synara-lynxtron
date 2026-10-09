import { fireEvent, render } from "@lynx-js/react/testing-library";
import { describe, expect, it, rs } from "@rstest/core";

import { ThreadId, type ProjectId } from "@synara/contracts";
import type { SidebarThreadSummary } from "@synara-web/types";

import { SidebarActivityView, type ActivityProject } from "./SidebarActivityView.lynx";

// Web compositions resolve the JSX runtime from apps/web, which rstest cannot load; the
// status glyph is covered by its own adapter tests.
rs.mock("@synara-web/components/SidebarThreadTrailingCluster", () => ({
  SidebarThreadTrailingCluster: () => null,
}));
// The row shell's `data-thread-id` is not a valid dataset key in the test DOM; its own
// behavior is covered by the classic sidebar tests.
rs.mock("./SidebarNavigationRow.lynx", () => ({
  SidebarNavigationRow: (props: {
    readonly className: string;
    readonly children?: unknown;
    readonly actions?: unknown;
    readonly onActivate: () => void;
  }) => (
    <view className={props.className} bindtap={props.onActivate}>
      {props.children as never}
      <view className="AppSidebarRowHoverActions">{props.actions as never}</view>
    </view>
  ),
  SidebarHoverAction: (props: {
    readonly label: string;
    readonly children?: unknown;
    readonly onActivate: () => void;
  }) => (
    <view
      className="AppSidebarHoverAction"
      accessibility-label={props.label}
      catchtap={props.onActivate}
    >
      {props.children as never}
    </view>
  ),
}));

const PROJECT: ActivityProject = {
  id: "project-1",
  kind: "project",
  title: "synara-fixture-app",
  workspaceRoot: "/tmp/synara-fixture-app",
};

function thread(overrides: Partial<SidebarThreadSummary> & { id: string }): SidebarThreadSummary {
  const now = new Date().toISOString();
  return {
    projectId: PROJECT.id as ProjectId,
    title: overrides.id,
    modelSelection: { provider: "codex", model: "gpt-5" },
    interactionMode: "default",
    branch: "main",
    worktreePath: null,
    session: null,
    createdAt: now,
    latestHumanMessageAt: now,
    latestTurn: {
      turnId: `turn-${overrides.id}`,
      state: "completed",
      requestedAt: now,
      startedAt: now,
      completedAt: now,
      assistantMessageId: null,
    },
    latestUserMessageAt: now,
    hasPendingApprovals: false,
    hasPendingUserInput: false,
    hasActionableProposedPlan: false,
    hasLiveTailWork: false,
    ...overrides,
    id: overrides.id as ThreadId,
  } as SidebarThreadSummary;
}

function renderActivity(threads: readonly SidebarThreadSummary[]) {
  const handlers = {
    onOpenThread: rs.fn(),
    onSetThreadSettled: rs.fn(),
    onToggleThreadPinned: rs.fn(),
    onArchiveThread: rs.fn(),
    onMarkThreadRead: rs.fn(),
    onThreadContextMenu: rs.fn(),
    onCreateChat: rs.fn(),
    onAddProject: rs.fn(),
  };
  render(
    <SidebarActivityView
      threads={threads}
      projects={[PROJECT]}
      activeThreadId={null}
      pinnedThreadIdSet={new Set()}
      settledOverrideByThreadId={new Map()}
      threadsHydrated
      resolveThreadStatus={() => null}
      renderThreadHoverCard={() => null}
      {...handlers}
    />,
  );
  return handlers;
}

function texts(selector: string): string[] {
  return Array.from(elementTree.root?.querySelectorAll(selector) ?? []).map(
    (node) => node.textContent ?? "",
  );
}

describe("Lynx sidebar Activity view", () => {
  it("lists recent work as two-line task rows under the scope header", () => {
    renderActivity([
      thread({ id: ThreadId.makeUnsafe("Fixture secondary") }),
      thread({ id: ThreadId.makeUnsafe("Fixture transcript") }),
    ]);

    expect(texts(".AppSidebarActivityScope")).toEqual(["All activity"]);
    expect(texts(".AppSidebarActivitySectionLabel")).toEqual(["Recent"]);
    expect(texts(".AppSidebarActivityRowTitle")).toHaveLength(2);
    expect(texts(".AppSidebarActivityRowProject")).toEqual([
      "synara-fixture-app",
      "synara-fixture-app",
    ]);
    expect(texts(".AppSidebarActivityRowBranchText")).toEqual(["main", "main"]);
  });

  it("files settled threads under a collapsed Done section", () => {
    const settledAt = new Date(Date.now() + 1_000).toISOString();
    renderActivity([
      thread({ id: ThreadId.makeUnsafe("open") }),
      thread({ id: ThreadId.makeUnsafe("finished"), settledAt }),
    ]);

    expect(texts(".AppSidebarActivityRowTitle")).toEqual(["open"]);
    expect(texts(".AppSidebarActivityDisclosure")).toEqual(["Done"]);
  });

  it("marks a row done and records it as read", () => {
    const handlers = renderActivity([thread({ id: ThreadId.makeUnsafe("open") })]);
    const done = Array.from(
      elementTree.root?.querySelectorAll(".AppSidebarHoverAction") ?? [],
    ).find((node) => node.getAttribute("accessibility-label") === "Done");
    if (!done) throw new Error("expected the Done hover action");

    fireEvent(done, new Event("catchEvent:tap", { bubbles: true }));

    expect(handlers.onSetThreadSettled).toHaveBeenCalledWith("open", true);
    expect(handlers.onMarkThreadRead).toHaveBeenCalledWith("open", expect.any(String));
    expect(handlers.onOpenThread).not.toHaveBeenCalled();
  });

  it("speaks for an empty feed", () => {
    renderActivity([]);
    expect(texts(".AppSidebarActivityEmptyText")).toEqual(["No activity yet"]);
  });
});
