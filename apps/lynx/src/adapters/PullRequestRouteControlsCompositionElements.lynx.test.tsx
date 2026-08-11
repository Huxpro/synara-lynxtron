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

  it('maps the Web search control to the shared Lynx input primitive', () => {
    const source = readFileSync(
      new URL(
        './PullRequestRouteControlsCompositionElements.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );
    const styles = readFileSync(
      new URL(
        './pull-request-route-controls-composition-elements.css',
        import.meta.url
      ),
      'utf8'
    );
    const routeSource = readFileSync(
      new URL('../app/FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain("import { Input } from '../components/ui/input';");
    expect(source).toContain('<SearchIcon size={14}');
    expect(source).toContain('className="SharedPrSearchInput"');
    expect(source).toContain('type="search"');
    expect(source).toContain('defaultValue={props.value}');
    expect(source).not.toContain('value={props.value}');
    expect(source).toContain(
      'onChange={(event) => props.onChange(event.target.value)}'
    );
    expect(source).toContain("if (event.key === 'Escape')");
    expect(styles).toMatch(
      /\.SharedPrSearchInput\s*\{[^}]*height:\s*28px;[^}]*padding-left:\s*32px;[^}]*border-radius:\s*10px;[^}]*font-size:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSearchIcon\s*\{[^}]*left:\s*10px;[^}]*top:\s*7px;[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*opacity:\s*0\.7;/s
    );
    expect(routeSource).toContain("const [searchQuery, setSearchQuery] = useState('')");
    expect(routeSource).toContain('searchQuery={searchQuery}');
    expect(routeSource).toContain('searchCapability="editable"');
    expect(routeSource).toContain('setSearchQuery(value)');
  });

  it('keeps unavailable search as plain muted text like Web', () => {
    const styles = readFileSync(
      new URL(
        './pull-request-route-controls-composition-elements.css',
        import.meta.url
      ),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedPrSearchUnavailable\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;/s
    );
    expect(styles).toMatch(
      /\.SharedPrSearchUnavailableText\s*\{[^}]*color:\s*var\(--muted-foreground\);[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(styles).not.toMatch(
      /\.SharedPrSearchUnavailable\s*\{[^}]*(?:border|border-radius|background-color|padding):/s
    );
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
