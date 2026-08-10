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
});
