import { describe, expect, it } from "vitest";

import {
  THREAD_MAIN_CONTENT_MIN_WIDTH,
  THREAD_SIDEBAR_DEFAULT_WIDTH,
  THREAD_SIDEBAR_MIN_WIDTH,
  clampSidebarWidth,
  sidebarWidthFromPointer,
} from "./sidebarResize.logic";

describe("sidebar resize logic", () => {
  it("keeps the shared desktop defaults explicit", () => {
    expect(THREAD_SIDEBAR_DEFAULT_WIDTH).toBe(256);
    expect(THREAD_SIDEBAR_MIN_WIDTH).toBe(208);
    expect(THREAD_MAIN_CONTENT_MIN_WIDTH).toBe(640);
  });

  it("clamps to both sidebar and main-content boundaries", () => {
    const input = {
      minWidth: THREAD_SIDEBAR_MIN_WIDTH,
      minimumContentWidth: THREAD_MAIN_CONTENT_MIN_WIDTH,
      viewportWidth: 1024,
    };
    expect(clampSidebarWidth(100, input)).toBe(208);
    expect(clampSidebarWidth(300, input)).toBe(300);
    expect(clampSidebarWidth(500, input)).toBe(384);
  });

  it("converts left and right pointer movement into width", () => {
    expect(
      sidebarWidthFromPointer({
        currentX: 300,
        side: "left",
        startWidth: 256,
        startX: 256,
      }),
    ).toBe(300);
    expect(
      sidebarWidthFromPointer({
        currentX: 900,
        side: "right",
        startWidth: 256,
        startX: 944,
      }),
    ).toBe(300);
  });
});
