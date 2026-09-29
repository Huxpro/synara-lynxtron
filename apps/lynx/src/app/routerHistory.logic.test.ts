import { describe, expect, it } from "@rstest/core";

import { resolveMemoryNavigationState } from "./routerHistory.logic";

describe("memory navigation state", () => {
  it("derives back and forward availability from TanStack history state", () => {
    expect(
      resolveMemoryNavigationState({
        length: 3,
        state: { __TSR_index: 1 },
      }),
    ).toEqual({
      canGoBack: true,
      canGoForward: true,
      index: 1,
      length: 3,
    });
  });

  it("clamps missing or stale indices", () => {
    expect(resolveMemoryNavigationState({ length: 1, state: null })).toEqual({
      canGoBack: false,
      canGoForward: false,
      index: 0,
      length: 1,
    });
    expect(
      resolveMemoryNavigationState({
        length: 2,
        state: { __TSR_index: 99 },
      }),
    ).toEqual({
      canGoBack: true,
      canGoForward: false,
      index: 1,
      length: 2,
    });
  });
});
