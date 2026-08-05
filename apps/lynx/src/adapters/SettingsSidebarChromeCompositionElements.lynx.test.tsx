import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Settings search input', () => {
  it('uses an uncontrolled native input to avoid per-keystroke ACK loss', () => {
    const source = readFileSync(
      new URL('./SettingsSidebarChromeCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('const inputRef = useRef<InputRef>(null)');
    expect(source).toContain('defaultValue={props.value}');
    expect(source).not.toContain('value={props.value}');
    expect(source).toContain('size="sm"');
    expect(source).toContain('variant="soft"');
    expect(source).toContain("inputRef.current?.setValue('')");
    expect(source).toContain(
      'onChange={(event) => props.onValueChange?.(event.target.value)}'
    );
  });

  it('matches the Web back-row label weight', () => {
    const styles = readFileSync(
      new URL('./settings-sidebar-chrome-composition-elements.css', import.meta.url),
      'utf8'
    );
    const webStyles = readFileSync(
      new URL('../../../web/src/sidebarRowStyles.ts', import.meta.url),
      'utf8'
    );

    expect(webStyles).toContain('font-normal');
    expect(styles).toMatch(
      /\.SharedSettingsSidebarBackLabel\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*line-height:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarSearch\s*>\s*\.SharedSettingsSidebarSearchIcon\s*\{[^}]*opacity:\s*0\.7;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarSearchInput\s*\{[^}]*padding-left:\s*32px;[^}]*padding-right:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarSearch\s*>\s*\.SharedSettingsSidebarSearchIcon\s*\{[^}]*left:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarBackButton\.ui-focus\s*\{[^}]*box-shadow:\s*inset 0 0 0 1px var\(--ring\);/s
    );
    expect(styles).not.toMatch(
      /\.SharedSettingsSidebarBackButton\.ui-pressed\s*\{[^}]*opacity:/
    );
  });
});
