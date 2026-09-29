import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Settings load error semantics", () => {
  it("announces retained query failures without making loading states assertive", () => {
    for (const file of [
      "./SettingsProfilePanel.lynx.tsx",
      "./SettingsWorktreesPanel.lynx.tsx",
      "./SettingsSkillsPanel.lynx.tsx",
      "./SettingsArchivedPanel.lynx.tsx",
    ]) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      expect(source).toContain('accessibility-role="alert"');
    }
    for (const file of [
      "./SettingsProfilePanel.lynx.tsx",
      "./SettingsWorktreesPanel.lynx.tsx",
      "./SettingsArchivedPanel.lynx.tsx",
    ]) {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      expect(source).not.toMatch(/<view[^>]*accessibility-role="alert"[\s\S]{0,320}<Button/);
      expect(source).toMatch(/<text[\s\S]{0,140}accessibility-role="alert"/);
    }

    const combinedSource = [
      "./SettingsProfilePanel.lynx.tsx",
      "./SettingsWorktreesPanel.lynx.tsx",
      "./SettingsSkillsPanel.lynx.tsx",
      "./SettingsArchivedPanel.lynx.tsx",
    ]
      .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
      .join("\n");

    for (const loadingCopy of [
      "Loading local stats…",
      "Loading managed worktrees…",
      "Scanning skills…",
      "Loading archived threads…",
    ]) {
      const loadingIndex = combinedSource.indexOf(loadingCopy);
      expect(loadingIndex).toBeGreaterThan(-1);
      expect(combinedSource.slice(Math.max(0, loadingIndex - 180), loadingIndex)).not.toContain(
        'accessibility-role="alert"',
      );
    }
  });

  it("announces retained mutation failures without making success notices assertive", () => {
    const advancedSource = readFileSync(
      new URL("./SettingsAdvancedPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const integrationsSource = readFileSync(
      new URL("./SettingsIntegrationsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const providerToolsSource = readFileSync(
      new URL("./SettingsProviderToolsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const worktreesSource = readFileSync(
      new URL("./SettingsWorktreesPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(advancedSource).toContain(
      "accessibility-role={notice.intent === 'error' ? 'alert' : undefined}",
    );
    expect(integrationsSource).toContain(
      "accessibility-role={notice.intent === 'error' ? 'alert' : undefined}",
    );
    expect(integrationsSource).toContain("await copyIntegrationText({");
    expect(integrationsSource).toContain("successMessage: 'Setup prompt copied.'");
    expect(providerToolsSource).toMatch(
      /className="SettingsProviderToolsNotice"[\s\S]{0,120}accessibility-role="alert"/,
    );
    expect(worktreesSource).toMatch(
      /className="SettingsWorktreesDeleteError"[\s\S]{0,120}accessibility-role="alert"/,
    );
    const skillsSource = readFileSync(
      new URL("./SettingsSkillsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const archivedSource = readFileSync(
      new URL("./SettingsArchivedPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(skillsSource).toMatch(
      /className="SettingsSkillsSaveError"[\s\S]{0,120}accessibility-role="alert"/,
    );
    expect(archivedSource).toMatch(
      /className="SettingsArchivedRestoreError"[\s\S]{0,120}accessibility-role="alert"/,
    );
  });
});
