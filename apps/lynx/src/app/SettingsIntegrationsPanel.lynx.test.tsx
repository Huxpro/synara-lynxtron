import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings Integrations fidelity', () => {
  it('routes the real Integrations section and canonical RPCs', () => {
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const panelSource = readFileSync(
      new URL('./SettingsIntegrationsPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain("'integrations',");
    expect(settingsSource).toContain("section === 'integrations'");
    expect(settingsSource).toContain('<SettingsIntegrationsPanel />');
    expect(clientSource).toContain("'server.listExternalMcpIntegrations'");
    expect(clientSource).toContain("'server.createExternalMcpIntegration'");
    expect(clientSource).toContain("'server.revokeExternalMcpIntegration'");
    expect(clientSource).toContain("'server.refreshExternalMcpPairing'");
    expect(panelSource).toContain('Connect a coding agent');
    expect(panelSource).toContain('Connected agents');
    expect(panelSource).toContain('No connected agents');
    expect(panelSource).toContain('<CheckIcon size={12}');
    expect(panelSource).not.toContain('>✓<');
  });

  it('uses safe defaults and real setup, clipboard, resume, and revoke actions', () => {
    const panelSource = readFileSync(
      new URL('./SettingsIntegrationsPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(panelSource).toContain('buildExternalMcpCapabilities({');
    expect(panelSource).toContain('expiresInDays: 30');
    expect(panelSource).toContain('await createExternalMcpIntegration({');
    expect(panelSource).toContain('await revokeExternalMcpIntegration(');
    expect(panelSource).toContain('await refreshExternalMcpPairing(');
    expect(panelSource).toContain('await clipboard.writeText(');
    expect(panelSource).toContain(
      "queryClient.invalidateQueries({\n        queryKey: ['external-mcp-integrations']"
    );
  });

  it('matches Web form, setup, and connected-agent anatomy', () => {
    const styles = readFileSync(
      new URL('./settings-integrations-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SettingsIntegrationsPanel\s*\{[^}]*gap:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsRow,\s*\.SettingsIntegrationsConnection\s*\{[^}]*min-height:\s*79px;[^}]*justify-content:\s*space-between;/s
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsNameInput\s*\{[^}]*width:\s*256px;/s
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsConnectionActions\s*\{[^}]*width:\s*190px;/s
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsProject\s*\{[^}]*padding:\s*8px 12px;[^}]*border:\s*1px solid var\(--settings-project-border\);/s
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsProjectGrid\s*\{[^}]*flex-direction:\s*row;[^}]*flex-wrap:\s*wrap;/s
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsProject\s*\{[^}]*width:\s*calc\(50% - 4px\);/s
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsProject--checked\s*\{[^}]*border-color:\s*var\(--settings-project-selected-border\);[^}]*background-color:\s*var\(--settings-project-selected-surface\);/s
    );
    expect(styles).toMatch(
      /\.SettingsIntegrationsSetup,\s*\.SettingsIntegrationsEmpty\s*\{[^}]*min-height:\s*58px;/s
    );
  });
});
