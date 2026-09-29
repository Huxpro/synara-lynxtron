import { describe, expect, it } from "vitest";

import {
  resolvePendingSidebarViewSelection,
  resolveSidebarSegmentGeometry,
} from "./SidebarSegmentedPicker.logic";

describe("Sidebar segmented picker geometry", () => {
  it("keeps the two-segment edge overhang without nested calc arithmetic", () => {
    expect(resolveSidebarSegmentGeometry(0, 2)).toEqual({
      left: "-6px",
      width: "calc(50% + 6px)",
      labelTranslateX: "-4px",
    });
    expect(resolveSidebarSegmentGeometry(1, 2)).toEqual({
      left: "50%",
      width: "calc(50% + 6px)",
      labelTranslateX: "4px",
    });
  });

  it("keeps middle segments inside the track", () => {
    expect(resolveSidebarSegmentGeometry(1, 3)).toEqual({
      left: "calc(33.333333% + 0.666667px)",
      width: "calc(33.333333% - 1.333333px)",
      labelTranslateX: "0px",
    });
  });

  it("clamps invalid active indices and preserves pending selection semantics", () => {
    expect(resolveSidebarSegmentGeometry(9, 2)).toEqual(resolveSidebarSegmentGeometry(1, 2));
    expect(resolvePendingSidebarViewSelection("threads", "threads")).toBeNull();
    expect(resolvePendingSidebarViewSelection("threads", "studio")).toBe("studio");
  });
});
