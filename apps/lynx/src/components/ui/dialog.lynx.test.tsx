import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { readFileSync } from 'node:fs';
import {
  fireEvent,
  render,
  waitFor,
} from '@lynx-js/react/testing-library';

import {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from './dialog.lynx';

const select = rs.fn();
const invoke = rs.fn();
const exec = rs.fn();

beforeEach(() => {
  Object.assign(lynx, {
    requestAnimationFrame(callback: () => void) {
      callback();
      return 0;
    },
    createSelectorQuery() {
      return {
        select(selector: string) {
          select(selector);
          return this;
        },
        invoke(payload: unknown) {
          invoke(payload);
          return this;
        },
        exec() {
          exec();
        },
      };
    },
  });
  select.mockClear();
  invoke.mockClear();
  exec.mockClear();
});

async function openDialog(): Promise<Element> {
  return waitFor(() => {
    const popup = elementTree.root?.querySelector('.LxDialogPopup');
    if (!popup) throw new Error('expected open DialogPopup');
    return popup;
  });
}

describe('Lynx Dialog dismiss contract', () => {
  it('lifts modal content into a full-window Native overlay', () => {
    const source = readFileSync(new URL('./dialog.lynx.tsx', import.meta.url), 'utf8');
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');

    expect(source).toContain('<overlay className="LxDialogOverlay" visible>');
    expect(source).toContain('<view className="LxDialogOverlayContent">');
    expect(styles).toMatch(/\.LxDialogOverlay\s*\{[^}]*position:\s*fixed;/s);
    expect(styles).toMatch(
      /\.LxDialogOverlayContent\s*\{[^}]*position:\s*fixed;[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*z-index:\s*0;/s
    );
  });

  it('matches the Web bottom-sheet contract on compact viewports', async () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    render(
      <Dialog defaultOpen>
        <DialogPopup>Mobile dialog</DialogPopup>
      </Dialog>
    );

    const popup = await openDialog();
    expect(popup.getAttribute('class')).toContain(
      'LxDialogPopup--bottom-stick-mobile'
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.LxDialogViewport--bottom-stick-mobile\s*\{[^}]*align-items:\s*flex-end;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.LxDialogPopup--bottom-stick-mobile\s*\{[^}]*width:\s*100%;[^}]*border-radius:\s*0;/s
    );
  });

  it('allows desktop-only dialogs to opt out of mobile bottom sticking', async () => {
    render(
      <Dialog defaultOpen>
        <DialogPopup bottomStickOnMobile={false}>Desktop dialog</DialogPopup>
      </Dialog>
    );

    const popup = await openDialog();
    expect(popup.getAttribute('class')).not.toContain(
      'LxDialogPopup--bottom-stick-mobile'
    );
  });

  it('publishes modal semantics and closes from the backdrop', async () => {
    const onOpenChange = rs.fn();

    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogPopup showCloseButton={false}>
          <text>Search</text>
        </DialogPopup>
      </Dialog>
    );
    const popup = await openDialog();
    expect(popup.getAttribute('role')).toBe('dialog');
    expect(popup.getAttribute('aria-modal')).toBe('true');

    const backdrop = elementTree.root?.querySelector(
      '.LxDialogBackdropTapTarget'
    );
    if (!backdrop) throw new Error('expected DialogBackdrop tap target');
    fireEvent(backdrop, new Event('catchEvent:tap', { bubbles: true }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('publishes dialog titles as Native headings', async () => {
    render(
      <Dialog defaultOpen>
        <DialogPopup showCloseButton={false}>
          <DialogTitle>Release history</DialogTitle>
        </DialogPopup>
      </Dialog>
    );

    await openDialog();
    const title = elementTree.root?.querySelector('.LxDialogTitle');
    expect(title?.getAttribute('accessibility-element')).toBe('true');
    expect(title?.getAttribute('accessibility-heading')).toBe('true');
    expect(title?.getAttribute('accessibility-trait')).toBe('header');
  });

  it('matches the Electron dialog description type tier', () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxDialogTitle\s*\{[^}]*font-size:\s*18px;[^}]*font-weight:\s*600;[^}]*line-height:\s*22\.5px;/s
    );
    expect(styles).toMatch(
      /\.LxDialogHeader\s*\{[^}]*flex-direction:\s*column;[^}]*gap:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.LxDialogDescription\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s
    );
    expect(styles).not.toMatch(
      /\.LxDialogDescription\s*\{[^}]*margin-top:/s
    );
  });

  it('applies the Electron action geometry to text buttons in dialog footers', () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    const footerButtonSelector =
      /\.LxDialogFooter\s*> \.LxButton:not\(\.LxButton--icon-chip\):not\(\.LxButton--icon-xs\):not\(\.LxButton--icon-sm\):not\(\.LxButton--icon\):not\(\.LxButton--icon-lg\):not\(\.LxButton--icon-xl\):not\(\.LxButton--capsule\)/;

    expect(styles).toMatch(
      new RegExp(`${footerButtonSelector.source}\\s*\\{[^}]*min-height:\\s*28px;[^}]*padding:\\s*4px 12px;[^}]*border-radius:\\s*8px;`, 's')
    );
    expect(styles).toMatch(
      new RegExp(`${footerButtonSelector.source}\\s+\\.LxButton__text\\s*\\{[^}]*font-weight:\\s*400;`, 's')
    );
  });

  it('names and activates default and custom close owners', async () => {
    const onOpenChange = rs.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogPopup>
          <DialogClose className="CustomClose" ariaLabel="Close custom dialog">
            <text>Done</text>
          </DialogClose>
        </DialogPopup>
      </Dialog>
    );

    await openDialog();
    const defaultClose = elementTree.root?.querySelector('.LxDialogClose');
    const customClose = elementTree.root?.querySelector('.CustomClose');
    expect(defaultClose?.getAttribute('accessibility-label')).toBe(
      'Close dialog'
    );
    expect(
      defaultClose
        ?.querySelector('.LxDialogClose__icon')
        ?.getAttribute('content')
    ).toContain('stroke="rgba(13, 13, 13, 0.598)"');
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxDialogClose__icon\s*\{[^}]*opacity:\s*0\.8;/s
    );
    expect(customClose?.getAttribute('accessibility-label')).toBe(
      'Close custom dialog'
    );
    if (!customClose) throw new Error('expected custom DialogClose');
    fireEvent.tap(customClose);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('closes from Escape', async () => {
    const onOpenChange = rs.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogPopup showCloseButton={false}>
          <text>Search</text>
        </DialogPopup>
      </Dialog>
    );
    fireEvent.keydown(await openDialog(), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('ignores unrelated keys', async () => {
    const onOpenChange = rs.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogPopup showCloseButton={false}>
          <text>Search</text>
        </DialogPopup>
      </Dialog>
    );

    fireEvent.keydown(await openDialog(), { key: 'Enter' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('restores focus to its exact trigger after dismiss', async () => {
    const onOpenChange = rs.fn();
    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger ariaLabel="Open search">
          <text>Open search</text>
        </DialogTrigger>
        <DialogPopup showCloseButton={false}>
          <text>Search</text>
        </DialogPopup>
      </Dialog>
    );

    const trigger = elementTree.root?.querySelector('.LxDialogTrigger');
    if (!trigger) throw new Error('expected DialogTrigger');
    expect(trigger.getAttribute('accessibility-label')).toBe('Open search');
    fireEvent.tap(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.keydown(await openDialog(), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(select).toHaveBeenCalledTimes(1));
    expect(select.mock.calls[0]?.[0]).toMatch(/^\.LxDialogTrigger--\d+$/);
    expect(invoke).toHaveBeenCalledWith({
      method: 'setFocus',
      params: { focus: true },
    });
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('keeps disabled triggers inert and unfocusable', () => {
    const onOpenChange = rs.fn();
    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger disabled ariaLabel="Open search">
          <text>Open search</text>
        </DialogTrigger>
      </Dialog>
    );

    const trigger = elementTree.root?.querySelector('.LxDialogTrigger');
    if (!trigger) throw new Error('expected disabled DialogTrigger');
    expect(trigger.getAttribute('focusable')).toBe('false');
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    fireEvent.tap(trigger);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
