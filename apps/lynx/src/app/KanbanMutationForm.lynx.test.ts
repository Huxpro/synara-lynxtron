import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Kanban mutation form accessibility', () => {
  it('names task instructions and rename inputs explicitly', () => {
    const source = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "mutationTarget.action === 'start'\n                  ? 'Task instructions'\n                  : 'Task name'"
    );
    expect(source).toContain('accessibility-element');
    expect(source).toContain('aria-invalid={Boolean(mutationTarget.error)}');
    expect(source).toContain('readonly={mutationPending}');
  });
});
