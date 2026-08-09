import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Kanban column icon fidelity', () => {
  it('uses real Plus and Web-matched status SVG identities', () => {
    const source = readFileSync(
      new URL('./KanbanColumnCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const statusSource = readFileSync(
      new URL('./KanbanStatusIcon.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./kanban-column-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      '<PlusIcon className="SharedKanbanColumnNewCardIcon" size={14} />'
    );
    expect(source).toContain('<KanbanStatusIcon column={props.column} />');
    expect(source).not.toMatch(/[＋✓◐◌]/);
    expect(statusSource).toContain(
      '<circle cx="7" cy="7" r="7" fill="#5e6ad2"/>'
    );
    expect(statusSource).toContain(
      '<path d="M7 3.5 A3.5 3.5 0 0 1 7 10.5 Z" fill="#f2c94c"/>'
    );
    expect(statusSource).toContain('stroke-dasharray="2 2.2"');
    expect(styles).toMatch(
      /\.SharedKanbanColumnStatusIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*margin-left:\s*6px;[^}]*flex-shrink:\s*0;/s
    );
  });
});
