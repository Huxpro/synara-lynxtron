import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  PullRequestListEmptyElement,
  PullRequestListGroupTitleElement,
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
      /\.SharedPrEmpty\s*\{[^}]*width:\s*100%;[^}]*padding:\s*48px 24px;/s
    );
    const baseEmptyRule = styles.match(/\.SharedPrEmpty\s*\{([^}]*)\}/s)?.[1];
    expect(baseEmptyRule).not.toContain('min-height:');
    expect(styles).toMatch(
      /\.SharedPrEmptyTitle\s*\{[^}]*font-size:\s*20px;[^}]*line-height:\s*28px;[^}]*font-weight:\s*600;/s
    );
    expect(styles).toMatch(
      /\.SharedPrEmptyDescription\s*\{[^}]*max-width:\s*384px;[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;[^}]*margin-top:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact\.SliceRoot--viewport-constrained-height\s+\.SharedPrEmpty\s*\{[^}]*min-height:\s*0;[^}]*margin-top:\s*-8px;[^}]*padding:\s*0;/s
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

  it('preserves Web group headings as Native headers', () => {
    render(
      <PullRequestListGroupTitleElement separated>
        Pinned
      </PullRequestListGroupTitleElement>
    );

    const title = elementTree.root?.querySelector('.SharedPrGroupTitle');
    expect(title?.getAttribute('accessibility-element')).toBe('true');
    expect(title?.getAttribute('accessibility-trait')).toBe('header');
    expect(title?.getAttribute('class')).toContain(
      'SharedPrGroupTitle--separated'
    );
  });
});
