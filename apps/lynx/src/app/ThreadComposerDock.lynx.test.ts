import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx thread composer dock fidelity', () => {
  const routerSource = readFileSync(new URL('./router.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');

  it('keeps normal thread composers above the window edge like Web', () => {
    expect(routerSource).toContain('<view className="ThreadComposerDock">{composer}</view>');
    expect(styles).toMatch(
      /\.ThreadComposerDock\s*\{[^}]*flex-shrink:\s*0;[^}]*padding-bottom:\s*16px;/s
    );
  });

  it('retains a compact inset for short-height threads', () => {
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.ThreadComposerDock\s*\{[^}]*padding-bottom:\s*8px;/s
    );
  });
});
