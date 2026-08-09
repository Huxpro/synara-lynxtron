import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { installLynxWebInteractionStateBridge } from './web-interaction-state';

function setup(
  onExplorerActivation?: (activation: { readonly open: boolean }) => void,
  onEnvironmentActivation?: (activation: { readonly open: boolean }) => void,
  onExplorerNavigation?: (navigation: {
    readonly path?: string;
    readonly query?: string;
  }) => void,
  onRightPanelResize?: (resize: {
    readonly panel: string;
    readonly width: number;
  }) => void
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
    onExplorerActivation,
    onEnvironmentActivation,
    onExplorerNavigation,
    onRightPanelResize
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

  it('forwards enabled Environment click and keyboard activation as idempotent target state', () => {
    const activations: boolean[] = [];
    const { control } = setup(undefined, (activation) =>
      activations.push(activation.open)
    );
    control.classList.add('EnvironmentToggle');

    control.click();
    control.classList.add('EnvironmentToggle--open');
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

  it('forwards file selection and search submission without activating directories', () => {
    const navigations: Array<{ path?: string; query?: string }> = [];
    const { control } = setup(undefined, undefined, (navigation) =>
      navigations.push(navigation)
    );
    control.classList.add('ExplorerDockEntry');
    control.setAttribute('aria-disabled', 'true');
    control.setAttribute('accessibility-label', 'Open src');
    control.click();

    control.setAttribute('aria-disabled', 'false');
    control.setAttribute('accessibility-label', 'Open README.md');
    control.click();

    const root = control.getRootNode() as ShadowRoot;
    const search = document.createElement('div');
    search.classList.add('ExplorerDockSearchInput');
    const lynxInput = document.createElement('x-input');
    const inputRoot = lynxInput.attachShadow({ mode: 'open' });
    const input = document.createElement('input');
    input.value = 'populated';
    inputRoot.append(input);
    search.append(lynxInput);
    root.append(search);
    lynxInput.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        composed: true,
        key: 'Enter',
      })
    );

    expect(navigations).toEqual([
      { path: 'README.md' },
      { query: 'populated' },
    ]);
  });

  it('resizes a right panel from the sash and reports the clamped width', () => {
    const resizes: Array<{ panel: string; width: number }> = [];
    const { control } = setup(undefined, undefined, undefined, (resize) =>
      resizes.push(resize)
    );
    const root = control.getRootNode() as ShadowRoot;
    const page = document.createElement('div');
    page.classList.add('ThreadPage');
    const panel = document.createElement('div');
    panel.classList.add('ExplorerDock');
    panel.style.width = '640px';
    const sash = document.createElement('div');
    sash.classList.add('RightPanelResizeSash');
    panel.append(sash);
    root.append(page, panel);

    sash.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        composed: true,
        button: 0,
        clientX: 640,
      })
    );
    sash.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        composed: true,
        buttons: 1,
        clientX: 520,
      })
    );
    sash.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        composed: true,
        button: 0,
        clientX: 520,
      })
    );

    expect(panel.style.width).toBe('704px');
    expect(page.style.paddingRight).toBe('704px');
    expect(resizes).toEqual([{ panel: 'ExplorerDock', width: 704 }]);
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
    expect(source).toContain(
      "'.EnvironmentScroller { flex: 0 1 auto; height: auto; min-height: 0; max-height: 100%; }'"
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
