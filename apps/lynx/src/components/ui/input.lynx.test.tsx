import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Input accessibility contract', () => {
  it('centers the one-line textarea through shared size metrics', () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');

    expect(styles).toMatch(
      /\.LxInputControl\s*\{[^}]*padding-left:\s*12px;[^}]*padding-right:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.LxInputControl--sm\s*\{[^}]*padding-left:\s*10px;[^}]*padding-right:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.LxInputControl--lg\s*\{[^}]*padding-left:\s*14px;[^}]*padding-right:\s*14px;/s
    );
    expect(styles).toMatch(
      /\.LxInput\s*\{[^}]*box-sizing:\s*border-box;[^}]*padding-top:\s*7px;[^}]*padding-bottom:\s*7px;[^}]*line-height:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.LxInputControl--sm > \.LxInput\s*\{[^}]*padding-top:\s*4px;[^}]*padding-bottom:\s*4px;[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s
    );
    expect(styles).toMatch(
      /\.LxInputControl--lg > \.LxInput\s*\{[^}]*padding-top:\s*9px;[^}]*padding-bottom:\s*9px;/s
    );
  });

  it('forwards normalized labels through the keyboard-input branch', () => {
    const source = readFileSync(
      new URL('./input.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      'accessibleLabel={accessibilityLabel ?? ariaLabel}'
    );
    expect(source).toContain("'aria-label': props.accessibleLabel");
    expect(source).toContain(
      "'accessibility-element': props.accessibleLabel ? true : undefined"
    );
    expect(source).toContain("'accessibility-label': props.accessibleLabel");
    expect(source).toContain('ariaInvalid={ariaInvalid}');
    expect(source).toContain("'aria-invalid': props.ariaInvalid");
    expect(source).toContain("'default-value': props.defaultValue");
    expect(source).toContain('value: props.value ?? props.defaultValue');
    expect(source).toContain(
      "void setValue(props.defaultValue ?? '').catch(() => undefined)"
    );
    expect(source).toContain('{nativeInput || onKeyDown ? (');
    expect(source).toContain(
      '<textarea {...sharedProps} maxlines={props.maxLines ?? 1} />'
    );
    expect(source).toContain('maxLines={multiline ? (maxLines ?? 5) : 1}');
    expect(source).toContain("props.type === 'number' ? '[0-9.]*' : undefined");
    expect(source).toContain(
      "'accessibility-state': props.disabled ? { disabled: true } : undefined"
    );
    expect(source).toMatch(
      /<LynxInput[\s\S]{0,260}aria-invalid=\{ariaInvalid\}/
    );
  });

  it('projects real input focus onto the shared control shell', () => {
    const source = readFileSync(
      new URL('./input.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');

    expect(source).toContain('const [focused, setFocused] = useState(false);');
    expect(source).toContain('setFocused(true);');
    expect(source).toContain('setFocused(false);');
    expect(source).toContain("focused && 'ui-focus'");
    expect(styles).toMatch(
      /\.LxInputControl\.ui-focus\s*\{[^}]*border-color:\s*var\(--control-input-focus-border\);/s
    );
  });
});
