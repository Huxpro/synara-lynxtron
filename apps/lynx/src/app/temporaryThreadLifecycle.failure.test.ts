import { describe, expect, it, rs } from "@rstest/core";

import { deleteTemporaryThreadBestEffort } from "./temporaryThreadLifecycle.lynx";

describe("deleteTemporaryThreadBestEffort", () => {
  it("invalidates projections after successful deletion", async () => {
    const invalidate = rs.fn(async () => undefined);

    await deleteTemporaryThreadBestEffort({
      dispatchDelete: async () => undefined,
      invalidate,
    });

    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it("contains delete and invalidation failures without leaking cleanup rejection", async () => {
    const invalidate = rs.fn(async () => {
      throw new Error("offline");
    });

    await expect(
      deleteTemporaryThreadBestEffort({
        dispatchDelete: async () => {
          throw new Error("delete failed");
        },
        invalidate,
      }),
    ).resolves.toBeUndefined();
    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
