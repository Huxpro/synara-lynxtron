import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Diff Dock chrome fidelity', () => {
  it('uses Web neutral hover material for close and retry controls', () => {
    const styles = readFileSync(
      new URL('./diff-dock.css', import.meta.url),
      'utf8'
    );

    for (const className of ['DiffDockClose', 'DiffDockRetry']) {
      expect(styles).toMatch(
        new RegExp(
          `\\.${className}\\.ui-hover,[^}]*\\{[^}]*background-color:\\s*var\\(--color-background-elevated-secondary\\);`,
          's'
        )
      );
    }
    expect(styles).not.toContain('background-color: var(--accent)');
  });

  it('fits standalone state feedback inside a short thread dock', () => {
    const styles = readFileSync(
      new URL('./diff-dock.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ThreadPage[\s\S]*?> \.DiffDock[\s\S]*?\.DiffDockState\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*100%;/s
    );
  });
});
