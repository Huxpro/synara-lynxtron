import { render } from "@lynx-js/react/testing-library";
import { describe, expect, it } from "@rstest/core";

import { SidebarProjectHoverCard, SidebarThreadHoverCard } from "./SidebarHoverCards.lynx";

describe("sidebar hover card icon paint", () => {
  it("renders project metadata in muted paint and preserves pin hierarchy", () => {
    const { rerender } = render(
      <SidebarProjectHoverCard
        chatCount={2}
        isPinned={false}
        name="Synara"
        path="~/github/synara"
      />,
    );

    const metadataIcons = elementTree.root?.querySelectorAll(".AppSidebarHoverCardIcon");
    expect(metadataIcons).toHaveLength(4);
    for (const icon of metadataIcons ?? []) {
      expect(icon.getAttribute("content")).toContain('stroke="rgba(13, 13, 13, 0.6)"');
    }

    let pin = elementTree.root?.querySelector(".AppSidebarHoverCardPin");
    expect(pin?.getAttribute("class")).not.toContain("AppSidebarHoverCardPin--pinned");
    expect(pin?.getAttribute("content")).toContain('stroke="rgba(13, 13, 13, 0.6)"');

    rerender(
      <SidebarProjectHoverCard chatCount={2} isPinned name="Synara" path="~/github/synara" />,
    );
    pin = elementTree.root?.querySelector(".AppSidebarHoverCardPin");
    expect(pin?.getAttribute("class")).toContain("AppSidebarHoverCardPin--pinned");
    expect(pin?.getAttribute("content")).toContain('fill="#0d0d0d"');
  });

  it("renders thread metadata with the muted source paint and dimming class", () => {
    render(
      <SidebarThreadHoverCard
        branch="main"
        projectName="Synara"
        sourceProjectName="synara"
        thread={
          {
            createdAt: "2026-09-13T00:00:00.000Z",
            id: "thread-1",
            projectId: "project-1",
            title: "Close UI fidelity",
            updatedAt: "2026-09-13T00:00:00.000Z",
          } as never
        }
        worktreeName="worktree-ui"
      />,
    );

    const card = elementTree.root?.querySelector(".AppSidebarThreadHoverCard");
    const metadataIcons = card?.querySelectorAll(".AppSidebarHoverCardIcon");
    expect(metadataIcons).toHaveLength(4);
    for (const icon of metadataIcons ?? []) {
      expect(icon.getAttribute("content")).toMatch(/(?:stroke|fill)="rgba\(13, 13, 13, 0\.6\)"/);
    }
  });
});
