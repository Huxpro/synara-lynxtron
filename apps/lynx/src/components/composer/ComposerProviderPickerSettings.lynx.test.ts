import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx composer provider picker settings", () => {
  it("feeds the canonical visibility and order projection into the shared picker", () => {
    const source = readFileSync(
      new URL("./ComposerModelControl.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("readSettingsProviderPickerProjection(");
    expect(source).toContain("webStorage.getItem(APP_SETTINGS_STORAGE_KEY)");
    expect(source).toContain("hiddenProviders: providerPickerSettings.hiddenProviders");
    expect(source).toContain("providerOrder: providerPickerSettings.providerOrder");
    expect(source).toContain("protectedProviders: [activeProvider]");
  });
});
