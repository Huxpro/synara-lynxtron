import { describe, expect, it } from "vitest";

import {
  resolveViewportLayout,
  viewportLayoutClassName,
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
    expect(
      viewportLayoutClassName(resolveViewportLayout({ width: 900, height: 650 })),
    ).toBe("SliceRoot--viewport-medium");
  });
});
