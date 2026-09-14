import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { PluginLibraryWarning } from './PluginLibraryWarning.lynx';

describe('Lynx plugin library', () => {
  it('embeds warning paint in provider discovery warning SVGs', () => {
    render(<PluginLibraryWarning message="Marketplace unavailable" />);

    expect(
      elementTree.root
        ?.querySelector('.PluginLibraryWarningIcon')
        ?.getAttribute('content')
    ).toContain('stroke="#d97706"');
  });

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
    const warningSource = readFileSync(
      new URL('./PluginLibraryWarning.lynx.tsx', import.meta.url),
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
    expect(pageSource).toContain('providerPluginDiscoveryWarnings');
    expect(pageSource).toContain('plugins.data?.remoteSyncError ?? null');
    expect(pageSource).toContain('plugins.data?.marketplaceLoadErrors ?? []');
    expect(pageSource).toContain('<PluginLibraryWarning');
    expect(warningSource).toContain('className="PluginLibraryWarning"');
    expect(warningSource).toContain('color={svgColors.warning}');
    expect(pageSource).toContain("useState<ProviderKind>('codex')");
    expect(pageSource).toContain('DEFAULT_PROVIDER_ORDER.map');
    expect(pageSource).toContain('provider={candidate}');
    expect(pageSource).toContain('providerDiscoveryItemGradient(');
    expect(pageSource).toContain('providerDiscoveryItemRing(props.label, props.brandColor)');
    expect(pageSource).toContain('brandColor={plugin.interface?.brandColor}');
    expect(pageSource).toContain('className="PluginLibraryProviderLabel"');
    expect(pageSource).toContain('<ListChecksIcon');
    expect(pageSource).toContain('size={20}');
    expect(pageSource).toContain("color={semanticIconColor('inverse')}");
    expect(pageSource).not.toContain('color="rgba(255, 255, 255, 0.8)"');
    const iconsSource = readFileSync(
      new URL('../lib/icons.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(iconsSource).toContain('icon-tabler-list-check');
    expect(iconsSource).not.toContain('icon-tabler-checklist');
    expect(pageSource).toContain('className="PluginLibraryInstalled"');
    expect(pageSource).toContain('<PuzzleIcon');
    expect(pageSource).toContain("color={semanticIconColor('inverse')}");
    expect(pageSource).not.toContain('PluginLibraryRowStatus');
    expect(pageSource).toContain('className="PluginLibrarySectionTitle">Skills</text>');
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
    expect(pageSource).toContain("tab === 'plugins' ? ' PluginLibraryTab--active' : ''");
    expect(pageSource).toContain("tab === 'skills' ? ' PluginLibraryTab--active' : ''");
    expect(styles).toMatch(
      /\.PluginLibraryTabs\s*\{[^}]*gap:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryTab\.LxButton\s*\{[^}]*height:\s*40px;[^}]*border-bottom-width:\s*2px;[^}]*border-radius:\s*0;[^}]*background-color:\s*transparent;/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryTab--active\.LxButton\s*\{[^}]*border-bottom-color:\s*var\(--foreground\);/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryHeader\s*\{[^}]*gap:\s*12px;[^}]*height:\s*40px;[^}]*min-height:\s*40px;[^}]*padding:\s*0 24px;/s
    );
    expect(styles).not.toMatch(
      /(?:^|\n)\.PluginLibraryRows--skills\s*\{[^}]*padding-right:/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryRow\s*\{[^}]*min-height:\s*68px;/s
    );
    expect(styles).toMatch(
      /\.PluginLibrarySectionTitle\s*\{[^}]*margin-top:\s*-1px;[^}]*font-size:\s*15px;[^}]*line-height:\s*22\.5px;/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryInstalled\s*\{[^}]*border-color:\s*color-mix\(in srgb, var\(--border\) 40%, transparent\);[^}]*color:\s*color-mix\(in srgb, var\(--muted-foreground\) 60%, transparent\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.PluginLibraryRows--skills\s*\{[^}]*padding-right:\s*0;/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryContent\s*\{[^}]*gap:\s*0;[^}]*width:\s*100%;[^}]*padding:\s*44px 20px 56px;/s
    );
    expect(styles).not.toMatch(
      /\.PluginLibraryContent\s*\{[^}]*max-width:/s
    );
    expect(styles).toMatch(
      /\.PluginLibrarySearch\s*\{[^}]*max-width:\s*624px;[^}]*min-height:\s*32px;[^}]*margin-bottom:\s*23px;/s
    );
    expect(styles).toMatch(
      /\.PluginLibrarySearch \.LxInputControl,[\s\S]*?\.PluginLibrarySearch \.LxInput\s*\{[^}]*height:\s*30px;/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryProviderChoices \.LxButton\s*\{[^}]*flex-shrink:\s*0;[^}]*gap:\s*6px;[^}]*height:\s*28px;[^}]*padding:\s*0 10px;[^}]*border-width:\s*0;/s
    );
    expect(pageSource).toContain("PluginLibraryProviderChoice--active");
    expect(pageSource).toContain(
      'color={provider === candidate ? svgColors.surface : undefined}'
    );
    expect(styles).toMatch(
      /\.PluginLibraryProviderChoice--active\.LxButton,[\s\S]*?background-color:\s*var\(--foreground\);/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryProviderChoice--active\.LxButton \.PluginLibraryProviderLabel\s*\{[^}]*color:\s*var\(--color-background-surface\);/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryProviders\s*\{[^}]*flex:\s*none;[^}]*width:\s*max-content;[^}]*max-width:\s*100%;[^}]*padding:\s*2px;[^}]*border-width:\s*1px;[^}]*border-radius:\s*999px;/s
    );
    expect(styles).toMatch(
      /\.PluginLibraryProviderChoices\s*\{[^}]*gap:\s*0;/s
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
