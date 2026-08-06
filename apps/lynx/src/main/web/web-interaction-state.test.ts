import { describe, expect, it } from '@rstest/core';

import { installLynxWebInteractionStateBridge } from './web-interaction-state';

function setup() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  const control = document.createElement('div');
  control.setAttribute('focusable', 'true');
  const child = document.createElement('span');
  control.append(child);
  root.append(control);
  installLynxWebInteractionStateBridge(root);
  return { child, control };
}

describe('Lynx-for-Web interaction state bridge', () => {
  it('maps Lynx focusability to Web tab stops without taking explicit ownership', async () => {
    const { control } = setup();
    expect(control.tabIndex).toBe(0);

    control.setAttribute('focusable', 'false');
    await Promise.resolve();
    expect(control.hasAttribute('tabindex')).toBe(false);

    const host = control.getRootNode() as ShadowRoot;
    const explicit = document.createElement('div');
    explicit.setAttribute('focusable', 'true');
    explicit.tabIndex = 3;
    host.append(explicit);
    await Promise.resolve();
    expect(explicit.tabIndex).toBe(3);

    const dynamic = document.createElement('div');
    dynamic.setAttribute('focusable', 'true');
    host.append(dynamic);
    await Promise.resolve();
    expect(dynamic.tabIndex).toBe(0);
  });

  it('maps composed pointer and focus events to shared interaction classes', () => {
    const { child, control } = setup();

    child.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, composed: true })
    );
    expect(control.classList.contains('ui-hover')).toBe(true);

    child.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, composed: true })
    );
    expect(control.classList.contains('ui-hover')).toBe(false);

    control.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, composed: true })
    );
    expect(control.classList.contains('ui-focus')).toBe(true);

    control.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, composed: true })
    );
    expect(control.classList.contains('ui-focus')).toBe(false);
  });

  it('does not remove interaction classes owned by the Lynx runtime', () => {
    const { child, control } = setup();
    control.classList.add('ui-hover', 'ui-focus');

    child.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, composed: true })
    );
    child.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, composed: true })
    );
    control.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, composed: true })
    );
    control.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, composed: true })
    );

    expect(control.classList.contains('ui-hover')).toBe(true);
    expect(control.classList.contains('ui-focus')).toBe(true);
  });
});
