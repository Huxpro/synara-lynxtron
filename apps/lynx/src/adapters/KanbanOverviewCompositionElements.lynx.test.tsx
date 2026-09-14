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
    expect(source).toContain('className="SharedKanbanOverviewNewTaskIcon"');
    expect(source).toContain("color={semanticIconColor('tertiary')}");
    expect(source).toContain("color={semanticIconColor('secondary')}");
    expect(source).not.toMatch(/[›＋]/);
    expect(styles).toMatch(
      /\.SharedKanbanOverviewProjectChevron\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*margin-left:\s*auto;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanOverviewProjectChevron\s*\{[^}]*opacity:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanOverviewProjectHeader\.ui-hover[^{]*\.SharedKanbanOverviewProjectChevron,[^{]*\.SharedKanbanOverviewProjectHeader\.ui-focus[^{]*\.SharedKanbanOverviewProjectChevron\s*\{[^}]*opacity:\s*1;/s
    );
  });

  it('matches Electron project-count and chevron semantic tones', () => {
    const styles = readFileSync(
      new URL('./kanban-overview-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedKanbanOverviewProjectCount\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--muted-foreground\) 70%, transparent\);/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanOverviewProjectChevron\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--muted-foreground\) 50%, transparent\);/s
    );
    expect(styles).not.toMatch(
      /\.SharedKanbanOverviewProjectTitle\s*\{[^}]*flex:\s*1;/s
    );
  });
});
