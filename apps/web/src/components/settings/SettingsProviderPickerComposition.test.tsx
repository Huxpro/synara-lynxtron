import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SettingsProviderPickerComposition } from "./SettingsProviderPickerComposition";
import {
  DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES,
  buildSettingsProviderPickerItems,
  moveSettingsProvider,
  normalizeSettingsProviderPickerValues,
  setSettingsProviderHidden,
} from "./SettingsProviderPickerComposition.logic";

describe("SettingsProviderPickerComposition", () => {
  it("normalizes visibility/order and supports deterministic move/hide mutations", () => {
    const values = normalizeSettingsProviderPickerValues({
      hiddenProviders: ["kilo", "bogus", "kilo"],
      providerOrder: ["kilo", "codex"],
    });
    expect(values.hiddenProviders).toEqual(["kilo"]);
    expect(values.providerOrder.slice(0, 2)).toEqual(["kilo", "codex"]);
    const moved = moveSettingsProvider(values, "codex", "up");
    expect(moved.providerOrder.slice(0, 2)).toEqual(["codex", "kilo"]);
    expect(setSettingsProviderHidden(moved, "kilo", false).hiddenProviders).toEqual([]);
    expect(buildSettingsProviderPickerItems(values)[0]).toMatchObject({
      provider: "kilo",
      title: "Kilo",
      hidden: true,
      canMoveUp: false,
    });
  });

  it("owns canonical copy, status, and reset availability", () => {
    const markup = renderToStaticMarkup(
      <SettingsProviderPickerComposition
        values={{
          ...DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES,
          hiddenProviders: ["kilo"],
        }}
        defaults={DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES}
        onChange={vi.fn()}
      />,
    );
    expect(markup).toContain("Provider picker");
    expect(markup).toContain("1 provider hidden");
    expect(markup).toContain("Reset provider picker to default");
    expect(markup).toContain("Show Kilo in the provider picker");
  });
});
