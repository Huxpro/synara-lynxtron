import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { installLynxWebInteractionStateBridge } from './web-interaction-state';

function setup(
  onExplorerActivation?: (activation: { readonly open: boolean }) => void
) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  const control = document.createElement('div');
  control.setAttribute('focusable', 'true');
  const child = document.createElement('span');
  control.append(child);
  root.append(control);
  installLynxWebInteractionStateBridge(
    root,
    undefined,
    onExplorerActivation
  );
  return { child, control };
}

describe('Lynx-for-Web interaction state bridge', () => {
  it('forwards enabled Explorer click and keyboard activation as idempotent target state', () => {
    const activations: boolean[] = [];
    const { control } = setup((activation) =>
      activations.push(activation.open)
    );
    control.classList.add('ThreadFilesToggle');

    control.click();
    control.classList.add('ThreadFilesToggle--active');
    control.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        composed: true,
        key: 'Enter',
      })
    );
    control.setAttribute('aria-disabled', 'true');
    control.click();

    expect(activations).toEqual([true, false]);
  });

  it('normalizes the Web Elements textarea shadow part through LynxView injection', () => {
    const source = readFileSync(
      new URL('./web-host.ts', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "'.SharedThemePackImportTextarea::part(textarea) { box-sizing: border-box; width: 100%; height: 100%; padding: 0; }'"
    );
    expect(source).toContain(
      'lynxView.injectStyleRules = LYNX_WEB_STYLE_RULES'
    );
  });

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

  it('maps pointer state for explicit non-focusable hover owners', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const owner = document.createElement('div');
    owner.classList.add('LynxWebHoverOwner');
    const child = document.createElement('span');
    owner.append(child);
    root.append(owner);
    installLynxWebInteractionStateBridge(root);

    child.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, composed: true })
    );
    expect(owner.classList.contains('ui-hover')).toBe(true);
    child.dispatchEvent(
      new MouseEvent('mouseout', { bubbles: true, composed: true })
    );
    expect(owner.classList.contains('ui-hover')).toBe(false);
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
