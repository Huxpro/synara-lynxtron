import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  ThemePackBooleanControlElement,
  ThemePackCodeThemeControlElement,
  mixThemeColors,
} from './ThemePackEditorCompositionElements.lynx';

function switchElement(): Element {
  const element = elementTree.root?.querySelector('.SharedThemePackSwitch');
  if (!element) throw new Error('expected ThemePack boolean control');
  return element;
}

describe('ThemePack boolean interaction contract', () => {
  it('matches the Web two-row header and row typography', () => {
    const source = readFileSync(
      new URL('./ThemePackEditorCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./theme-pack-editor-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedThemePackRoot\s*\{[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackHeader\s*\{[^}]*height:\s*84px;[^}]*flex-wrap:\s*wrap;[^}]*padding:\s*12px 16px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackHeader\s*>\s*\.LxMenuRoot\s*\{[^}]*width:\s*100%;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackCodeSelect\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackTitle\s*\{[^}]*font-size:\s*14px;[^}]*font-weight:\s*500;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackRowLabel\s*\{[^}]*font-size:\s*14px;[^}]*font-weight:\s*400;[^}]*line-height:\s*20px;/s
    );
    expect(source).toContain("import { SettingsResetIcon } from './SettingsResetIcon.lynx';");
    expect(source).toContain('<SettingsResetIcon />');
    expect(source).not.toContain('↶');
    expect(styles).toMatch(
      /\.SharedThemePackSwitch\s*\{[^}]*width:\s*32px;[^}]*height:\s*20px;[^}]*padding:\s*1px;[^}]*border:\s*1px solid var\(--settings-switch-border\);[^}]*background-color:\s*var\(--settings-switch-off\);/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackSwitchThumb\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*background-color:\s*#ffffff;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackSwitch--on \.SharedThemePackSwitchThumb\s*\{[^}]*transform:\s*translateX\(12px\);/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackCodeSwatch\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SharedThemePackCodeLabel\s*\{[^}]*font-size:\s*13px;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s
    );
  });

  it('renders palette previews in the code-theme trigger and options', () => {
    render(
      <ThemePackCodeThemeControlElement
        value="linear"
        label="Linear"
        ariaLabel="Light theme code theme"
        theme={{
          accent: '#5e6ad2',
          surface: '#ffffff',
          ink: '#1a1c1f',
          contrast: 50,
          fonts: { ui: null, code: null },
          opaqueWindows: false,
        }}
        options={[
          {
            id: 'linear',
            label: 'Linear',
            previewTheme: {
              accent: '#5e6ad2',
              surface: '#ffffff',
              ink: '#1a1c1f',
              contrast: 50,
              fonts: { ui: null, code: null },
              opaqueWindows: false,
            },
          },
        ]}
        onChange={() => {}}
      />
    );

    const trigger = elementTree.root?.querySelector('.LxMenuTrigger');
    if (!trigger) throw new Error('expected code theme trigger');
    expect(trigger.getAttribute('aria-label')).toBe('Light theme code theme');
    expect(
      elementTree.root?.querySelector('.SharedThemePackCodeSwatchText')?.textContent
    ).toBe('Aa');
    expect(
      elementTree.root?.querySelector('.SharedThemePackCodeLabel')?.textContent
    ).toBe('Linear');
    expect(elementTree.root?.querySelector('.SharedThemePackCodeChevron')).not.toBeNull();

    fireEvent.tap(trigger);
    const menuItem = elementTree.root?.querySelector('.SharedThemePackCodeMenuItem');
    if (!menuItem) throw new Error('expected code theme option');
    expect(menuItem.textContent).toContain('Aa');
    expect(menuItem.textContent).toContain('Linear');
    expect(mixThemeColors('#ffffff', '#1a1c1f', 0.16)).toBe(
      'rgb(218, 219, 219)'
    );
  });

  it('publishes checked state and exact pointer/key/tap activation', () => {
    const onChange = rs.fn();
    render(
      <ThemePackBooleanControlElement
        checked={false}
        ariaLabel="Light theme translucent sidebar"
        onChange={onChange}
      />
    );

    const control = switchElement();
    expect(control.getAttribute('focusable')).toBe('true');
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(control.getAttribute('accessibility-label')).toBe(
      'Light theme translucent sidebar'
    );

    fireEvent(
      control,
      new Event('bindEvent:mouseenter', { bubbles: true })
    );
    expect(control.getAttribute('class')).toContain('ui-hover');
    fireEvent.mousedown(control);
    expect(control.getAttribute('class')).toContain('ui-pressed');
    fireEvent.mouseup(control);
    expect(control.getAttribute('class')).not.toContain('ui-pressed');
    fireEvent.focus(control);
    expect(control.getAttribute('class')).toContain('ui-focus');

    fireEvent.keydown(control, { key: 'Enter' });
    fireEvent.tap(control);
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });
});
