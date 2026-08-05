import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SettingsNotificationsPanel } from "./SettingsNotificationsPanel";
import {
  DEFAULT_NOTIFICATION_SETTINGS_VALUES,
  notificationSettingsValuesEqual,
} from "./SettingsNotificationsPanel.logic";

describe("SettingsNotificationsPanel", () => {
  it("owns the canonical notification rows, status, and reset contract", () => {
    const markup = renderToStaticMarkup(
      <SettingsNotificationsPanel
        settings={{
          ...DEFAULT_NOTIFICATION_SETTINGS_VALUES,
          enableTaskCompletionToasts: false,
        }}
        defaults={DEFAULT_NOTIFICATION_SETTINGS_VALUES}
        activityStatus="Activity unavailable"
        desktopStatus="Permission granted"
        updateSetting={vi.fn()}
        renderControl={({ ariaLabel }) => <span>{ariaLabel}</span>}
        renderResetAction={({ changed, label }) =>
          changed ? <span>{`Reset ${label} to default`}</span> : null
        }
      />,
    );

    expect(markup).toContain("Activity alerts");
    expect(markup).toContain("Activity toasts");
    expect(markup).toContain("Desktop notifications");
    expect(markup).toContain("Activity unavailable");
    expect(markup).toContain("Permission granted");
    expect(markup).toContain("Reset activity toasts to default");
    expect(markup).not.toContain("Reset desktop notifications to default");
  });

  it("compares both notification preferences", () => {
    expect(
      notificationSettingsValuesEqual(
        DEFAULT_NOTIFICATION_SETTINGS_VALUES,
        DEFAULT_NOTIFICATION_SETTINGS_VALUES,
      ),
    ).toBe(true);
    expect(
      notificationSettingsValuesEqual(
        {
          ...DEFAULT_NOTIFICATION_SETTINGS_VALUES,
          enableSystemTaskCompletionNotifications: false,
        },
        DEFAULT_NOTIFICATION_SETTINGS_VALUES,
      ),
    ).toBe(false);
  });
});
