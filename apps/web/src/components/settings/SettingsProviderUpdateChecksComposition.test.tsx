import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SettingsProviderUpdateChecksComposition } from "./SettingsProviderUpdateChecksComposition";
import {
  DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES,
  readSettingsProviderUpdateChecksValues,
} from "./SettingsProviderUpdateChecksComposition.logic";

describe("SettingsProviderUpdateChecksComposition", () => {
  it("projects the server setting and falls back to the canonical default", () => {
    expect(readSettingsProviderUpdateChecksValues(null)).toEqual(
      DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES,
    );
    expect(
      readSettingsProviderUpdateChecksValues({ enableProviderUpdateChecks: false } as never),
    ).toEqual({ enableProviderUpdateChecks: false });
  });

  it("owns canonical copy and changed reset availability", () => {
    const markup = renderToStaticMarkup(
      <SettingsProviderUpdateChecksComposition
        values={{ enableProviderUpdateChecks: false }}
        defaults={DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES}
        onChange={vi.fn()}
      />,
    );
    expect(markup).toContain("Updates");
    expect(markup).toContain("Automatic CLI update checks");
    expect(markup).toContain("Reset CLI update checks to default");
  });
});
