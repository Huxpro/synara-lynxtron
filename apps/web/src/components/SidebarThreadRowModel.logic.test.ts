import { describe, expect, it } from "vitest";

import { resolveSidebarThreadRowModel } from "./SidebarThreadRowModel.logic";

describe("resolveSidebarThreadRowModel", () => {
  it("derives active and selected highlight state", () => {
    expect(
      resolveSidebarThreadRowModel({
        threadId: "thread-1",
        activeThreadId: "thread-1",
        selected: false,
      }),
    ).toMatchObject({
      isActive: true,
      isSelected: false,
      isHighlighted: true,
      hoverScope: "project",
    });
  });

  it("caps nested subagent indentation and suppresses compact metadata", () => {
    expect(
      resolveSidebarThreadRowModel({
        threadId: "thread-1",
        parentThreadId: "parent",
        depth: 8,
        temporary: true,
      }),
    ).toMatchObject({
      isSubagentThread: true,
      subagentIndentPx: 30,
      showCompactMeta: false,
      showTemporaryThreadIcon: false,
    });
  });

  it("shows a temporary glyph only for ordinary non-sidechat rows", () => {
    expect(
      resolveSidebarThreadRowModel({
        threadId: "thread-1",
        temporary: true,
        topLevel: true,
      }),
    ).toMatchObject({
      showTemporaryThreadIcon: true,
      hoverScope: "chat",
    });
    expect(
      resolveSidebarThreadRowModel({
        threadId: "thread-1",
        temporary: true,
        sidechatSourceThreadId: "source",
      }).showTemporaryThreadIcon,
    ).toBe(false);
  });
});
