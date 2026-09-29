import { describe, expect, it } from "@rstest/core";

import { readReducedMotionEvent, REDUCED_MOTION_EVENT } from "./reducedMotionEvent.logic";

describe("reduced motion event contract", () => {
  it("uses one stable host-to-renderer event name", () => {
    expect(REDUCED_MOTION_EVENT).toBe("synara:reduced-motion");
  });

  it("accepts only boolean host preference payloads", () => {
    expect(readReducedMotionEvent(true)).toBe(true);
    expect(readReducedMotionEvent(false)).toBe(false);
    expect(readReducedMotionEvent("reduce")).toBeNull();
    expect(readReducedMotionEvent(undefined)).toBeNull();
  });
});
