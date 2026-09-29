import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Settings Integrations fidelity", () => {
  it("routes the real Integrations section and canonical RPCs", () => {
    const settingsSource = readFileSync(new URL("./SettingsPage.tsx", import.meta.url), "utf8");
    const clientSource = readFileSync(
      new URL("../data/synaraClient.lynx.ts", import.meta.url),
      "utf8",
    );
    const panelSource = readFileSync(
      new URL("./SettingsIntegrationsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(settingsSource).toContain('"integrations",');
    expect(settingsSource).toContain('section === "integrations"');
    expect(settingsSource).toContain("<SettingsIntegrationsPanel />");
    expect(clientSource).toContain('"server.listExternalMcpIntegrations"');
    expect(clientSource).toContain('"server.createExternalMcpIntegration"');
    expect(clientSource).toContain('"server.revokeExternalMcpIntegration"');
    expect(clientSource).toContain('"server.refreshExternalMcpPairing"');
    expect(panelSource).toContain("Connect a coding agent");
    expect(panelSource).toContain("Connected agents");
    expect(panelSource).toContain("No connected agents");
    expect(panelSource).toContain(
      'accessibility-label="No connected agents. Connect Codex, Claude, or another local MCP agent to create and follow Synara tasks."',
    );
    expect(panelSource).toContain(
      'import { CheckboxIndicator } from "../components/ui/checkbox.lynx";',
    );
    expect(panelSource).toContain("<CheckboxIndicator checked={props.checked}");
    expect(panelSource).not.toContain(">✓<");
    expect(panelSource).toContain('accessibility-role="checkbox"');
    expect(panelSource).toContain("accessibility-state={{ checked: props.checked }}");
    expect(panelSource).toContain("useLynxDisclosurePresence(!allProjects)");
    expect(panelSource).toContain("useLynxDisclosurePresence(advancedOpen)");
    expect(panelSource).toContain("disclosureContentClassName(");
    expect(panelSource).toContain("disclosureChevronClassName(");
    expect(panelSource).toContain("aria-expanded={advancedOpen}");
    expect(panelSource).toContain('"accessibility-value": advancedOpen');
    expect(panelSource).toContain('? "Expanded"');
    expect(panelSource).toContain(': "Collapsed"');
    expect(panelSource).toContain('<text className="LxButton__text">Review</text>');
  });

  it("uses safe defaults and real setup, clipboard, resume, and revoke actions", () => {
    const panelSource = readFileSync(
      new URL("./SettingsIntegrationsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(panelSource).toContain("buildExternalMcpCapabilities({");
    expect(panelSource).toContain("expiresInDays: 30");
    expect(panelSource).toContain("await createExternalMcpIntegration({");
    expect(panelSource).toContain("await revokeExternalMcpIntegration(");
    expect(panelSource).toContain("await refreshExternalMcpPairing(");
    expect(panelSource).toContain("await copyIntegrationText({");
    expect(panelSource).toContain("writeText: clipboard.writeText");
    for (const successMessage of [
      "Setup prompt copied.",
      "Pairing command copied.",
      "Configuration copied.",
      "Example prompt copied.",
    ]) {
      expect(panelSource).toContain(successMessage);
    }
    expect(panelSource).toContain('from "@synara-web/components/settings/externalMcpSetup"');
    expect(panelSource).toContain("buildExternalMcpClientConfiguration(");
    expect(panelSource).toContain("buildExternalMcpExamplePrompt(");
    expect(panelSource).toContain("buildExternalMcpSetupPrompt(");
    expect(panelSource).toContain("externalMcpSetupAction({");
    expect(panelSource).toContain(
      `queryClient.invalidateQueries({
        queryKey: ["external-mcp-integrations"]`,
    );
  });

  it("matches Web form, setup, and connected-agent anatomy", () => {
    const styles = readFileSync(
      new URL("./settings-integrations-panel.css", import.meta.url),
      "utf8",
    );
    const panelSource = readFileSync(
      new URL("./SettingsIntegrationsPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(/\.SettingsIntegrationsPanel\s*\{[^}]*gap:\s*24px;/s);
    expect(panelSource).toContain('className="SettingsIntegrationsTitleLine"');
    expect(panelSource).toContain("SettingsIntegrationsRow--continued");
    expect(styles).toMatch(/\.SettingsIntegrationsTitleLine\s*\{[^}]*min-height:\s*20px;/s);
    expect(styles).toMatch(/\.SettingsIntegrationsRowTitle,[^}]*\{[^}]*font-weight:\s*500;/s);
    expect(styles).toMatch(
      /\.SettingsIntegrationsRow--continued\s*\{[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).not.toContain("SettingsIntegrationsRow--divided");
    expect(styles).toMatch(
      /\.SettingsIntegrationsRow,\s*\.SettingsIntegrationsConnection\s*\{[^}]*justify-content:\s*space-between;/s,
    );
    expect(styles).not.toMatch(
      /\.SettingsIntegrationsRow,\s*\.SettingsIntegrationsConnection\s*\{[^}]*min-height:/s,
    );
    expect(styles).toMatch(/\.SettingsIntegrationsNameInput\s*\{[^}]*width:\s*100%;/s);
    expect(panelSource).toContain('accessibility-label="Connection name"');
    expect(panelSource).toContain("<Input\n              nativeInput");
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SettingsIntegrationsNameInput\s*\{[^}]*width:\s*256px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsConnection\s*\{[^}]*align-items:\s*flex-start;[^}]*gap:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsConnectionActions\s*\{[^}]*flex-shrink:\s*0;[^}]*justify-content:\s*flex-end;[^}]*margin-top:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsProject\s*\{[^}]*padding:\s*8px 12px;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--settings-project-border\);[^}]*border-right-color:\s*var\(--settings-project-border\);[^}]*border-top-color:\s*var\(--settings-project-border\);[^}]*border-bottom-color:\s*var\(--settings-project-border\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsProjectGrid\s*\{[^}]*flex-direction:\s*row;[^}]*flex-wrap:\s*wrap;/s,
    );
    expect(styles).toMatch(/\.SettingsIntegrationsProject\s*\{[^}]*width:\s*100%;/s);
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SettingsIntegrationsProject\s*\{[^}]*width:\s*calc\(50% - 4px\);/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SettingsIntegrationsRow\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsProject--checked\s*\{[^}]*border-left-color:\s*var\(--settings-project-selected-border\);[^}]*border-right-color:\s*var\(--settings-project-selected-border\);[^}]*border-top-color:\s*var\(--settings-project-selected-border\);[^}]*border-bottom-color:\s*var\(--settings-project-selected-border\);[^}]*background-color:\s*var\(--settings-project-selected-surface\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsDisclosureChevron\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsAdvanced\s*\{[^}]*padding-top:\s*12px;[^}]*border-top-width:\s*1px;[^}]*border-top-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*gap:\s*16px;/s,
    );
    expect(styles).not.toMatch(
      /\.SettingsIntegrationsSetup,\s*\.SettingsIntegrationsEmpty\s*\{[^}]*min-height:/s,
    );
    expect(panelSource).toContain("1. Give your agent this prompt");
    expect(panelSource).toContain("Set up by hand instead");
    expect(panelSource).toContain("Pairing command (run in Terminal)");
    expect(panelSource).toContain("MCP configuration (JSON)");
    expect(panelSource).toContain("2. Try it");
    expect(panelSource).toContain("Copy example prompt");
    expect(panelSource).toContain(
      'className="SettingsIntegrationsCodeBlock SettingsIntegrationsSetupPrompt"',
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsSetupRow\s*\{[^}]*justify-content:\s*space-between;[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsCodeBlock,\s*\.SettingsIntegrationsExample\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-left-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(/\.SettingsIntegrationsCodeBlock\s*\{[^}]*height:\s*192px;/s);
    expect(styles).toMatch(/\.SettingsIntegrationsSetupPrompt\s*\{[^}]*height:\s*256px;/s);
    expect(styles).toMatch(
      /\.SettingsIntegrationsSetupRow--stacked\s*>\s*\.SettingsIntegrationsRowCopy\s*\{[^}]*flex:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsManual\s*\{[^}]*padding-top:\s*12px;[^}]*border-top-width:\s*1px;[^}]*border-top-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*gap:\s*12px;/s,
    );
    expect(styles).toMatch(/\.SettingsIntegrationsSetupActionRow\s*\{[^}]*margin-top:\s*10px;/s);
  });
});
