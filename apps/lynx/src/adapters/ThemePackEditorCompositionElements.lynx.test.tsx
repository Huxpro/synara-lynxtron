import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { ThemePackBooleanControlElement } from './ThemePackEditorCompositionElements.lynx';

function switchElement(): Element {
  const element = elementTree.root?.querySelector('.SharedThemePackSwitch');
  if (!element) throw new Error('expected ThemePack boolean control');
  return element;
}

describe('ThemePack boolean interaction contract', () => {
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
