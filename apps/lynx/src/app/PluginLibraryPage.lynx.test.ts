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

  it('keeps closed-sidebar tabs outside the desktop titlebar control hit area', () => {
    const pageSource = readFileSync(
      new URL('./PluginLibraryPage.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./plugin-library-page.css', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain('className="PluginLibraryTabs"');
    expect(styles).toMatch(
      /\.PluginLibraryHeader\s*\{[^}]*height:\s*46px;[^}]*min-height:\s*46px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.PluginLibraryHeader,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.PluginLibraryHeader\s*\{[^}]*height:\s*92px;[^}]*flex-direction:\s*column;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.PluginLibraryTabs,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.PluginLibraryTabs\s*\{[^}]*height:\s*46px;[^}]*padding-left:\s*180px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.PluginLibraryProviders,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.PluginLibraryProviders\s*\{[^}]*width:\s*100%;[^}]*height:\s*46px;/s
    );
  });
});
