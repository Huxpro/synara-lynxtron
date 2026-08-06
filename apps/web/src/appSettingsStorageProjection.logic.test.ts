import { describe, expect, it } from "vitest";

import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS_APPEARANCE_VALUES,
  DEFAULT_SETTINGS_GENERAL_VALUES,
  THEME_STORAGE_KEY,
  readSettingsAppearanceProjection,
  readSettingsGeneralProjection,
  readSettingsProviderPickerProjection,
  writeSettingsAppearanceProjection,
  writeSettingsGeneralProjection,
  writeSettingsProviderPickerProjection,
  writeSidebarSortProjection,
} from "./appSettingsStorageProjection.logic";
import { DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES } from "./components/settings/SettingsProviderPickerComposition.logic";

describe("app settings General storage projection", () => {
  it("uses the canonical key and defaults", () => {
    expect(APP_SETTINGS_STORAGE_KEY).toBe("synara:app-settings:v1");
    expect(readSettingsGeneralProjection(null)).toEqual(DEFAULT_SETTINGS_GENERAL_VALUES);
  });

  it("preserves settings outside the General projection", () => {
    const raw = writeSettingsGeneralProjection(
      JSON.stringify({ chatFontSizePx: 17, showChatsSection: false }),
      DEFAULT_SETTINGS_GENERAL_VALUES,
    );
    expect(JSON.parse(raw)).toMatchObject({
      chatFontSizePx: 17,
      showChatsSection: true,
      defaultProvider: "codex",
    });
  });

  it("updates sidebar sort values without rewriting unrelated settings", () => {
    const raw = writeSidebarSortProjection(
      JSON.stringify({ chatFontSizePx: 17, defaultProvider: "claudeAgent" }),
      {
        sidebarProjectSortOrder: "created_at",
        sidebarThreadSortOrder: "updated_at",
      },
    );
    expect(JSON.parse(raw)).toEqual({
      chatFontSizePx: 17,
      defaultProvider: "claudeAgent",
      sidebarProjectSortOrder: "created_at",
      sidebarThreadSortOrder: "updated_at",
    });
  });

  it("uses the server-owned thread mode when supplied", () => {
    expect(
      readSettingsGeneralProjection(
        JSON.stringify({ defaultThreadEnvMode: "local" }),
        "worktree",
      ).defaultThreadEnvMode,
    ).toBe("worktree");
  });

  it("round-trips Appearance through the canonical app and theme keys", () => {
    expect(THEME_STORAGE_KEY).toBe("synara:theme");
    const written = writeSettingsAppearanceProjection(
      JSON.stringify({ defaultProvider: "codex" }),
      null,
      {
        ...DEFAULT_SETTINGS_APPEARANCE_VALUES,
        themeMode: "dark",
        uiDensity: "compact",
      },
    );
    expect(JSON.parse(written.appSettingsRaw)).toMatchObject({
      defaultProvider: "codex",
      uiDensity: "compact",
    });
    expect(
      readSettingsAppearanceProjection(
        written.appSettingsRaw,
        written.themeRaw,
      ),
    ).toMatchObject({
      themeMode: "dark",
      uiDensity: "compact",
    });
  });

  it("round-trips Provider picker fields without touching unrelated app settings", () => {
    const raw = writeSettingsProviderPickerProjection(
      JSON.stringify({ chatFontSizePx: 17 }),
      {
        hiddenProviders: ["kilo"],
        providerOrder: [
          "kilo",
          ...DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES.providerOrder.filter(
            (provider) => provider !== "kilo",
          ),
        ],
      },
    );
    expect(JSON.parse(raw)).toMatchObject({
      chatFontSizePx: 17,
      hiddenProviders: ["kilo"],
    });
    const projected = readSettingsProviderPickerProjection(raw);
    expect(projected.hiddenProviders).toEqual(["kilo"]);
    expect(projected.providerOrder.slice(0, 2)).toEqual(["kilo", "codex"]);
  });
});
