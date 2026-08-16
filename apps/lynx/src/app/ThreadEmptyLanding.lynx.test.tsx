import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('empty Thread landing fidelity', () => {
  it('centers the shared heading and composer as one stack', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    const emptyThreadBranch = routerSource.slice(
      routerSource.indexOf("bodyState.kind === 'empty' ? (")
    );
    expect(emptyThreadBranch).toContain('<CenteredEmptyLandingStack>');
    expect(routerSource).toContain(
      '<CenteredEmptyLanding projectName={currentThread?.project} />'
    );
    expect(routerSource).toContain('<EmptyThreadContextTray');
    expect(routerSource).toContain('{bodyState.kind === \'empty\' ? null : composer}');
    expect(routerSource).not.toContain(
      '<ChatEmptyStateHero projectName={currentThread?.project} />'
    );
  });

  it('uses a real project-context tray with route-owned temporary state', () => {
    const traySource = readFileSync(
      new URL('./EmptyThreadContextTray.lynx.tsx', import.meta.url),
      'utf8'
    );
    const lifecycleSource = readFileSync(
      new URL('./temporaryThreadLifecycle.lynx.ts', import.meta.url),
      'utf8'
    );
    const trayStyles = readFileSync(
      new URL('./empty-thread-context-tray.css', import.meta.url),
      'utf8'
    );

    expect(traySource).toContain("'aria-pressed': props.temporary");
    expect(traySource).toContain('onClick={props.onTemporaryChange}');
    expect(traySource).not.toContain('aria-disabled');
    expect(traySource).not.toContain(
      'accessibility-state={{ disabled: true }}'
    );
    expect(traySource).toContain(
      "props.envMode === 'local' ? 'Local' : 'Worktree'"
    );
    expect(traySource).toContain('props.branch ? (');
    expect(traySource).toContain('{props.branch}');
    expect(traySource).not.toContain("props.branch ?? 'main'");
    expect(lifecycleSource).toContain("type: 'thread.delete'");
    expect(lifecycleSource).toContain(
      'shouldDeleteDepartingTemporaryThread('
    );
    expect(trayStyles).toMatch(
      /\.EmptyThreadContextTray\s*\{[^}]*width:\s*calc\(100% - 24px\);[^}]*max-width:\s*736px;[^}]*min-height:\s*58px;[^}]*margin:\s*-20px auto 0;[^}]*padding:\s*24px 8px 6px;/s
    );
  });

  it('keeps project-specific heading copy on one line like Web', () => {
    const headingSource = readFileSync(
      new URL(
        '../adapters/CenteredEmptyLandingElements.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );
    const headingStyles = readFileSync(
      new URL(
        '../adapters/centered-empty-landing-elements.css',
        import.meta.url
      ),
      'utf8'
    );

    expect(headingSource).toContain(
      "projectName ? ' CenteredEmptyLandingHeading--project' : ''"
    );
    expect(headingStyles).toMatch(
      /\.CenteredEmptyLandingFrame\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*736px;[^}]*box-sizing:\s*border-box;[^}]*align-self:\s*center;/s
    );
    expect(headingStyles).toMatch(
      /\.CenteredEmptyLandingHeading--project\s*\{[^}]*width:\s*100%;/s
    );
    expect(headingStyles).toMatch(
      /\.SliceRoot--viewport-compact \.CenteredEmptyLandingHeading\s*\{[^}]*width:\s*calc\(100% - 48px\);/s
    );
  });

  it('prioritizes the composer in short Thread viewports', () => {
    const appStyles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );

    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+\.CenteredEmptyLandingFrame,[\s\S]*?\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+\.EmptyThreadContextTray\s*\{[^}]*display:\s*none;/s
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ProviderHealthBannerFrame\s*\{[^}]*display:\s*none;/s
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height \.ThreadPage\s*\{[^}]*--app-density-composer-editor-min-height:\s*20px;[^}]*--app-density-composer-editor-padding-top:\s*4px;[^}]*--app-density-composer-editor-padding-bottom:\s*2px;/s
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+\.TranscriptBottomInset\s*\{[^}]*height:\s*8px;/s
    );
    expect(appStyles).not.toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadsLanding\s+\.CenteredEmptyLandingFrame\s*\{[^}]*display:\s*none;/s
    );
  });
});
