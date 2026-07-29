import { describe, expect, it } from "vitest";

import {
  resolveSidebarProjectStatus,
  resolveSidebarStatusPresentation,
} from "./SidebarStatus.logic";

describe("Sidebar status presentation", () => {
  it("keeps actionable states above live activity", () => {
    expect(
      resolveSidebarStatusPresentation({
        pendingUserInput: { dismissalKey: "input:1" },
        working: true,
      }),
    ).toMatchObject({
      label: "Awaiting Input",
      dismissalKey: "input:1",
      dismissible: true,
    });
  });

  it("does not fall through a dismissed highest-priority status", () => {
    expect(
      resolveSidebarStatusPresentation({
        pendingApproval: { dismissed: true },
        connecting: true,
      }),
    ).toBeNull();
  });

  it("selects the highest project status", () => {
    const completed = resolveSidebarStatusPresentation({ completed: {} });
    const working = resolveSidebarStatusPresentation({ working: true });
    expect(resolveSidebarProjectStatus([completed, working])?.label).toBe("Working");
  });
});
