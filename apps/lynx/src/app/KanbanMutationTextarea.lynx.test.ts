import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Kanban mutation textarea layout', () => {
  it('compensates for the shadow textarea padding and border', () => {
    const styles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.KanbanMutationTextarea\s*\{[^}]*width:\s*calc\(100% - 22px\);[^}]*padding:\s*9px 10px;[^}]*border:\s*1px solid/s
    );
  });
});
