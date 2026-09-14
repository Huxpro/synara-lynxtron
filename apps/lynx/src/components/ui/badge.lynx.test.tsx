import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';
import { render } from '@lynx-js/react/testing-library';

import { Badge } from './badge.lynx';

describe('Badge', () => {
  it('preserves each Electron status tone', () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    render(<><Badge variant="error">Error</Badge><Badge variant="info">Info</Badge><Badge variant="success">Ready</Badge><Badge variant="warning">Warning</Badge></>);
    const badges = elementTree.root?.querySelectorAll('.LxBadge') ?? [];
    expect(badges[0]?.getAttribute('style')).toContain('rgba(224, 46, 42, 0.08)');
    expect(badges[1]?.getAttribute('style')).toContain('rgba(1, 105, 204, 0.08)');
    expect(badges[2]?.getAttribute('style')).toContain('rgba(0, 162, 64, 0.08)');
    expect(badges[3]?.getAttribute('style')).toContain('rgba(217, 119, 6, 0.08)');
    expect(styles).not.toContain('LxBadge--success { background-color: color-mix');
    expect(styles).toMatch(/\.LxBadge--info \.LxBadge__text\s*\{[^}]*color:\s*var\(--info-foreground\);/s);
    expect(styles).toMatch(/\.LxBadge--success \.LxBadge__text\s*\{[^}]*color:\s*var\(--success\);/s);
    expect(styles).toMatch(/\.LxBadge--warning \.LxBadge__text\s*\{[^}]*color:\s*var\(--warning\);/s);
    expect(styles).toMatch(/\.LxBadge--destructive \.LxBadge__text\s*\{[^}]*color:\s*#ffffff;/s);
  });

  it('renders explicit size, variant, and shape classes', () => {
    render(<Badge className="ProductBadge" shape="capsule" size="sm" variant="outline">PDF</Badge>);
    const badge = elementTree.root?.querySelector('.LxBadge');
    expect(badge?.getAttribute('class')).toContain('LxBadge--sm');
    expect(badge?.getAttribute('class')).toContain('LxBadge--outline');
    expect(badge?.getAttribute('class')).toContain('LxBadge--capsule');
    expect(badge?.textContent).toBe('PDF');
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxBadge--outline\s*\{[^}]*border-color:\s*var\(--border\);[^}]*background-color:\s*var\(--color-background-elevated-primary-opaque\);/s
    );
    expect(styles).toMatch(
      /\.LxBadge--outline \.LxBadge__text\s*\{[^}]*color:\s*var\(--color-text-foreground\);/s
    );
  });

  it('matches the Electron 1.5 line-height across the desktop size axis', () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxBadge__text\s*\{[^}]*font-size:\s*10px;[^}]*font-weight:\s*500;[^}]*line-height:\s*15px;/s
    );
    expect(styles).toMatch(
      /\.LxBadge--sm \.LxBadge__text\s*\{[^}]*font-size:\s*9px;[^}]*line-height:\s*13\.5px;/s
    );
    expect(styles).toMatch(
      /\.LxBadge--lg \.LxBadge__text\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s
    );
  });
});
