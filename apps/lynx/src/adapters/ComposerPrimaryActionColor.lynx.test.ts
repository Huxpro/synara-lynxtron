import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Native composer primary action color', () => {
  it('injects the resolved live-theme surface color into raw SVG content', () => {
    const inputElementsSource = readFileSync(
      new URL('./ComposerInputCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const themeSource = readFileSync(
      new URL('./useTheme.lynx.ts', import.meta.url),
      'utf8'
    );

    expect(themeSource).toContain('surface: activeTheme.theme.surface');
    expect(inputElementsSource).toContain('const { svgColors } = useTheme()');
    expect(inputElementsSource.match(/svgColors\.surface/g)).toHaveLength(2);
    expect(inputElementsSource).not.toContain(
      "'var(--color-background-surface)'"
    );
  });
});
