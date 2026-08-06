import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('pull request route controls fidelity', () => {
  it('matches the Web title, pill, and project-filter anatomy', () => {
    const styles = readFileSync(
      new URL(
        './pull-request-route-controls-composition-elements.css',
        import.meta.url
      ),
      'utf8'
    );
    const source = readFileSync(
      new URL(
        './PullRequestRouteControlsCompositionElements.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedPrRouteHeaderTitle\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;[^}]*font-weight:\s*500;/s
    );
    expect(styles).toMatch(
      /\.SharedPrFilterPill\s*\{[^}]*padding:\s*4px 10px;[^}]*border-radius:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SharedPrRouteRefresh\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*border-width:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SharedPrProjectFilterTrigger\s*\{[^}]*width:\s*24px;[^}]*min-width:\s*24px;[^}]*height:\s*24px;[^}]*min-height:\s*24px;[^}]*padding:\s*4px;[^}]*border-width:\s*0;[^}]*border-radius:\s*6px;/s
    );
    expect(source).toContain(
      "import filterSvg from '@synara-central-icons/filter-2.svg?raw';"
    );
    expect(source).toContain('<MenuTrigger ariaLabel={triggerLabel}>');
    expect(source).toContain("'aria-pressed': active");
    expect(source).toContain(
      "'accessibility-state': { selected: active }"
    );
    expect(source).toContain('className="SharedPrProjectFilterIconSlot"');
    expect(source).toContain('className="SharedPrProjectFilterIcon"');
    expect(source).toContain('className="SharedPrProjectFilterDot"');
    expect(source).not.toContain('{selectedName}</Button>');
    expect(source).toContain('<RefreshCwIcon');
    expect(source).not.toContain("{props.refreshing ? '…' : '↻'}");
  });

  it('preserves the honest search capability delta', () => {
    const source = readFileSync(
      new URL(
        './PullRequestRouteControlsCompositionElements.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );

    expect(source).toContain('Search unavailable in this runtime');
  });

  it('uses the Web route inset instead of a local filter offset', () => {
    const appStyles = readFileSync(
      new URL('../app/App.css', import.meta.url),
      'utf8'
    );

    expect(appStyles).toMatch(
      /\.FeaturePageInner--pullRequests\s*\{[^}]*padding:\s*16px 28px 48px;/s
    );
  });
});
