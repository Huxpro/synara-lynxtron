import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Kanban overview fidelity', () => {
  it('matches the Web empty-state width and text rhythm', () => {
    const styles = readFileSync(
      new URL('./kanban-overview-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedKanbanOverviewEmptyCopy\s*\{[^}]*width:\s*384px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanOverviewEmptyTitle\s*\{[^}]*font-size:\s*14px;[^}]*font-weight:\s*500;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanOverviewEmptyBody\s*\{[^}]*margin-top:\s*4px;[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s
    );
  });
});
