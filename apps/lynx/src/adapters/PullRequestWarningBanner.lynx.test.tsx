import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { PullRequestWarningBanner } from './PullRequestWarningBanner.lynx';

describe('Pull Request warning banner fidelity', () => {
  it('announces a readable full-width amber status banner', () => {
    render(
      <PullRequestWarningBanner>
        Could not refresh pull request details. Showing saved data.
      </PullRequestWarningBanner>
    );

    const banner = elementTree.root?.querySelector('.SharedPrWarningBanner');
    expect(banner?.getAttribute('accessibility-label')).toBe(
      'Could not refresh pull request details. Showing saved data.'
    );
    expect(
      banner?.querySelector('.SharedPrWarningBannerText')?.textContent
    ).toBe('Could not refresh pull request details. Showing saved data.');

    const styles = readFileSync(
      new URL('./pull-request-warning-banner.css', import.meta.url),
      'utf8'
    );
    const appStyles = readFileSync(
      new URL('../app/App.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.SharedPrWarningBanner\s*\{[^}]*width:\s*100%;[^}]*padding:\s*8px 12px;[^}]*border-bottom:\s*1px solid var\(--pr-warning-border\);[^}]*background-color:\s*var\(--pr-warning-surface\);/s
    );
    expect(styles).toMatch(
      /\.SharedPrWarningBannerText\s*\{[^}]*color:\s*var\(--foreground\);[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s
    );
    expect(appStyles).toContain(
      '--pr-warning-surface: rgba(217, 119, 6, 0.04);'
    );
    expect(appStyles).toContain(
      '--pr-warning-border: rgba(245, 180, 74, 0.32);'
    );
  });

  it('keeps cached detail visible when only the background refresh failed', () => {
    const source = readFileSync(
      new URL('../app/FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('{selectedDetailError && selectedDetail ? (');
    expect(source).toContain(
      'Could not refresh pull request details. Showing saved data.'
    );
    expect(source).toContain(
      ') : selectedDetailError && !selectedDetail ? ('
    );
  });
});
