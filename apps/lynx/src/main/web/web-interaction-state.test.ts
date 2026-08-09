import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { installLynxWebInteractionStateBridge } from './web-interaction-state';

function setup(
  onExplorerActivation?: (activation: { readonly open: boolean }) => void,
  onEnvironmentActivation?: (activation: { readonly open: boolean }) => void,
  onExplorerNavigation?: (navigation: {
    readonly expandedDirectory?: {
      readonly open: boolean;
      readonly path: string;
    };
    readonly path?: string;
    readonly query?: string;
  }) => void,
  onRightPanelResize?: (resize: {
    readonly panel: string;
    readonly width: number;
  }) => void,
  onExplorerPreviewAction?: (action: {
    readonly action: 'toggle-menu';
    readonly path: string;
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
    onRightPanelResize,
    onExplorerPreviewAction
  );
  return { child, control, root };
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

  it('forwards file selection, directory targets, and search submission', () => {
    const navigations: Array<{
      expandedDirectory?: { open: boolean; path: string };
      path?: string;
      query?: string;
    }> = [];
    const { control } = setup(undefined, undefined, (navigation) =>
      navigations.push(navigation)
    );
    control.classList.add('ExplorerDockEntry');
    control.setAttribute('aria-disabled', 'false');
    control.setAttribute('accessibility-label', 'Expand src');
    control.click();

    control.setAttribute('accessibility-label', 'Collapse src');
    control.click();

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
      { expandedDirectory: { open: true, path: 'src' } },
      { expandedDirectory: { open: false, path: 'src' } },
      { path: 'README.md' },
      { query: 'populated' },
    ]);
  });

  it('forwards file-reference click and keyboard activation to Explorer', () => {
    const navigations: Array<{ path?: string }> = [];
    const { control } = setup(undefined, undefined, (navigation) =>
      navigations.push(navigation)
    );
    control.classList.add('MdInlineToken--file');
    control.setAttribute('aria-disabled', 'false');
    control.setAttribute(
      'accessibility-label',
      'Open src/app/router.tsx'
    );

    control.click();
    control.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        button: 0,
        clientX: 20,
        clientY: 10,
        composed: true,
      })
    );
    control.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        button: 0,
        clientX: 21,
        clientY: 11,
        composed: true,
      })
    );
    control.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        composed: true,
        key: 'Enter',
      })
    );

    expect(navigations).toEqual([
      { path: 'src/app/router.tsx' },
      { path: 'src/app/router.tsx' },
      { path: 'src/app/router.tsx' },
    ]);
  });

  it('does not activate a file reference after pointer movement', () => {
    const navigations: Array<{ path?: string }> = [];
    const { control } = setup(undefined, undefined, (navigation) =>
      navigations.push(navigation)
    );
    control.classList.add('MdInlineToken--mention');
    control.setAttribute('accessibility-label', 'Open README.md');
    control.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        button: 0,
        clientX: 10,
        clientY: 10,
        composed: true,
      })
    );
    control.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        button: 0,
        clientX: 18,
        clientY: 10,
        composed: true,
      })
    );

    expect(navigations).toEqual([]);
  });

  it('forwards Explorer preview menu pointer actions with the active path', () => {
    const actions: Array<{ action: string; path: string }> = [];
    const { control } = setup(
      undefined,
      undefined,
      undefined,
      undefined,
      (action) => actions.push(action)
    );
    const root = control.getRootNode() as ShadowRoot;
    const header = document.createElement('div');
    header.classList.add('ExplorerDockPreviewHeader');
    const path = document.createElement('div');
    path.classList.add('ExplorerDockPreviewPath');
    path.textContent = 'src/action.ts';
    const trigger = document.createElement('div');
    trigger.classList.add('ExplorerDockPreviewActions');
    header.append(path, trigger);
    root.append(header);

    for (const target of [trigger]) {
      target.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 20,
          clientY: 10,
          composed: true,
        })
      );
      target.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          button: 0,
          clientX: 20,
          clientY: 10,
          composed: true,
        })
      );
    }

    expect(actions).toEqual([
      { action: 'toggle-menu', path: 'src/action.ts' },
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
