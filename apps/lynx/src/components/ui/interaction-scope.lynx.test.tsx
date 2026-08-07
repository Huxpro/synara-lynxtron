import { fireEvent, render } from '@lynx-js/react/testing-library';
import { describe, expect, it, rs } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { SidebarPrimaryActionButtonElement } from '../../adapters/SidebarPrimaryActionElements.lynx';
import { LynxInteractionScope } from './interaction-scope.lynx';

describe('Lynx interaction scope', () => {
  it('makes canonical controls unfocusable and handler-free while disabled', () => {
    const onActivate = rs.fn();
    render(
      <LynxInteractionScope disabled>
        <SidebarPrimaryActionButtonElement
          active={false}
          accessibleLabel="New thread"
          disabled={false}
          onActivate={onActivate}
        />
      </LynxInteractionScope>
    );

    const control = elementTree.root?.querySelector(
      '.SharedSidebarPrimaryActionButton'
    );
    if (!control) throw new Error('expected scoped control');
    expect(control.getAttribute('focusable')).toBe('false');
    expect(control.getAttribute('aria-disabled')).toBe('true');
    expect(control.getAttribute('bindtap')).toBeNull();
    expect(control.getAttribute('bindkeydown')).toBeNull();
    fireEvent.tap(control);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('keeps permanently disabled controls handler-free', () => {
    render(
      <SidebarPrimaryActionButtonElement
        active={false}
        accessibleLabel="Unavailable action"
        disabled
        onActivate={rs.fn()}
      />
    );

    const control = elementTree.root?.querySelector(
      '.SharedSidebarPrimaryActionButton'
    );
    if (!control) throw new Error('expected disabled control');
    expect(control.getAttribute('focusable')).toBe('false');
    expect(control.getAttribute('bindtap')).toBeNull();
    expect(control.getAttribute('bindkeydown')).toBeNull();
  });

  it('makes both native input paths disabled, unfocusable, and handler-free', () => {
    const source = readFileSync(
      new URL('./input.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      'const resolvedDisabled = scopeDisabled || Boolean(disabled)'
    );
    expect(source).toContain('disabled={props.disabled}');
    expect(source).toContain('focusable={!props.disabled}');
    expect(source).toContain(
      'main-thread:bindinput={props.disabled ? undefined : handleInput}'
    );
    expect(source).toContain('disabled={resolvedDisabled}');
    expect(source).toContain('focusable={!resolvedDisabled}');
    expect(source).toContain(
      'onInput={resolvedDisabled ? undefined : handleInput}'
    );
  });
});
