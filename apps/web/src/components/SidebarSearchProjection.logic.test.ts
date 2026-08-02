import { describe, expect, it } from "vitest";

import {
  projectSidebarSearchProject,
  projectSidebarSearchThreads,
} from "./SidebarSearchProjection.logic";
import { SIDEBAR_SEARCH_LIMITS } from "./SidebarSearchPalette.logic";

describe("Sidebar search projection", () => {
  it("normalizes project display fallbacks from one source", () => {
    expect(
      projectSidebarSearchProject({
        id: "project-1",
        name: "Synara",
        cwd: "/work/synara",
        spaceName: "Focus",
      }),
    ).toMatchObject({
      remoteName: "Synara",
      folderName: "synara",
      localName: null,
    });
  });

  it("preserves visible thread order and skips missing full records", () => {
    const project = projectSidebarSearchProject({
      id: "project-1",
      name: "Synara",
      cwd: "/work/synara",
      spaceName: "Focus",
    });
    const projected = projectSidebarSearchThreads({
      projects: [project],
      visibleThreadIds: ["thread-2", "missing", "thread-1"],
      threads: [
        {
          id: "thread-1",
          title: "One",
          projectId: project.id,
          provider: "codex",
          createdAt: "2026-01-01",
        },
        {
          id: "thread-2",
          title: "Two",
          projectId: project.id,
          provider: "codex",
          createdAt: "2026-01-02",
        },
      ],
    });

    expect(projected.map((thread) => thread.id)).toEqual(["thread-2", "thread-1"]);
    expect(projected[0]).toMatchObject({
      projectName: "Synara",
      projectRemoteName: "Synara",
      spaceName: "Focus",
      messages: [],
    });
  });

  it("keeps every title candidate but bounds message bodies to recent threads", () => {
    const project = projectSidebarSearchProject({
      id: "project-1",
      name: "Synara",
      cwd: "/work/synara",
      spaceName: "Focus",
    });
    const threads = Array.from(
      { length: SIDEBAR_SEARCH_LIMITS.messageThreadCount + 1 },
      (_, index) => ({
        id: `thread-${index}`,
        title: `Thread ${index}`,
        projectId: project.id,
        provider: "codex" as const,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
        messages: [{ text: `message-${index}` }],
      }),
    );

    const projected = projectSidebarSearchThreads({ projects: [project], threads });

    expect(projected).toHaveLength(threads.length);
    expect(projected[0]?.messages).toEqual([]);
    expect(projected.at(-1)?.messages).toEqual([
      { text: `message-${SIDEBAR_SEARCH_LIMITS.messageThreadCount}` },
    ]);
  });

  it("keeps only recent messages and bounds each body plus the global character budget", () => {
    const project = projectSidebarSearchProject({
      id: "project-1",
      name: "Synara",
      cwd: "/work/synara",
      spaceName: "Focus",
    });
    const longText = "x".repeat(SIDEBAR_SEARCH_LIMITS.messageCharsPerMessage + 400);
    const projected = projectSidebarSearchThreads({
      projects: [project],
      threads: [
        {
          id: "thread-1",
          title: "One",
          projectId: project.id,
          provider: "codex",
          createdAt: "2026-01-01",
          messages: Array.from(
            { length: SIDEBAR_SEARCH_LIMITS.messagesPerThread + 3 },
            (_, index) => ({ text: `${index}:${longText}` }),
          ),
        },
      ],
    });
    const messages = projected[0]?.messages ?? [];

    expect(messages).toHaveLength(SIDEBAR_SEARCH_LIMITS.messagesPerThread);
    expect(messages.every((message) => message.text.length <= 1_200)).toBe(true);
    expect(messages.reduce((total, message) => total + message.text.length, 0)).toBeLessThanOrEqual(
      SIDEBAR_SEARCH_LIMITS.messageCharsTotal,
    );
    expect(messages[0]?.text.startsWith("3:")).toBe(true);
    expect(messages[0]?.text).toContain("…");
  });

  it("uses source order as the stable tie-break for equally recent message threads", () => {
    const project = projectSidebarSearchProject({
      id: "project-1",
      name: "Synara",
      cwd: "/work/synara",
      spaceName: "Focus",
    });
    const threads = Array.from(
      { length: SIDEBAR_SEARCH_LIMITS.messageThreadCount + 1 },
      (_, index) => ({
        id: `thread-${index}`,
        title: `Thread ${index}`,
        projectId: project.id,
        provider: "codex" as const,
        createdAt: "2026-01-01",
        messages: [{ text: `message-${index}` }],
      }),
    );

    const first = projectSidebarSearchThreads({ projects: [project], threads });
    const second = projectSidebarSearchThreads({ projects: [project], threads });

    expect(first).toEqual(second);
    expect(first.at(-1)?.messages).toEqual([]);
  });
});
