import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Settings Skills fidelity", () => {
  it("routes the real Skills section and canonical RPCs", () => {
    const settingsSource = readFileSync(new URL("./SettingsPage.tsx", import.meta.url), "utf8");
    const panelSource = readFileSync(
      new URL("./SettingsSkillsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(settingsSource).toContain('"skills",');
    expect(settingsSource).toContain('section === "skills"');
    expect(settingsSource).toContain("<SettingsSkillsPanel />");
    expect(panelSource).toContain("useQuery(skillsCatalogQueryOptions())");
    expect(panelSource).toContain("useQuery(serverSettingsQueryOptions())");
    expect(panelSource).toContain("Synara skills folder");
    expect(panelSource).toContain("No skills found");
    expect(panelSource).toContain(
      'accessibility-label="No skills found. Add a skill folder containing a SKILL.md to the Synara skills folder above, or install skills for any supported provider."',
    );
  });

  it("optimistically toggles the canonical disabled-skill setting", () => {
    const panelSource = readFileSync(
      new URL("./SettingsSkillsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    // Behavior is covered by settingsSkillToggleQueue.logic.test.ts.
    expect(panelSource).toContain("createSkillToggleQueue({");
    expect(panelSource).toContain("projectDisabledSkillNames(");
    expect(panelSource).toContain("queueState.intents");
    expect(panelSource).toContain(
      "writeServerSettings(queryClient, { skills: { disabled: [...disabled] } })",
    );
    // No effect copies the settings query into local state any more.
    expect(panelSource).not.toContain("useEffect");
    expect(panelSource).toContain(
      "queryClient.invalidateQueries({ queryKey: providerDiscoveryQueryKeys.all })",
    );
    // The composer reads upstream's skill query, so there is no second key.
    expect(panelSource).not.toContain("LEGACY_COMPOSER_PROVIDER_SKILLS_QUERY_KEY");
  });

  it("matches the Web portable summary and grouped-row anatomy", () => {
    const source = readFileSync(new URL("./SettingsSkillsPanel.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./settings-skills-panel.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.SettingsSkillsPanel\s*\{[^}]*gap:\s*32px;/s);
    expect(styles).not.toMatch(
      /\.SettingsSkills(?:PortableRow|Row|EmptyRow)\s*\{[^}]*min-height:/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsPortableRow,\s*\.SettingsSkillsRow\s*\{[^}]*flex-direction:\s*column;/s,
    );
    expect(source).toContain('className="SettingsSkillsMetadata"');
    expect(source).toContain('className="SettingsSkillsMain SettingsSkillsMain--skill"');
    expect(source).toContain('className="SettingsSkillsMain SettingsSkillsMain--portable"');
    expect(source).toContain('className="SettingsSkillsMetadata SettingsSkillsMetadata--portable"');
    expect(source).toContain('className="SettingsSkillsControl SettingsSkillsControl--skill"');
    expect(source).toContain('" SettingsSkillsRow--continued"');
    expect(source).toContain("index < section.groups.length - 1");
    expect(styles).toMatch(
      /\.SettingsSkillsRow--continued\s*\{[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).not.toContain("SettingsSkillsRow--divided");
    expect(styles).toMatch(
      /\.SettingsSkillsMain\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*space-between;[^}]*gap:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsMetadata\s*\{[^}]*flex-direction:\s*column;[^}]*gap:\s*4px;[^}]*padding-top:\s*4px;/s,
    );
    expect(source).toContain('className="SettingsSkillsPortableTitleLine"');
    expect(styles).toMatch(/\.SettingsSkillsPortableTitleLine\s*\{[^}]*min-height:\s*20px;/s);
    expect(styles).toMatch(
      /\.SettingsSkillsTitleLine\s*\{[^}]*min-height:\s*21px;[^}]*gap:\s*6px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsCubeFace\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--muted-foreground\);[^}]*border-right-color:\s*var\(--muted-foreground\);[^}]*border-top-color:\s*var\(--muted-foreground\);[^}]*border-bottom-color:\s*var\(--muted-foreground\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsControl\s*\{[^}]*flex-shrink:\s*0;[^}]*align-items:\s*flex-end;/s,
    );
    expect(source).toContain("<SkillProviderStack providers={group.providers} />");
    expect(styles).toMatch(
      /\.SettingsSkillsProviderBadge\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--background\);[^}]*border-right-color:\s*var\(--background\);[^}]*border-top-color:\s*var\(--background\);[^}]*border-bottom-color:\s*var\(--background\);[^}]*border-radius:\s*8px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsProviderBadge \.OpenAIProviderIcon\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsSource\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsPath\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsSource,\s*\.SettingsSkillsPath,\s*\.SettingsSkillsSaving\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-xs, 11px\);[^}]*line-height:\s*16\.5px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsCount\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm, 12px\);[^}]*line-height:\s*16px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SettingsSkillsMain--portable,\s*\.SliceRoot--viewport-compact \.SettingsSkillsMain--skill\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SettingsSkillsMain--portable\s*\{[^}]*gap:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsSkillsMetadata--portable\s*\.SettingsSkillsPath\s*\{[^}]*height:\s*33px;[^}]*white-space:\s*normal;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SettingsSkillsControl--skill\s*\{[^}]*width:\s*100%;[^}]*align-items:\s*flex-start;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsGeneralSwitch\s*\{[^}]*width:\s*40px;[^}]*height:\s*24px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsGeneralSwitchThumb\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s,
    );
  });
});
