import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Pull Request responsive layout', () => {
  it('projects detail-open state from the real selected pull request', () => {
    const source = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "selectedInput ? ' SharedPrRouteBody--detail-open' : ''"
    );
  });

  it('uses a single master-detail surface below the wide breakpoint', () => {
    const styles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SliceRoot--viewport-medium\s+\.SharedPrRouteBody--detail-open\s+\.SharedPrRouteScroller\s*\{[^}]*display:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-medium\s+\.SharedPrRouteBody--detail-open\s+\.SharedPrDetailDock\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*border-left-width:\s*0;/s
    );
  });

  it('keeps the Web-authority split contract for wide windows', () => {
    const styles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );
    const source = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedPrDetailDock\s*\{[^}]*width:\s*50%;[^}]*min-width:\s*416px;/s
    );
    expect(source).toContain('minWidth={416}');
    expect(source).not.toContain('pull_requests_detail_panel_width');
  });

  it('keeps compact route chrome below desktop titlebar controls', () => {
    const styles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.AppMain--sidebar-closed\s+\.SharedPrRouteHeader\s*\{[^}]*height:\s*92px;[^}]*padding:\s*46px 20px 0;/s
    );
    expect(styles).not.toMatch(
      /\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.SharedPrRouteHeader\s*\{[^}]*padding-left:\s*20px;/s
    );
  });
});
