import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Kanban mutation form accessibility', () => {
  it('names task instructions and rename inputs explicitly', () => {
    const source = readFileSync(
      new URL('./useNativeKanbanCardActions.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toMatch(
      /mutationTarget\.action === 'start'\s*\? 'Task instructions'\s*: 'Task name'/
    );
    expect(source).toContain('accessibility-element');
    expect(source).toContain('aria-invalid={Boolean(mutationTarget.error)}');
    expect(source).toContain('accessibility-role="alert"');
    expect(source).toContain('readonly={mutationPending}');
  });
});
