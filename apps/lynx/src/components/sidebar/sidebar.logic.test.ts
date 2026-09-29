import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { SpaceId } from "@synara/contracts";

import { makeProjectSummary, makeThreadSummary } from "../../app/queriesTestFixtures";
import { deriveSidebarSections, resolveNativeSidebarSpaceId } from "./sidebar.logic";
import { pruneProjectThreadListPagingForCollapsedProjects } from "@synara-web/components/SidebarProjectPaging.logic";
import { resolveSettingsBackTarget } from "@synara-web/components/SidebarSettingsBack.logic";
import { resolvePullRequestReviewBadge } from "@synara-web/components/SidebarActionBadges.logic";
import { resolveSidebarPrimarySurface } from "@synara-web/components/SidebarSurface.logic";

describe("deriveSidebarProjectGroups", () => {
  it("uses the routed thread Space immediately and falls stale stored ids back to Void", () => {
    const projects = [
      makeProjectSummary({
        id: "project",
        kind: "project",
        title: "Project",
        workspaceRoot: "/work",
        spaceId: SpaceId.makeUnsafe("space-a"),
      }),
    ];
    const threads = [
      makeThreadSummary({
        id: "thread",
        title: "Thread",
        projectId: "project",
        project: "Project",
        messageCount: 1,
        updatedAt: "2026-01-01",
        live: false,
      }),
    ];
    const spaces = [{ id: SpaceId.makeUnsafe("space-a") }];

    expect(
      resolveNativeSidebarSpaceId({
        activeThreadId: "thread",
        projects,
        spaces,
        storedActiveSpaceId: null,
        threads,
      }),
    ).toBe("space-a");
    expect(
      resolveNativeSidebarSpaceId({
        activeThreadId: null,
        projects,
        spaces,
        storedActiveSpaceId: SpaceId.makeUnsafe("stale-space"),
        threads,
      }),
    ).toBeNull();
  });

  it("keeps project order and sorts rows newest first", () => {
    const { projectGroups: groups } = deriveSidebarSections({
      projects: [
        makeProjectSummary({ id: "p2", kind: "project", title: "Two", workspaceRoot: "/two" }),
        makeProjectSummary({ id: "p1", kind: "project", title: "One", workspaceRoot: "/one" }),
      ],
      threads: [
        makeThreadSummary({
          id: "old",
          title: "Old",
          projectId: "p2",
          project: "Two",
          messageCount: 1,
          updatedAt: "2026-01-01",
          live: false,
        }),
        makeThreadSummary({
          id: "new",
          title: "New",
          projectId: "p2",
          project: "Two",
          messageCount: 2,
          updatedAt: "2026-02-01",
          live: false,
        }),
      ],
    });

    expect(groups.map((group) => group.id)).toEqual(["p2", "p1"]);
    expect(groups[0].threads.map((thread) => thread.id)).toEqual(["new", "old"]);
  });

  it("applies persisted project and thread sort orders", () => {
    const sections = deriveSidebarSections({
      projects: [
        makeProjectSummary({
          id: "older-active",
          kind: "project",
          title: "Older active",
          workspaceRoot: "/older",
        }),
        makeProjectSummary({
          id: "newer-created",
          kind: "project",
          title: "Newer created",
          workspaceRoot: "/newer",
        }),
      ],
      threads: [
        makeThreadSummary({
          id: "older-created-recently-updated",
          title: "Updated",
          projectId: "older-active",
          project: "Older active",
          messageCount: 1,
          createdAt: "2026-01-01",
          updatedAt: "2026-04-01",
          live: false,
        }),
        makeThreadSummary({
          id: "newer-created",
          title: "Created",
          projectId: "newer-created",
          project: "Newer created",
          messageCount: 1,
          createdAt: "2026-03-01",
          updatedAt: "2026-03-01",
          live: false,
        }),
      ],
      projectSortOrder: "created_at",
      threadSortOrder: "created_at",
    });

    expect(sections.projectGroups.map((project) => project.id)).toEqual([
      "newer-created",
      "older-active",
    ]);
  });

  it("keeps threads whose project snapshot has not arrived", () => {
    const { projectGroups: groups } = deriveSidebarSections({
      projects: [],
      threads: [
        makeThreadSummary({
          id: "orphan",
          title: "Orphan",
          projectId: "missing",
          project: "Unknown project",
          messageCount: 0,
          updatedAt: "2026-01-01",
          live: false,
        }),
      ],
    });
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Other");
  });

  it("keeps hidden chat and studio containers out of Projects", () => {
    const sections = deriveSidebarSections({
      projects: [
        makeProjectSummary({
          id: "project",
          kind: "project",
          title: "Visible",
          workspaceRoot: "/work",
        }),
        makeProjectSummary({ id: "chat", kind: "chat", title: "Home", workspaceRoot: "/home" }),
        makeProjectSummary({
          id: "studio",
          kind: "studio",
          title: "Studio",
          workspaceRoot: "/studio",
        }),
      ],
      threads: [
        makeThreadSummary({
          id: "chat-thread",
          title: "Chat",
          projectId: "chat",
          project: "Home",
          messageCount: 1,
          updatedAt: "2026-03-01",
          live: false,
        }),
        makeThreadSummary({
          id: "studio-thread",
          title: "Studio chat",
          projectId: "studio",
          project: "Studio",
          messageCount: 1,
          updatedAt: "2026-02-01",
          live: false,
        }),
      ],
    });

    expect(sections.projectGroups.map((group) => group.id)).toEqual(["project"]);
    expect(sections.chatThreads.map((thread) => thread.id)).toEqual(["chat-thread"]);
    expect(sections.studioThreads.map((thread) => thread.id)).toEqual(["studio-thread"]);
  });

  it("projects server-pinned threads once and removes standalone pins from ordinary lists", () => {
    const sections = deriveSidebarSections({
      projects: [
        makeProjectSummary({
          id: "project",
          kind: "project",
          title: "Visible",
          workspaceRoot: "/work",
        }),
      ],
      threads: [
        makeThreadSummary({
          id: "pinned",
          title: "Pinned",
          projectId: "project",
          project: "Visible",
          messageCount: 1,
          updatedAt: "2026-03-01",
          live: false,
          isPinned: true,
        }),
        makeThreadSummary({
          id: "ordinary",
          title: "Ordinary",
          projectId: "project",
          project: "Visible",
          messageCount: 1,
          updatedAt: "2026-02-01",
          live: false,
        }),
      ],
    });

    expect(sections.pinnedThreads.map((thread) => thread.id)).toEqual(["pinned"]);
    expect(sections.projectGroups[0].threads.map((thread) => thread.id)).toEqual(["ordinary"]);
  });

  it("merges client-persisted pins with the server snapshot", () => {
    const sections = deriveSidebarSections({
      projects: [
        makeProjectSummary({
          id: "project",
          kind: "project",
          title: "Visible",
          workspaceRoot: "/work",
        }),
      ],
      threads: [
        makeThreadSummary({
          id: "persisted",
          title: "Persisted pin",
          projectId: "project",
          project: "Visible",
          messageCount: 1,
          updatedAt: "2026-03-01",
          live: false,
        }),
      ],
      persistedPinnedThreadIds: ["persisted"],
    });

    expect(sections.pinnedThreads.map((thread) => thread.id)).toEqual(["persisted"]);
    expect(sections.projectGroups[0].threads).toEqual([]);
  });

  it("orders persisted pinned projects before the ordinary manual order", () => {
    const sections = deriveSidebarSections({
      projects: [
        makeProjectSummary({ id: "one", kind: "project", title: "One", workspaceRoot: "/one" }),
        makeProjectSummary({ id: "two", kind: "project", title: "Two", workspaceRoot: "/two" }),
      ],
      threads: [],
      persistedPinnedProjectIds: ["two"],
    });

    expect(sections.projectGroups.map((project) => project.id)).toEqual(["two", "one"]);
  });

  it("filters ordinary projects and pinned threads to the active Space", () => {
    const sections = deriveSidebarSections({
      projects: [
        makeProjectSummary({
          id: "void-project",
          kind: "project",
          title: "Void",
          workspaceRoot: "/void",
          spaceId: null,
        }),
        makeProjectSummary({
          id: "space-project",
          kind: "project",
          title: "Space",
          workspaceRoot: "/space",
          spaceId: SpaceId.makeUnsafe("space-a"),
        }),
        makeProjectSummary({
          id: "chat",
          kind: "chat",
          title: "Home",
          workspaceRoot: "/home",
          spaceId: null,
        }),
      ],
      threads: [
        makeThreadSummary({
          id: "void-thread",
          title: "Void thread",
          projectId: "void-project",
          project: "Void",
          messageCount: 1,
          updatedAt: "2026-01-01",
          live: false,
          isPinned: true,
        }),
        makeThreadSummary({
          id: "space-thread",
          title: "Space thread",
          projectId: "space-project",
          project: "Space",
          messageCount: 1,
          updatedAt: "2026-01-02",
          live: false,
          isPinned: true,
        }),
        makeThreadSummary({
          id: "chat-thread",
          title: "Chat",
          projectId: "chat",
          project: "Home",
          messageCount: 1,
          updatedAt: "2026-01-03",
          live: false,
        }),
      ],
      activeSpaceId: SpaceId.makeUnsafe("space-a"),
    });

    expect(sections.projectGroups.map((project) => project.id)).toEqual(["space-project"]);
    expect(sections.projectGroups[0]?.spaceId).toBe("space-a");
    expect(sections.pinnedThreads.map((thread) => thread.id)).toEqual(["space-thread"]);
    expect(sections.chatThreads.map((thread) => thread.id)).toEqual(["chat-thread"]);
  });
});

describe("shared sidebar route/list state", () => {
  it("restores settings back navigation to the remembered available thread", () => {
    expect(
      resolveSettingsBackTarget({
        lastThreadRoute: { threadId: "remembered" },
        availableThreadIds: new Set(["remembered", "latest"]),
        latestThreadId: "latest",
      }),
    ).toEqual({ kind: "thread", threadId: "remembered", splitViewId: undefined });
  });

  it("drops show-more pages for a collapsed project", () => {
    const next = pruneProjectThreadListPagingForCollapsedProjects({
      threadListExtraPagesByProjectCwd: new Map([
        ["/one", 2],
        ["/two", 1],
      ]),
      projects: [
        { cwd: "/one", expanded: false },
        { cwd: "/two", expanded: true },
      ],
      normalizeProjectCwd: (cwd) => cwd,
    });
    expect([...next]).toEqual([["/two", 1]]);
  });
});

describe("shared sidebar action badges", () => {
  it("presents an exact pull-request review count", () => {
    expect(resolvePullRequestReviewBadge({ count: 2, incomplete: false })).toEqual({
      text: "2",
      accessibleLabel: "2 pull requests are waiting for your review",
    });
  });
});

describe("shared sidebar surface routing", () => {
  it("selects Studio primary actions on the Studio route", () => {
    expect(
      resolveSidebarPrimarySurface({
        isOnStudio: true,
        isOnWorkspace: false,
      }),
    ).toBe("studio");
  });

  it("consumes all optional sidebar-section visibility settings", () => {
    const source = readFileSync(new URL("./Sidebar.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("const chatsSectionVisible = initialSortSettings.showChatsSection");
    expect(source).toContain("const studioSectionVisible = initialSortSettings.showStudioSection");
    expect(source).toContain(
      "const workspaceSectionVisible = initialSortSettings.showWorkspaceSection",
    );
    expect(source).toContain('...(studioSectionVisible ? (["studio"] as const) : [])');
    expect(source).toContain("chatsSectionVisible &&");
    expect(source).toContain(
      'fetchPullRequests({\n        state: "open",\n        projectId: null,',
    );
    expect(source).not.toContain("queryFn: fetchPullRequests");
  });
});
