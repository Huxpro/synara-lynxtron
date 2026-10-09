import { describe, expect, it, rs } from "@rstest/core";

import { repairAdvancedSettingsState } from "./settingsAdvancedRepair.logic";

describe("Settings Advanced repair transaction", () => {
  it("syncs the authoritative repaired snapshot into the store", async () => {
    const snapshot = { snapshotSequence: 42 } as never;
    const events: string[] = [];
    const repair = rs.fn(async () => {
      events.push("repair");
      return snapshot;
    });
    const sync = rs.fn(() => {
      events.push("sync");
    });

    await repairAdvancedSettingsState({ repair, sync });

    expect(sync).toHaveBeenCalledWith(snapshot);
    expect(events).toEqual(["repair", "sync"]);
  });

  it("does not sync when repair fails", async () => {
    const sync = rs.fn();

    await expect(
      repairAdvancedSettingsState({
        repair: async () => {
          throw new Error("repair failed");
        },
        sync,
      }),
    ).rejects.toThrow("repair failed");
    expect(sync).not.toHaveBeenCalled();
  });
});
