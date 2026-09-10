import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { SynaraLogo } from './SynaraLogo.lynx';

const source = fs.readFileSync(
  path.resolve(__dirname, 'SynaraLogo.lynx.tsx'),
  'utf8'
);

describe('Synara logo adapter', () => {
  it('owns hover state on the visible brand mark', () => {
    render(<SynaraLogo className="size-10 pointer-events-none" />);

    const logo = elementTree.root?.querySelector('.LynxBrandMark');
    if (!logo) throw new Error('expected Lynx brand mark');

    expect(logo.getAttribute('class')).not.toContain('pointer-events-none');
    expect(logo.getAttribute('class')).not.toContain('ui-hover');
    expect(logo.getAttribute('accessibility-trait')).toBe('image');

    fireEvent(logo, new Event('bindEvent:mouseenter', { bubbles: true }));
    expect(logo.getAttribute('class')).toContain('ui-hover');

    fireEvent(logo, new Event('bindEvent:mouseleave', { bubbles: true }));
    expect(logo.getAttribute('class')).not.toContain('ui-hover');
  });

  it('preserves the shared non-shrinking foreground base classes', () => {
    expect(source).toContain("'shrink-0'");
    expect(source).toContain("'text-foreground'");
    expect(source).toContain(
      'baseClassName: `${resolvedClassName} LynxBrandMark`'
    );
    expect(source).toContain('className={interaction.className}');
    expect(source).toContain('{...interaction.eventProps}');
  });

  it('maps the Web 0.875rem sidebar size to the same physical 14px', () => {
    expect(source).toContain("classNames.includes('size-3.5')");
    expect(source).toContain(
      "hasSharedSidebarSize ? { width: '14px', height: '14px' } : {}"
    );
    expect(source).toContain(
      "(value) => value !== 'size-3.5' && value !== 'pointer-events-none'"
    );
    expect(source).toContain("accessibilityTraits: 'image'");
  });

  it('embeds the exact secondary token for the titlebar mark', () => {
    expect(source).toContain(
      "classNames.includes(\n    'text-[var(--color-text-foreground-secondary)]'"
    );
    expect(source).toContain('svgColors.secondaryForeground');
  });

  it('uses the official Lynx mark and reveals the Lynxtron mark on hover', () => {
    const styles = fs.readFileSync(
      path.resolve(__dirname, 'synara-logo.css'),
      'utf8'
    );
    expect(source).toContain('LYNX_LOGO_PATHS');
    expect(source).toContain(
      "import lynxtronDarkMarkUrl from '../../resources/lynxtron-mark-dark.png'"
    );
    expect(source).toContain(
      "import lynxtronLightMarkUrl from '../../resources/lynxtron-mark-light.png'"
    );
    expect(source).toContain('useLynxInteractiveState({');
    expect(source).toContain('baseClassName: `${resolvedClassName} LynxBrandMark`');
    expect(source).toContain("? 'Lynx logo'");
    expect(styles).toMatch(
      /\.LynxBrandMark\.ui-hover \.LynxBrandMarkLynxtron\s*\{[^}]*opacity:\s*1;[^}]*animation:\s*lynx-brand-mark-spin 1\.8s linear infinite;/s
    );
    expect(styles).toMatch(
      /@keyframes lynx-brand-mark-spin\s*\{[\s\S]*rotate\(360deg\) scale\(1\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.LynxBrandMarkLynxtron--dark\s*\{[^}]*display:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.LynxBrandMarkLynxtron--light\s*\{[^}]*display:\s*block;/s
    );
    expect(styles).toMatch(
      /\.LynxBrandMarkLynx,\s*\.LynxBrandMarkLynxtron\s*\{[^}]*pointer-events:\s*none;/s
    );
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none;[\s\S]*transition-duration:\s*0\.01ms;[\s\S]*transform:\s*none;/s
    );
  });
});
