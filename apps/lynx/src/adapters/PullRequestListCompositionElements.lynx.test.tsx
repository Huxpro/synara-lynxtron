import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  PullRequestListEmptyElement,
  PullRequestListLoadingElement,
} from './PullRequestListCompositionElements.lynx';

describe('Pull Request list state fidelity', () => {
  it('matches the shared Empty vertical footprint and text measure', () => {
    render(
      <PullRequestListEmptyElement
        title="No pull requests found"
        description="Try another involvement, state, project, or search filter."
        intent="empty"
      />
    );

    const empty = elementTree.root?.querySelector('.SharedPrEmpty');
    expect(empty?.getAttribute('accessibility-label')).toBe(
      'No pull requests found. Try another involvement, state, project, or search filter.'
    );

    const styles = readFileSync(
      new URL('./pull-request-list-composition-elements.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.SharedPrEmpty\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*180px;[^}]*padding:\s*64px 24px;/s
    );
    expect(styles).toMatch(
      /\.SharedPrEmptyTitle\s*\{[^}]*font-size:\s*20px;[^}]*line-height:\s*28px;[^}]*font-weight:\s*600;/s
    );
    expect(styles).toMatch(
      /\.SharedPrEmptyDescription\s*\{[^}]*max-width:\s*384px;[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;[^}]*margin-top:\s*4px;/s
    );
  });

  it('uses the full shared muted surface for loading rows', () => {
    render(<PullRequestListLoadingElement rowCount={3} label="Loading pull requests" />);

    expect(elementTree.root?.querySelectorAll('.SharedPrLoadingRow')).toHaveLength(3);
    const loading = elementTree.root?.querySelector('.SharedPrLoading');
    expect(loading?.getAttribute('accessibility-label')).toBe('Loading pull requests');

    const styles = readFileSync(
      new URL('./pull-request-list-composition-elements.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.SharedPrLoadingRow\s*\{[^}]*height:\s*52px;[^}]*border-radius:\s*8px;[^}]*background-color:\s*var\(--muted\);/s
    );
    expect(styles).not.toMatch(
      /\.SharedPrLoadingRow\s*\{[^}]*opacity:/s
    );
  });
});
