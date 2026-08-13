import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx plugin library', () => {
  it('uses real provider discovery contracts', () => {
    const pageSource = readFileSync(
      new URL('./PluginLibraryPage.lynx.tsx', import.meta.url),
      'utf8'
    );
    const queriesSource = readFileSync(
      new URL('./queries.ts', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain('fetchPluginLibraryCapabilities');
    expect(pageSource).toContain('fetchPluginLibraryPlugins');
    expect(pageSource).toContain('fetchPluginLibrarySkills');
    expect(pageSource).toContain('.filter((plugin) => plugin.installed)');
    expect(pageSource).toContain('supportsPluginDiscovery');
    expect(pageSource).toContain('supportsSkillDiscovery');
    expect(pageSource).toContain("tab === 'plugins'");
    expect(pageSource).toContain("tab === 'skills'");
    expect(pageSource).toContain('Codex CLI is unavailable');
    expect(queriesSource).toContain(
      "fetchProviderComposerCapabilities('codex')"
    );
    expect(clientSource).toContain(
      "transportRequest<ProviderListPluginsResult>(\n    'provider.listPlugins'"
    );
  });

  it('is available through the Lynx memory router', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );
    expect(routerSource).toContain("pathname === '/plugins'");
    expect(routerSource).toContain(
      "route.pathname === '/plugins'"
    );
    expect(routerSource).toContain('<PluginLibraryPage />');
  });
});
