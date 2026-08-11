import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Pull Request selection reset fidelity', () => {
  it('clears failed action recovery before switching detail identity', () => {
    const source = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );
    const selection = source.match(
      /const selectPullRequest = \(entry: PullRequestListEntry\) => \{([\s\S]*?)\n  \};/
    )?.[1];

    expect(selection).toBeDefined();
    expect(selection).toContain('setLastFailedAction(null);');
    expect(selection).toContain('setSelectedInput({');
    expect(selection!.indexOf('setLastFailedAction(null);')).toBeLessThan(
      selection!.indexOf('setSelectedInput({')
    );
    expect(selection).toContain('resetDetailUi();');
  });
});
