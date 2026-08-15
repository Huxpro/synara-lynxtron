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
    expect(pageSource).toContain('if (!plugin.installed) continue;');
    expect(pageSource).toContain('supportsPluginDiscovery');
    expect(pageSource).toContain('supportsSkillDiscovery');
    expect(pageSource).toContain(
      '(supported && (tab ==='
    );
    expect(pageSource).toContain(
      'are unavailable for ${PROVIDER_DISPLAY_NAMES[provider]}.'
    );
    expect(pageSource).toContain("tab === 'plugins'");
    expect(pageSource).toContain("tab === 'skills'");
    expect(pageSource).toContain('resolveProviderDiscoveryStatus');
    expect(pageSource).toContain("useState<ProviderKind>('codex')");
    expect(pageSource).toContain('DEFAULT_PROVIDER_ORDER.map');
    expect(pageSource).toContain('PROVIDER_DISPLAY_NAMES[provider]');
    expect(pageSource).toContain(
      'fetchPluginLibraryCapabilities(provider)'
    );
    expect(pageSource).toContain('fetchPluginLibraryPlugins(provider)');
    expect(pageSource).toContain('fetchPluginLibrarySkills(provider)');
    expect(queriesSource).toContain(
      'return fetchProviderComposerCapabilities(provider)'
    );
    expect(queriesSource).toContain(
      'return fetchProviderPlugins({ provider, cwd: config.cwd })'
    );
    expect(queriesSource).toContain(
      'return fetchProviderSkills({ provider, cwd: config.cwd })'
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
