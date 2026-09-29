import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import {
  resolveSettingsPersistencePresentation,
  shouldApplySettingsSaveResult,
} from "./settingsPersistence.logic";

describe("settings persistence presentation", () => {
  it("keeps a successfully hydrated stable page visually quiet", () => {
    expect(resolveSettingsPersistencePresentation({ kind: "loaded" })).toBeNull();
    const settingsPageSource = readFileSync(new URL("./SettingsPage.tsx", import.meta.url), "utf8");
    expect(settingsPageSource).toContain(
      "section !== 'archived' &&\n              persistencePresentation ? (",
    );
  });

  it("uses polite status copy for save progress", () => {
    expect(resolveSettingsPersistencePresentation({ kind: "saving" })).toEqual({
      announcement: "Saving changes",
      intent: "status",
      message: "Saving changes…",
    });
    expect(resolveSettingsPersistencePresentation({ kind: "saved" })).toEqual({
      announcement: "Changes saved",
      intent: "status",
      message: "Changes saved.",
    });
  });

  it("keeps actionable failure copy in an alert", () => {
    expect(
      resolveSettingsPersistencePresentation({
        kind: "error",
        message: "Changes could not be saved. Your current values are still shown.",
      }),
    ).toEqual({
      announcement: "Changes could not be saved. Your current values are still shown.",
      intent: "alert",
      message: "Changes could not be saved. Your current values are still shown.",
    });
  });

  it("rejects stale completions from overlapping saves", () => {
    expect(shouldApplySettingsSaveResult(4, 3)).toBe(false);
    expect(shouldApplySettingsSaveResult(4, 4)).toBe(true);
  });
});
