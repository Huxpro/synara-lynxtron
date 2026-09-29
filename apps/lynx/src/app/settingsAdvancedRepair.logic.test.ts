import { describe, expect, it, rs } from "@rstest/core";

import { repairAdvancedSettingsState } from "./settingsAdvancedRepair.logic";

describe("Settings Advanced repair transaction", () => {
  it("syncs the authoritative repaired snapshot before invalidating queries", async () => {
    const snapshot = { snapshotSequence: 42 } as never;
    const events: string[] = [];
    const repair = rs.fn(async () => {
      events.push("repair");
      return snapshot;
    });
    const sync = rs.fn(() => {
      events.push("sync");
    });
    const invalidate = rs.fn(async () => {
      events.push("invalidate");
    });

    await repairAdvancedSettingsState({ repair, sync, invalidate });

    expect(sync).toHaveBeenCalledWith(snapshot);
    expect(events).toEqual(["repair", "sync", "invalidate"]);
  });

  it("does not sync or invalidate when repair fails", async () => {
    const sync = rs.fn();
    const invalidate = rs.fn();

    await expect(
      repairAdvancedSettingsState({
        repair: async () => {
          throw new Error("repair failed");
        },
        sync,
        invalidate,
      }),
    ).rejects.toThrow("repair failed");
    expect(sync).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });
});
