import { describe, expect, it } from "vitest";

import {
  resolveViewportLayout,
  viewportBreakpointClassNames,
  viewportHeightClassNames,
  viewportLayoutClassName,
  VIEWPORT_HEIGHT_BREAKPOINTS,
  VIEWPORT_BREAKPOINTS,
} from "./responsiveLayout.logic";

describe("responsive viewport layout", () => {
  it("uses the same md and lg boundaries as the Web media-query contract", () => {
    expect(VIEWPORT_BREAKPOINTS.md).toBe(768);
    expect(VIEWPORT_BREAKPOINTS.lg).toBe(1024);
    expect(resolveViewportLayout({ width: 0, height: 0 }).band).toBe("unknown");
    expect(resolveViewportLayout({ width: 767, height: 700 }).band).toBe("compact");
    expect(resolveViewportLayout({ width: 768, height: 700 }).band).toBe("medium");
    expect(resolveViewportLayout({ width: 1023, height: 700 }).band).toBe("medium");
    expect(resolveViewportLayout({ width: 1024, height: 700 }).band).toBe("wide");
  });

  it("projects a stable root class instead of relying on native media queries", () => {
    expect(viewportLayoutClassName(resolveViewportLayout({ width: 900, height: 650 }))).toBe(
      "SliceRoot--viewport-medium",
    );
  });

  it("projects cumulative Web breakpoint classes for user-space responsive CSS", () => {
    expect(viewportBreakpointClassNames(resolveViewportLayout({ width: 639, height: 700 }))).toBe(
      "",
    );
    expect(viewportBreakpointClassNames(resolveViewportLayout({ width: 640, height: 700 }))).toBe(
      "SliceRoot--viewport-sm-up",
    );
    expect(viewportBreakpointClassNames(resolveViewportLayout({ width: 1024, height: 700 }))).toBe(
      "SliceRoot--viewport-sm-up SliceRoot--viewport-md-up SliceRoot--viewport-lg-up",
    );
  });

  it("projects a short-height class without changing width bands", () => {
    expect(VIEWPORT_HEIGHT_BREAKPOINTS.constrained).toBe(480);
    expect(VIEWPORT_HEIGHT_BREAKPOINTS.short).toBe(320);
    expect(viewportHeightClassNames(resolveViewportLayout({ width: 900, height: 480 }))).toBe(
      "SliceRoot--viewport-constrained-height",
    );
    expect(viewportHeightClassNames(resolveViewportLayout({ width: 900, height: 319 }))).toBe(
      "SliceRoot--viewport-constrained-height SliceRoot--viewport-short-height",
    );
    expect(viewportHeightClassNames(resolveViewportLayout({ width: 900, height: 481 }))).toBe("");
  });
});
