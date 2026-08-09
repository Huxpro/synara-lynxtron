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

  it('uses generated chevron and Plus identities for project actions', () => {
    const source = readFileSync(
      new URL('./KanbanOverviewCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./kanban-overview-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain('<ChevronRightIcon');
    expect(source).toContain(
      'className="SharedKanbanOverviewProjectChevron"'
    );
    expect(source).toContain(
      '<PlusIcon className="SharedKanbanOverviewNewTaskIcon" size={14} />'
    );
    expect(source).not.toMatch(/[›＋]/);
    expect(styles).toMatch(
      /\.SharedKanbanOverviewProjectChevron\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*margin-left:\s*auto;/s
    );
  });
});
