import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Kanban project typography fidelity', () => {
  it('matches Web column title and count line boxes', () => {
    const styles = readFileSync(
      new URL('./kanban-column-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedKanbanColumnTitle\s*\{[^}]*font-size:\s*13px;[^}]*font-weight:\s*500;[^}]*line-height:\s*19\.5px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanColumnCount\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanColumnHeader\s*\{[^}]*height:\s*32px;[^}]*gap:\s*8px;[^}]*padding:\s*0 6px 8px;/s
    );
  });

  it('matches Web card material and title identity', () => {
    const styles = readFileSync(
      new URL('./kanban-card-composition-elements.css', import.meta.url),
      'utf8'
    );
    const source = readFileSync(
      new URL('./KanbanCardCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedKanbanCard\s*\{[^}]*gap:\s*6px;[^}]*padding:\s*10px 12px;[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardTitle\s*\{[^}]*font-size:\s*13px;[^}]*font-weight:\s*500;[^}]*line-height:\s*17\.875px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardActionsText\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardMetaText,[\s\S]*\.SharedKanbanCardWorking\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardMetaRow\s*\{[^}]*margin-top:\s*0;[^}]*padding-top:\s*2px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardBranch\s*\{[^}]*gap:\s*4px;/s
    );
    expect(source).toContain(
      '<GitBranchIcon className="SharedKanbanCardBranchIcon" size={12} />'
    );
  });
});
