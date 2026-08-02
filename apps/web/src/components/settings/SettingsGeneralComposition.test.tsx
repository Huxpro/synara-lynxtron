import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { SettingsGeneralComposition } from "./SettingsGeneralComposition";
import {
  SETTINGS_GENERAL_SECTIONS,
  settingsGeneralValuesEqual,
  type SettingsGeneralValues,
} from "./SettingsGeneralComposition.logic";

const defaults: SettingsGeneralValues = {
  defaultProvider: "codex",
  defaultThreadEnvMode: "local",
  sidebarProjectSortOrder: "manual",
  sidebarThreadSortOrder: "updated_at",
  showChatsSection: true,
  showStudioSection: true,
  showWorkspaceSection: false,
  environmentPanelDefaultOpen: false,
  showEnvironmentUsage: true,
  showEnvironmentRepository: true,
  showEnvironmentPullRequest: true,
  showEnvironmentEditor: true,
  showEnvironmentRecap: true,
  showEnvironmentPinned: true,
  showEnvironmentMarkers: true,
  showEnvironmentInstructions: true,
  showEnvironmentNotepad: true,
};

describe("SettingsGeneralComposition", () => {
  it("owns every canonical General section and row in order", () => {
    expect(SETTINGS_GENERAL_SECTIONS.map((section) => section.title)).toEqual([
      "Core defaults",
      "Sidebar organization",
      "Sidebar sections",
      "Environment panel",
    ]);
    expect(SETTINGS_GENERAL_SECTIONS.flatMap((section) => section.rows)).toHaveLength(17);
  });

  it("renders canonical copy and changed-row reset availability", () => {
    const markup = renderToStaticMarkup(
      <SettingsGeneralComposition
        values={{ ...defaults, showChatsSection: false }}
        defaults={defaults}
        onChange={vi.fn()}
      />,
    );
    expect(markup).toContain("Choose the provider used for new chats.");
    expect(markup).toContain("Show the Workspace tab in the sidebar switcher.");
    expect(markup).toContain("Reset chats section to default");
    expect(markup).not.toContain("Reset studio section to default");
  });

  it("compares every shared row against its default", () => {
    expect(settingsGeneralValuesEqual(defaults, defaults)).toBe(true);
    expect(
      settingsGeneralValuesEqual(
        { ...defaults, environmentPanelDefaultOpen: true },
        defaults,
      ),
    ).toBe(false);
  });
});
