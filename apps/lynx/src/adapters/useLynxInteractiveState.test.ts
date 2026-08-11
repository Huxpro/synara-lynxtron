import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import {
  handleLynxActivationKey,
  isLynxActivationKey,
  lynxInteractiveAccessibilityProps,
  lynxNestedInteractiveEventProps,
  lynxInteractiveClassName,
} from './useLynxInteractiveState';

describe('Lynx interactive state adapter', () => {
  it('matches native Enter and Space activation keys without widening the contract', () => {
    expect(['Enter', ' ', 'Space', 'Spacebar'].every(isLynxActivationKey)).toBe(
      true
    );
    expect(isLynxActivationKey('Escape')).toBe(false);
    expect(isLynxActivationKey('ArrowDown')).toBe(false);
  });

  it('activates supported keys exactly once and prevents their default action', () => {
    let activations = 0;
    let prevented = 0;
    const event = {
      key: 'Enter',
      preventDefault: () => {
        prevented += 1;
      },
    };

    expect(
      handleLynxActivationKey(event, () => {
        activations += 1;
      })
    ).toBe(true);
    expect({ activations, prevented }).toEqual({
      activations: 1,
      prevented: 1,
    });
  });

  it('does not consume or activate unrelated keys', () => {
    let activations = 0;
    let prevented = 0;

    expect(
      handleLynxActivationKey(
        {
          key: 'Escape',
          preventDefault: () => {
            prevented += 1;
          },
        },
        () => {
          activations += 1;
        }
      )
    ).toBe(false);
    expect({ activations, prevented }).toEqual({
      activations: 0,
      prevented: 0,
    });
  });

  it('emits the generated utility state classes in stable order', () => {
    expect(
      lynxInteractiveClassName('Control', {
        hovered: true,
        focused: true,
        pressed: true,
      })
    ).toBe('Control ui-hover ui-focus ui-pressed');
    expect(
      lynxInteractiveClassName('Control', {
        hovered: false,
        focused: false,
        pressed: false,
      })
    ).toBe('Control');
  });

  it('keeps shared hover and focus intent delivery in the interaction primitive', () => {
    const source = readFileSync(
      new URL(
        '../components/ui/interactive-state.lynx.ts',
        import.meta.url
      ),
      'utf8'
    );

    expect(source).toMatch(
      /bindmouseenter:[\s\S]*?setHovered\(true\);[\s\S]*?options\.onIntent\?\.\(\);[\s\S]*?bindmouseleave:/
    );
    expect(source).toMatch(
      /bindfocus:[\s\S]*?setFocused\(true\);[\s\S]*?options\.onIntent\?\.\(\);[\s\S]*?bindblur:/
    );
  });

  it('exposes actionable native button semantics without widening passive nodes', () => {
    const onActivate = () => {};

    expect(
      lynxInteractiveAccessibilityProps({
        accessibleLabel: 'Open settings',
        accessibilityValue: 'Current page',
        onActivate,
      })
    ).toEqual({
      'accessibility-element': true,
      'accessibility-label': 'Open settings',
      'accessibility-traits': 'button',
      'accessibility-value': 'Current page',
    });
    expect(lynxInteractiveAccessibilityProps({})).toEqual({
      'accessibility-element': undefined,
      'accessibility-label': undefined,
      'accessibility-traits': undefined,
      'accessibility-value': undefined,
    });
    expect(
      lynxInteractiveAccessibilityProps({ onActivate })
    ).toMatchObject({
      'accessibility-element': true,
      'accessibility-traits': 'button',
    });
    expect(
      lynxInteractiveAccessibilityProps({
        accessibleLabel: 'Unavailable action',
      })
    ).toMatchObject({
      'accessibility-element': true,
      'accessibility-traits': 'button',
    });
  });

  it('keeps explicit native accessibility semantics authoritative', () => {
    expect(
      lynxInteractiveAccessibilityProps({
        accessibilityElement: false,
        accessibilityTraits: 'link',
        accessibleLabel: 'Open documentation',
        onActivate: () => {},
      })
    ).toMatchObject({
      'accessibility-element': false,
      'accessibility-label': 'Open documentation',
      'accessibility-traits': 'link',
    });
  });

  it('contains nested pointer activation without dropping focus or keyboard handlers', () => {
    const onMouseDown = () => {};
    const onMouseUp = () => {};
    const onTouchStart = () => {};
    const onTouchEnd = () => {};
    const onTouchCancel = () => {};
    const onTap = () => {};
    const onKeyDown = () => {};
    const nested = lynxNestedInteractiveEventProps({
      'accessibility-element': true,
      'accessibility-label': 'Nested action',
      'accessibility-traits': 'button',
      'accessibility-value': undefined,
      focusable: true,
      'aria-disabled': false,
      bindmouseenter: undefined,
      bindmouseleave: undefined,
      bindmousedown: onMouseDown,
      bindmouseup: onMouseUp,
      bindtouchstart: onTouchStart,
      bindtouchend: onTouchEnd,
      bindtouchcancel: onTouchCancel,
      bindfocus: undefined,
      bindblur: undefined,
      bindkeydown: onKeyDown,
      bindtap: onTap,
    });

    expect(nested).toMatchObject({
      catchmousedown: onMouseDown,
      catchmouseup: onMouseUp,
      catchtouchstart: onTouchStart,
      catchtouchend: onTouchEnd,
      catchtouchcancel: onTouchCancel,
      catchtap: onTap,
      bindkeydown: onKeyDown,
      'accessibility-element': true,
      'accessibility-label': 'Nested action',
      'accessibility-traits': 'button',
    });
    expect('bindmousedown' in nested).toBe(false);
    expect('bindtouchstart' in nested).toBe(false);
    expect('bindtap' in nested).toBe(false);
  });
});
