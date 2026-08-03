import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SettingsBehaviorPanel } from "./SettingsBehaviorPanel";
import {
  DEFAULT_BEHAVIOR_SETTINGS_VALUES,
  behaviorSettingsValuesEqual,
} from "./SettingsBehaviorPanel.logic";

describe("SettingsBehaviorPanel", () => {
  it("owns the canonical behavior sections and reset contract", () => {
    const markup = renderToStaticMarkup(
      <SettingsBehaviorPanel
        settings={{
          ...DEFAULT_BEHAVIOR_SETTINGS_VALUES,
          confirmThreadArchive: true,
        }}
        defaults={DEFAULT_BEHAVIOR_SETTINGS_VALUES}
        updateSetting={vi.fn()}
        renderControl={({ ariaLabel }) => <span>{ariaLabel}</span>}
        renderResetAction={({ changed, label }) =>
          changed ? <span>{`Reset ${label} to default`}</span> : null
        }
      />,
    );

    expect(markup).toContain("Runtime behavior");
    expect(markup).toContain("Safety confirmations");
    expect(markup).toContain("Stream assistant messages");
    expect(markup).toContain("Confirm terminal tab close");
    expect(markup).toContain("Reset archive confirmation to default");
    expect(markup).not.toContain("Reset delete confirmation to default");
  });

  it("compares all behavior values against their defaults", () => {
    expect(
      behaviorSettingsValuesEqual(
        DEFAULT_BEHAVIOR_SETTINGS_VALUES,
        DEFAULT_BEHAVIOR_SETTINGS_VALUES,
      ),
    ).toBe(true);
    expect(
      behaviorSettingsValuesEqual(
        { ...DEFAULT_BEHAVIOR_SETTINGS_VALUES, diffWordWrap: true },
        DEFAULT_BEHAVIOR_SETTINGS_VALUES,
      ),
    ).toBe(false);
  });
});
