import { describe, expect, it } from "vitest";

import {
  SIDEBAR_SURFACE_PICKER_COPY,
  resolveSidebarSurfacePickerViews,
} from "./SidebarSurfacePicker.logic";

describe("sidebar surface picker", () => {
  it("lists Synara first and Studio only while Studio is visible", () => {
    expect(resolveSidebarSurfacePickerViews(false)).toEqual(["threads"]);
    expect(resolveSidebarSurfacePickerViews(true)).toEqual(["threads", "studio"]);
  });

  it("names each surface with a title and a one-line description", () => {
    expect(SIDEBAR_SURFACE_PICKER_COPY.threads).toEqual({
      title: "Synara",
      description: "Build, debug, and ship",
    });
    expect(SIDEBAR_SURFACE_PICKER_COPY.studio.title).toBe("Studio");
  });
});
