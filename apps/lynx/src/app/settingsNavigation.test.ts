import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import { resolveSettingsNavigationCompositionGroups } from "@synara-web/components/SettingsNavigationComposition.logic";
import { resolveSettingsPanelHeader } from "@synara-web/components/settings/SettingsPanelHeaderComposition.logic";
import { resolveThemePackEditorModel } from "@synara-web/components/settings/ThemePackEditorComposition.logic";
import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS_APPEARANCE_VALUES,
  DEFAULT_SETTINGS_GENERAL_VALUES,
  THEME_STORAGE_KEY,
  readSettingsAppearanceProjection,
  readSettingsBehaviorProjection,
  readSettingsGeneralProjection,
  readSettingsNotificationsProjection,
  readSettingsProviderPickerProjection,
  writeSettingsAppearanceProjection,
  writeSettingsBehaviorProjection,
  writeSettingsGeneralProjection,
  writeSettingsNotificationsProjection,
  writeSettingsProviderPickerProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import {
  DEFAULT_BEHAVIOR_SETTINGS_VALUES,
  behaviorSettingsValuesEqual,
} from "@synara-web/components/settings/SettingsBehaviorPanel.logic";
import {
  DEFAULT_NOTIFICATION_SETTINGS_VALUES,
  notificationSettingsValuesEqual,
} from "@synara-web/components/settings/SettingsNotificationsPanel.logic";
import {
  DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES,
  buildSettingsGitWritingModelOptions,
  readSettingsGitWritingModelValues,
} from "@synara-web/components/settings/SettingsGitWritingModelComposition.logic";
import {
  DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES,
  readSettingsProviderUpdateChecksValues,
} from "@synara-web/components/settings/SettingsProviderUpdateChecksComposition.logic";
import {
  DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES,
  moveSettingsProvider,
} from "@synara-web/components/settings/SettingsProviderPickerComposition.logic";
import {
  DEFAULT_THEME_STATE,
  resolveThemePack,
  updateChromeTheme,
} from "@synara-web/theme/theme.logic";
import { SETTINGS_NAV_ITEMS, SETTINGS_SECTION_IDS } from "@synara-web/settingsNavigation";

describe("shared settings navigation projection", () => {
  it("keeps the full canonical taxonomy available", () => {
    const groups = resolveSettingsNavigationCompositionGroups({
      activeSection: "appearance",
      availableSections: SETTINGS_SECTION_IDS,
    });

    expect(groups.map((group) => group.label)).toEqual([
      "Personal",
      "Integrations",
      "Coding",
      "System",
      "Archived",
    ]);
    const items = groups.flatMap((group) => group.items);
    expect([...items.map((item) => item.id)].sort()).toEqual([...SETTINGS_SECTION_IDS].sort());
    expect(items.every((item) => item.available)).toBe(true);
    expect(items.find((item) => item.id === "appearance")?.active).toBe(true);
  });

  it("gives every canonical section an explicit native renderer", () => {
    const source = readFileSync(new URL("./SettingsPage.tsx", import.meta.url), "utf8");
    // Electron's Computer use drives the desktop through its own native driver; Lynx lists
    // the section as unavailable until that capability is ported.
    const NATIVE_UNSUPPORTED_SECTIONS = new Set<string>(["computer"]);
    const ownerMarkers: Record<
      Exclude<(typeof SETTINGS_SECTION_IDS)[number], "computer">,
      string
    > = {
      general: "<SettingsGeneralComposition",
      profile: "<SettingsProfilePanel />",
      appearance: "<SettingsAppearanceComposition",
      notifications: "<SettingsNotificationsPanel",
      behavior: "<SettingsBehaviorPanel",
      appsnap: "<SettingsAppSnapPanel />",
      shortcuts: "<KeyboardShortcutsSettingsComposition",
      worktrees: "<SettingsWorktreesPanel />",
      archived: "<SettingsArchivedPanel />",
      models: "<SettingsGitWritingModelComposition",
      providers: "<SettingsProviderToolsPanel",
      skills: "<SettingsSkillsPanel />",
      usage: "<SettingsUsagePanel />",
      integrations: "<SettingsIntegrationsPanel />",
      advanced: "<SettingsAdvancedPanel />",
    };

    for (const section of SETTINGS_SECTION_IDS) {
      if (section === "computer" || NATIVE_UNSUPPORTED_SECTIONS.has(section)) continue;
      expect(source).toContain(`section === '${section}'`);
      expect(source).toContain(ownerMarkers[section]);
    }
    expect(source).toContain('section === "providers" ?');
    expect(source).toContain(") : null}");
    expect(source).toContain("renderResetAction={renderSettingsResetAction}");
    expect(source).toContain("<SettingsResetIcon />");
    expect(source).not.toContain("↶");
    expect(source).toContain(
      'activityStatus="In-app activity toasts are shown for off-screen chats."',
    );
    expect(source).toContain("disabled={notificationSupported !== true}");
    expect(source).toContain("onClick={sendTestNotification}");
    expect(source).toContain(
      "Desktop app notifications use your operating system notification center.",
    );
    expect(source).toMatch(
      /useEffect\(\(\) => \{\s*setSection\(initialSection\);\s*setPendingSearchTarget\(initialTarget\);\s*setSearchQuery\(''\);\s*\}, \[initialSection, initialTarget\]\);/s,
    );
    expect(source).toContain("onSelectSection={(nextSection) => onNavigate(nextSection)}");
    expect(source).toContain("onNavigate(entry.section, target)");
    expect(source).toContain("await runOnMainThread(scrollSettingsTargetOnMainThread)(targetId)");
    expect(source).toContain('target.invoke("scrollIntoView"');
    expect(source).toContain('id="settings-content-scroll"');
    expect(source).toContain("await sleepOnHost(100)");
    expect(source).toContain("for (let attempt = 0; attempt < 3; attempt += 1)");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(routerSource).toContain("history.push(settingsRouteLocation(section, target))");
    expect(routerSource).toContain("initialTarget={route.params.target ?? initialSettingsTarget}");
    expect(routerSource).toContain("setRoute(parseRoute(location.href))");
    expect(routerSource).toContain("<TaskCompletionToastHost");
    expect(routerSource).toContain("{taskCompletionToast}");
    expect(source).toContain("includeDesktopShellShortcuts");
    expect(source).toContain(
      '"Desktop app notifications use your operating system notification center."',
    );
    expect(source).toContain("showCodeThemeSelection={false}");
    expect(source).toContain("showFontSmoothing={false}");
    expect(source).toContain("showTimestampFormat={false}");
    const sidebarSource = readFileSync(
      new URL("../components/sidebar/Sidebar.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(sidebarSource).toContain(
      "Sidebar pointer/tap navigation remains available without shell",
    );
    expect(source).toMatch(
      /<SettingsGeneralBooleanControlElement\s+checked=\{checked\}\s+disabled/s,
    );
  });

  it("projects the real server provider update-check preference", () => {
    expect(readSettingsProviderUpdateChecksValues(null)).toEqual(
      DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES,
    );
    expect(
      readSettingsProviderUpdateChecksValues({
        enableProviderUpdateChecks: false,
      } as never),
    ).toEqual({ enableProviderUpdateChecks: false });
  });

  it("round-trips local Provider picker visibility/order without server availability flags", () => {
    const moved = moveSettingsProvider(DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES, "grok", "up");
    const raw = writeSettingsProviderPickerProjection(
      JSON.stringify({ defaultProvider: "codex" }),
      { ...moved, hiddenProviders: ["grok"] },
    );
    expect(readSettingsProviderPickerProjection(raw)).toMatchObject({
      hiddenProviders: ["grok"],
      providerOrder: moved.providerOrder,
    });
    expect(JSON.parse(raw)).not.toHaveProperty("providers");
  });

  it("projects real server Git writing model settings and configured models", () => {
    const selected = readSettingsGitWritingModelValues({
      textGenerationModelSelection: {
        provider: "droid",
        model: "openrouter/custom-model",
      },
    });
    const options = buildSettingsGitWritingModelOptions({
      selected,
      settings: {
        providers: {
          codex: { customModels: [] },
          cursor: { customModels: [] },
          droid: { customModels: ["openrouter/custom-model"] },
          opencode: { customModels: [] },
        },
      } as never,
    });
    expect(DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES.provider).toBe("codex");
    expect(options).toContainEqual({
      provider: "droid",
      model: "openrouter/custom-model",
      label: "Droid / openrouter/custom-model",
    });
  });

  it("uses the canonical route copy for the native panel header", () => {
    for (const id of ["general", "appearance", "shortcuts"] as const) {
      const item = SETTINGS_NAV_ITEMS.find((candidate) => candidate.id === id);
      expect(resolveSettingsPanelHeader(id)).toEqual({
        title: item?.label,
        description: item?.description,
      });
    }
  });

  it("uses the canonical app-settings key and preserves non-General fields", () => {
    const raw = writeSettingsGeneralProjection(JSON.stringify({ chatFontSizePx: 18 }), {
      ...DEFAULT_SETTINGS_GENERAL_VALUES,
      showStudioSection: false,
    });
    expect(APP_SETTINGS_STORAGE_KEY).toBe("synara:app-settings:v1");
    expect(JSON.parse(raw)).toMatchObject({
      chatFontSizePx: 18,
      showStudioSection: false,
    });
    expect(readSettingsGeneralProjection(raw, "worktree")).toMatchObject({
      defaultThreadEnvMode: "worktree",
      showStudioSection: false,
    });
  });

  it("round-trips Appearance through canonical app/theme storage", () => {
    const written = writeSettingsAppearanceProjection(
      JSON.stringify({ defaultProvider: "codex" }),
      null,
      {
        ...DEFAULT_SETTINGS_APPEARANCE_VALUES,
        themeMode: "dark",
        timestampFormat: "24-hour",
      },
    );
    expect(THEME_STORAGE_KEY).toBe("synara:theme");
    expect(
      readSettingsAppearanceProjection(written.appSettingsRaw, written.themeRaw),
    ).toMatchObject({
      themeMode: "dark",
      timestampFormat: "24-hour",
    });
  });

  it("round-trips local Behavior values while server streaming stays authoritative", () => {
    const raw = writeSettingsBehaviorProjection(JSON.stringify({ chatFontSizePx: 18 }), {
      ...DEFAULT_BEHAVIOR_SETTINGS_VALUES,
      diffWordWrap: true,
      confirmThreadArchive: true,
    });
    const projected = readSettingsBehaviorProjection(raw, false);

    expect(JSON.parse(raw)).toMatchObject({
      chatFontSizePx: 18,
      diffWordWrap: true,
      confirmThreadArchive: true,
    });
    expect(projected).toMatchObject({
      enableAssistantStreaming: false,
      diffWordWrap: true,
      confirmThreadArchive: true,
    });
    expect(behaviorSettingsValuesEqual(projected, DEFAULT_BEHAVIOR_SETTINGS_VALUES)).toBe(false);
  });

  it("round-trips local Notification values while preserving unrelated settings", () => {
    const raw = writeSettingsNotificationsProjection(JSON.stringify({ chatFontSizePx: 18 }), {
      enableTaskCompletionToasts: false,
      enableSystemTaskCompletionNotifications: true,
    });
    const projected = readSettingsNotificationsProjection(raw);

    expect(JSON.parse(raw)).toMatchObject({
      chatFontSizePx: 18,
      enableTaskCompletionToasts: false,
      enableSystemTaskCompletionNotifications: true,
    });
    expect(notificationSettingsValuesEqual(projected, DEFAULT_NOTIFICATION_SETTINGS_VALUES)).toBe(
      false,
    );
  });

  it("uses the shared editable theme-pack model and pure state mutation", () => {
    const next = updateChromeTheme(DEFAULT_THEME_STATE, "dark", {
      accent: "#123456",
    });
    const pack = resolveThemePack(next, "dark");
    const model = resolveThemePackEditorModel({
      variant: "dark",
      isActive: true,
      mode: "dark",
      pack,
    });

    expect(pack.theme.accent).toBe("#123456");
    expect(model.titleLabel).toBe("Dark theme");
    expect(model.contextLabel).toBe("This is the active theme right now.");
    expect(model.codeThemes.length).toBeGreaterThan(10);
  });
});
