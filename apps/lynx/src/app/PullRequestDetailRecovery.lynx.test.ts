import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Pull Request detail recovery fidelity', () => {
  it('reuses the recoverable unavailable surface in the detail dock', () => {
    const source = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('isFetching: selectedDetailFetching');
    expect(source).toMatch(
      /selectedDetailError \? \(\s*<PullRequestsUnavailableState\s+error=\{selectedDetailError\}\s+retrying=\{selectedDetailFetching\}\s+onRetry=\{\(\) => void refetchSelectedDetail\(\)\}/s
    );
    expect(source).not.toContain(
      'The detail could not be loaded. Close the panel and try again.'
    );
  });

  it('keeps the existing detail skeleton and code-specific recovery paths', () => {
    const source = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('rowCount={4}');
    expect(source).toContain('label="Loading pull request details…"');
    expect(source).toContain('retrying={selectedDiffFetching}');
    expect(source).toContain('onRetry={() => void refetchSelectedDiff()}');
  });
});
