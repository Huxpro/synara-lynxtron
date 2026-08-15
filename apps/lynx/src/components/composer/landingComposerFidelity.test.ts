import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('landing composer fidelity contract', () => {
  it('uses the shared Web landing stack and composer frame without duplicate spacing', () => {
    const routerSource = readFileSync(
      new URL('../../app/router.tsx', import.meta.url),
      'utf8'
    );
    const landingStyles = readFileSync(
      new URL('./landing-composer.css', import.meta.url),
      'utf8'
    );
    const appStyles = readFileSync(
      new URL('../../app/App.css', import.meta.url),
      'utf8'
    );
    const frameStyles = readFileSync(
      new URL(
        '../../adapters/composer-column-frame-surface-elements.css',
        import.meta.url
      ),
      'utf8'
    );
    const landingSource = readFileSync(
      new URL('./LandingComposer.lynx.tsx', import.meta.url),
      'utf8'
    );
    const composerSource = readFileSync(
      new URL('./Composer.lynx.tsx', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const sidebarPrimaryActionStyles = readFileSync(
      new URL(
        '../../adapters/sidebar-primary-action-elements.css',
        import.meta.url
      ),
      'utf8'
    );
    const sidebarSource = readFileSync(
      new URL('../sidebar/Sidebar.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(routerSource).toContain('<CenteredEmptyLandingStack>');
    expect(routerSource).toContain(
      'projectName={routePresentation.projectName}'
    );
    expect(routerSource).toContain(
      'title={routePresentation.headerTitle}'
    );
    expect(routerSource).toContain('<ComposerColumnFrameSurface>');
    expect(routerSource).toContain('<LandingComposer');
    expect(routerSource).toContain(
      '<scroll-view\n        className="ThreadsLandingBody"\n        scroll-orientation="vertical"'
    );
    expect(routerSource).toContain(
      '<view className="ThreadsLandingBodyInner">'
    );
    expect(appStyles).toMatch(
      /\.ThreadsLandingBody\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;/s
    );
    expect(appStyles).toMatch(
      /\.ThreadsLandingBodyInner\s*\{[^}]*min-height:\s*100%;[^}]*align-items:\s*center;/s
    );
    expect(routerSource).toContain(
      'initialProjectId={props.initialProjectId}'
    );
    expect(landingSource).toContain('<ComposerProjectPickerComposition');
    expect(landingSource).toContain('draftId="lynx-landing-draft"');
    expect(landingSource).toContain('buildComposerProjectPickerModel');
    expect(landingSource).toContain("'Search folders'");
    expect(landingSource).toContain("'Search projects'");
    expect(landingSource).toContain("\"Don't use a folder\"");
    expect(landingSource).toContain("\"Don't work in a project\"");
    expect(landingSource).toContain("'Use a folder'");
    expect(landingSource).toMatch(
      /if \(props\.containerKind === 'studio'\) \{\s+setStudioFolderPath\(option\.workspaceRoot\);/
    );
    expect(landingSource).toMatch(
      /if \(props\.containerKind === 'studio'\) \{\s+setStudioFolderPath\(workspaceRoot\);/
    );
    expect(landingSource).toContain(
      'worktreePath: workspaceContext.worktreePath'
    );
    expect(landingSource).toContain('localFoldersError');
    expect(landingSource.match(/serverConfig:\s*config/g)).toHaveLength(3);
    expect(clientSource).toContain(
      "return transportRequest('server.refreshProviders', {});"
    );
    expect(clientSource).toContain(
      'export async function fetchFreshServerConfig()'
    );
    expect(clientSource).toContain('providers: providerStatuses.providers');
    expect(landingSource).toContain('fetchFreshServerConfig()');
    expect(landingSource).toContain('fetchServerSettings().catch(() => null)');
    expect(landingSource).toContain(
      'serverSettings?.defaultThreadEnvMode'
    );
    expect(landingSource).toContain(
      'export async function loadLandingBootstrap('
    );
    expect(routerSource).toContain(
      'const initialModelProvider = resolveLandingModelProvider('
    );
    expect(landingSource).toContain(
      "'landing-composer-bootstrap',\n      initialModelProvider,"
    );
    expect(routerSource).toContain(
      "'landing-composer-bootstrap',\n      initialModelProvider,"
    );
    expect(landingSource).toContain(
      'loadLandingBootstrap(\n        initialModelProvider,'
    );
    expect(routerSource).toContain(
      'initialModelProvider={initialModelProvider}'
    );
    expect(routerSource).toContain(
      'landingBootstrap?.serverConfig.providers ?? []'
    );
    expect(landingSource).toContain('initialModelCatalog,');
    expect(landingSource).toContain(
      'initialModelCatalog={data.initialModelCatalog}'
    );
    expect(landingSource).toContain(
      'props.initialModelProvider ?? generalSettings.defaultProvider'
    );
    expect(landingSource).toContain(
      'provider: initialModelProvider'
    );
    expect(landingSource).toContain(
      'model: getDefaultModel(initialModelProvider)'
    );
    expect(landingSource).toContain(
      'envMode: data.generalSettings.defaultThreadEnvMode'
    );
    expect(landingSource).not.toContain("envMode: 'local'");
    expect(landingSource).not.toContain("provider: 'codex'");
    expect(landingSource).not.toContain("getDefaultModel('codex')");
    expect(landingSource).not.toContain('onProviderStatusesChange');
    expect(composerSource).toContain('fetchFreshServerConfig()');
    expect(landingSource).toContain('onRetry=');
    expect(landingSource).not.toContain('.catch(() => [])');
    expect(landingSource).not.toContain('<MenuItem');
    expect(landingSource).not.toContain('<MenuPopup');
    expect(composerSource).toContain(
      'const { resolvedTheme, svgColors } = useTheme()'
    );
    expect(composerSource).not.toContain('resolvedTheme="light"');
    expect(sidebarPrimaryActionStyles).toMatch(
      /\.SharedSidebarPrimaryActionLabel\s*\{[^}]*font-size:\s*var\(--app-font-size-ui,\s*12px\);[^}]*line-height:\s*18px;[^}]*font-weight:\s*400;[^}]*opacity:\s*0\.89;/s
    );
    expect(sidebarPrimaryActionStyles).toMatch(
      /\.SharedSidebarPrimaryActionLeading\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*opacity:\s*0\.89;/s
    );
    expect(sidebarPrimaryActionStyles).toMatch(
      /\.AppSidebarFooter \.SharedSidebarPrimaryActionLeading\s*\{[^}]*opacity:\s*0\.95;/s
    );
    expect(sidebarSource).not.toContain(
      '<text className="AppSidebarNavGlyph">⚙</text>'
    );
    expect(sidebarSource).toContain(
      '<SettingsIcon className="AppSidebarSettingsIcon" size={15} />'
    );
    expect(landingStyles).not.toMatch(
      /\.LandingComposerTray\s*\{[^}]*z-index:/s
    );
    expect(routerSource).toContain(
      'onThreadCreated={props.onThreadCreated}'
    );
    expect(landingSource).toContain(
      'onSetInteractionMode={setInteractionMode}'
    );
    expect(landingSource).toContain('interactionMode={interactionMode}');
    expect(landingStyles).not.toMatch(/\.LandingComposer\s*\{[^}]*margin-top:/s);
    expect(frameStyles).toMatch(
      /\.ComposerColumnFrameSurfaceLynx[^}]*width:\s*calc\(100% - 24px\);[^}]*max-width:\s*736px;/s
    );
  });

  it('keeps Native typography corrections named and Browser-neutral', () => {
    const appStyles = readFileSync(
      new URL('../../app/App.css', import.meta.url),
      'utf8'
    );
    const headingStyles = readFileSync(
      new URL(
        '../../adapters/centered-empty-landing-elements.css',
        import.meta.url
      ),
      'utf8'
    );
    const webHostSource = readFileSync(
      new URL('../../main/web/web-host.ts', import.meta.url),
      'utf8'
    );

    expect(appStyles).toMatch(
      /\.SliceRoot\s*\{[^}]*--type-ui-row-size:\s*12px;/s
    );
    expect(appStyles).toMatch(
      /\.SliceRoot\s*\{[^}]*--type-composer-editor-size:\s*12px;/s
    );
    expect(headingStyles).toContain(
      'var(--engine-landing-heading-letter-spacing, -1.8px)'
    );
    expect(webHostSource).toContain(
      "'--engine-landing-heading-letter-spacing'"
    );
    expect(webHostSource).toContain("'-0.45px'");
  });
});
