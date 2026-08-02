// FILE: SettingsProviderUpdateChecksComposition.logic.ts
// Purpose: Side-effect-free projection for the shared provider update-check preference.

import type { ServerSettingsView } from "@synara/contracts";

export type SettingsProviderUpdateChecksValues = {
  readonly enableProviderUpdateChecks: boolean;
};

export const DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES: SettingsProviderUpdateChecksValues = {
  enableProviderUpdateChecks: true,
};

export function readSettingsProviderUpdateChecksValues(
  settings: Pick<ServerSettingsView, "enableProviderUpdateChecks"> | null | undefined,
): SettingsProviderUpdateChecksValues {
  return {
    enableProviderUpdateChecks:
      typeof settings?.enableProviderUpdateChecks === "boolean"
        ? settings.enableProviderUpdateChecks
        : DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES.enableProviderUpdateChecks,
  };
}

export function settingsProviderUpdateChecksValuesEqual(
  left: SettingsProviderUpdateChecksValues,
  right: SettingsProviderUpdateChecksValues,
): boolean {
  return left.enableProviderUpdateChecks === right.enableProviderUpdateChecks;
}
