import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx thread composer dock fidelity', () => {
  const routerSource = readFileSync(new URL('./router.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');
  const frameStyles = readFileSync(
    new URL(
      '../adapters/composer-column-frame-surface-elements.css',
      import.meta.url
    ),
    'utf8'
  );

  it('keeps normal thread composers above the window edge like Web', () => {
    expect(routerSource).toContain('<view className="ThreadComposerDock">{composer}</view>');
    expect(routerSource).toContain('className="ThreadPageMain"');
    expect(routerSource).toContain(
      '(threadPageWidth || viewportWidth) - effectiveRightDockWidth'
    );
    expect(styles).toMatch(
      /\.ThreadPageMain\s*\{[^}]*display:\s*flex;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*height:\s*100%;[^}]*flex-direction:\s*column;/s
    );
    expect(styles).toMatch(
      /\.ThreadComposerDock\s*\{[^}]*display:\s*flex;[^}]*width:\s*100%;[^}]*flex-shrink:\s*0;[^}]*padding-bottom:\s*16px;/s
    );
  });

  it('retains a compact inset for short-height threads', () => {
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.ThreadComposerDock\s*\{[^}]*padding-bottom:\s*8px;/s
    );
  });

  it('centers the shared 736px composer frame inside the full chat pane', () => {
    expect(routerSource).toContain(
      '<ComposerColumnFrameSurface>'
    );
    expect(frameStyles).toMatch(
      /\.ComposerColumnFrameSurfaceLynx\.ComposerColumnFrameSurfaceLynx\s*\{[^}]*width:\s*calc\(100% - 24px\);[^}]*max-width:\s*736px;[^}]*margin-left:\s*0;[^}]*margin-right:\s*0;[^}]*align-self:\s*center;/s
    );
  });
});
