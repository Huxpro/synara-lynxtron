import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('empty Thread landing fidelity', () => {
  it('centers the shared heading and composer as one stack', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(routerSource).toContain(
      "bodyState.kind === 'empty' ? (\n        <CenteredEmptyLandingStack>"
    );
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
    expect(traySource).toContain('accessibility-state={{ disabled: true }}');
    expect(traySource).toContain(
      "props.envMode === 'local' ? 'Local' : 'Worktree'"
    );
    expect(traySource).toContain('props.branch ?? \'main\'');
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
      /\.CenteredEmptyLandingHeading--project\s*\{[^}]*width:\s*400px;/s
    );
  });
});
