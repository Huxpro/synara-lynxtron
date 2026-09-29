import { describe, expect, it } from "@rstest/core";

import { threadErrorDismissKey, visibleThreadError } from "./threadErrorBanner.logic";

describe("thread error banner dismissal identity", () => {
  it("keeps one runtime error dismissed for the same session revision", () => {
    const dismissedKey = threadErrorDismissKey({
      error: "Usage limit reached.",
      revision: "2026-08-18T08:00:00.000Z",
    });

    expect(
      visibleThreadError({
        dismissedKey,
        error: "Usage limit reached.",
        revision: "2026-08-18T08:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("shows the same provider message again after a newer failure", () => {
    const dismissedKey = threadErrorDismissKey({
      error: "Usage limit reached.",
      revision: "2026-08-18T08:00:00.000Z",
    });

    expect(
      visibleThreadError({
        dismissedKey,
        error: "Usage limit reached.",
        revision: "2026-08-18T08:05:00.000Z",
      }),
    ).toBe("Usage limit reached.");
  });
});
