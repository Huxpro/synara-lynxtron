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
      hiddenProviders: ["grok", "bogus", "grok"],
      providerOrder: ["grok", "codex"],
    });
    expect(values.hiddenProviders).toEqual(["grok"]);
    expect(values.providerOrder.slice(0, 2)).toEqual(["grok", "codex"]);
    const moved = moveSettingsProvider(values, "codex", "up");
    expect(moved.providerOrder.slice(0, 2)).toEqual(["codex", "grok"]);
    expect(setSettingsProviderHidden(moved, "grok", false).hiddenProviders).toEqual([]);
    expect(buildSettingsProviderPickerItems(values)[0]).toMatchObject({
      provider: "grok",
      title: "Grok",
      hidden: true,
      canMoveUp: false,
    });
  });

  it("owns canonical copy, status, and reset availability", () => {
    const markup = renderToStaticMarkup(
      <SettingsProviderPickerComposition
        values={{
          ...DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES,
          hiddenProviders: ["grok"],
        }}
        defaults={DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES}
        onChange={vi.fn()}
      />,
    );
    expect(markup).toContain("Provider picker");
    expect(markup).toContain("1 provider hidden");
    expect(markup).toContain("Reset provider picker to default");
    expect(markup).toContain("Show Grok in the provider picker");
  });
});
