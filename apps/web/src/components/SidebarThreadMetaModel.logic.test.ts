import { describe, expect, it } from "vitest";

import { resolveSidebarThreadMetaDescriptors } from "./SidebarThreadMetaModel.logic";

describe("resolveSidebarThreadMetaDescriptors", () => {
  it("keeps the stable automation, handoff, fork, and worktree order", () => {
    expect(
      resolveSidebarThreadMetaDescriptors({
        automations: [{ name: "Heartbeat", enabled: true, cadenceLabel: "Every hour" }],
        handoffBadgeLabel: "Claude to Codex",
        forkSourceThreadId: "thread-source",
        worktreeBadgeLabel: "Worktree feature/sidebar",
      }).map((descriptor) => descriptor.id),
    ).toEqual(["automation", "handoff", "fork", "worktree"]);
  });

  it("drops duplicate handoff and sidechat fork badges", () => {
    expect(
      resolveSidebarThreadMetaDescriptors({
        handoffBadgeLabel: "Claude to Codex",
        handoffShownInAvatar: true,
        forkSourceThreadId: "thread-source",
        sidechatSourceThreadId: "thread-parent",
      }),
    ).toEqual([]);
  });
});
