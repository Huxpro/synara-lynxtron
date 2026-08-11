import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Pull Request pin recovery fidelity', () => {
  it('retains the failed entry and exposes a real mutation retry', () => {
    const source = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('const pinErrorMessage =');
    expect(source).toContain(
      'Could not update pull request pin. {pinErrorMessage}'
    );
    expect(source).toContain(
      'disabled={pinMutation.isPending || !pinMutation.variables}'
    );
    expect(source).toContain('pinMutation.mutate(pinMutation.variables);');
    expect(source).not.toContain(
      'Pin update failed. Refresh and try again.'
    );
  });

  it('uses the shared destructive recovery callout anatomy', () => {
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');

    expect(styles).toMatch(
      /\.SharedPrMutationRecovery\s*\{[^}]*gap:\s*8px;[^}]*margin-bottom:\s*12px;[^}]*padding:\s*8px 10px;[^}]*border:\s*1px solid var\(--pr-comment-error-border\);[^}]*border-radius:\s*8px;[^}]*background-color:\s*var\(--pr-comment-error-surface\);/s
    );
    expect(styles).toMatch(
      /\.SharedPrMutationError\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;[^}]*color:\s*var\(--destructive\);[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s
    );
  });
});
