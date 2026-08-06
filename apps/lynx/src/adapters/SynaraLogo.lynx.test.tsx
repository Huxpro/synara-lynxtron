import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from '@rstest/core';

const source = fs.readFileSync(
  path.resolve(__dirname, 'SynaraLogo.lynx.tsx'),
  'utf8'
);

describe('Synara logo adapter', () => {
  it('preserves the shared non-shrinking foreground base classes', () => {
    expect(source).toContain("'shrink-0'");
    expect(source).toContain("'text-foreground'");
    expect(source).toContain('className={resolvedClassName}');
  });

  it('maps the Web 0.875rem sidebar size to the same physical 14px', () => {
    expect(source).toContain("classNames.includes('size-3.5')");
    expect(source).toContain(
      "hasSharedSidebarSize ? { width: '14px', height: '14px' } : {}"
    );
    expect(source).toContain(
      "...classNames.filter((value) => value !== 'size-3.5')"
    );
  });

  it('embeds the exact secondary token for the titlebar mark', () => {
    expect(source).toContain(
      "classNames.includes(\n    'text-[var(--color-text-foreground-secondary)]'"
    );
    expect(source).toContain('svgColors.secondaryForeground');
  });
});
