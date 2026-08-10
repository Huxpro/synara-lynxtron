import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Input accessibility contract', () => {
  it('forwards normalized labels through the keyboard-input branch', () => {
    const source = readFileSync(
      new URL('./input.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      'accessibleLabel={accessibilityLabel ?? ariaLabel}'
    );
    expect(source).toContain('aria-label={props.accessibleLabel}');
    expect(source).toContain(
      'accessibility-element={props.accessibleLabel ? true : undefined}'
    );
    expect(source).toContain('accessibility-label={props.accessibleLabel}');
  });
});
