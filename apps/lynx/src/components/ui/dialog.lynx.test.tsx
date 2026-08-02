import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import {
  fireEvent,
  render,
  waitFor,
} from '@lynx-js/react/testing-library';

import {
  Dialog,
  DialogPopup,
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

    const backdrop = elementTree.root?.querySelector('.LxDialogBackdrop');
    if (!backdrop) throw new Error('expected DialogBackdrop');
    fireEvent.tap(backdrop);
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
    render(
      <Dialog defaultOpen>
        <DialogTrigger>
          <text>Open search</text>
        </DialogTrigger>
        <DialogPopup showCloseButton={false}>
          <text>Search</text>
        </DialogPopup>
      </Dialog>
    );

    fireEvent.keydown(await openDialog(), { key: 'Escape' });
    await waitFor(() => expect(select).toHaveBeenCalledTimes(1));
    expect(select.mock.calls[0]?.[0]).toMatch(/^\.LxDialogTrigger--\d+$/);
    expect(invoke).toHaveBeenCalledWith({
      method: 'setFocus',
      params: { focus: true },
    });
    expect(exec).toHaveBeenCalledTimes(1);
  });
});
