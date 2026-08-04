import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Kanban route header fidelity', () => {
  it('uses the shared 24px rail and 46px header height', () => {
    const styles = readFileSync(
      new URL('./kanban-route-header-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedKanbanRouteHeader\s*\{[^}]*height:\s*46px;[^}]*padding:\s*0 24px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanRouteHeaderRow\s*\{[^}]*height:\s*46px;/s
    );
  });
});
