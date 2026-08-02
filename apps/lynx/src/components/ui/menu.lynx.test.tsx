import { describe, expect, it, rs } from '@rstest/core';
import {
  fireEvent,
  render,
  waitFor,
} from '@lynx-js/react/testing-library';

import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from './menu.lynx';

function menuTrigger(): Element {
  const trigger = elementTree.root?.querySelector('.LxMenuTrigger');
  if (!trigger) throw new Error('expected MenuTrigger');
  return trigger;
}

function fireCatchKeyDown(
  element: Element,
  payload: { readonly key: string; readonly shiftKey?: boolean }
) {
  const event = new Event('catchEvent:keydown', { bubbles: true });
  Object.assign(event, payload);
  fireEvent(element, event);
}

async function openMenu(): Promise<Element> {
  fireEvent.tap(menuTrigger());
  return waitFor(() => {
    const popup = elementTree.root?.querySelector('.LxMenuPopup');
    if (!popup) throw new Error('expected open MenuPopup');
    return popup;
  });
}

describe('Lynx Menu overlay contract', () => {
  it('opens from its anchor and dismisses from item, backdrop, and Escape', async () => {
    const onAction = rs.fn();
    const onOpenChange = rs.fn();

    render(
      <Menu onOpenChange={onOpenChange}>
        <MenuTrigger>
          <text>Open</text>
        </MenuTrigger>
        <MenuPopup side="top" align="start" sideOffset={6}>
          <MenuItem onClick={onAction}>Action</MenuItem>
        </MenuPopup>
      </Menu>
    );

    const trigger = menuTrigger();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await openMenu();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    const action = elementTree.root?.querySelector('.LxMenuItem');
    if (!action) throw new Error('expected MenuItem');
    fireEvent.tap(action);
    expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(elementTree.root?.querySelector('.LxMenuPopup')).toBeNull();
    });

    await openMenu();
    const backdrop = elementTree.root?.querySelector('.LxMenuBackdrop');
    if (!backdrop) throw new Error('expected MenuBackdrop');
    fireEvent(backdrop, new Event('catchEvent:tap', { bubbles: true }));
    await waitFor(() => {
      expect(elementTree.root?.querySelector('.LxMenuPopup')).toBeNull();
    });

    await openMenu();
    const popup = elementTree.root?.querySelector('.LxMenuPopup');
    if (!popup) throw new Error('expected MenuPopup');
    fireEvent.keydown(popup, { key: 'Escape' });
    await waitFor(() => {
      expect(elementTree.root?.querySelector('.LxMenuPopup')).toBeNull();
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('keeps disabled triggers and items inert and unfocusable', async () => {
    const onDisabledItem = rs.fn();
    const onOpenChange = rs.fn();

    render(
      <>
        <Menu onOpenChange={onOpenChange}>
          <MenuTrigger disabled>
            <text>Disabled trigger</text>
          </MenuTrigger>
          <MenuPopup>
            <MenuItem>Hidden</MenuItem>
          </MenuPopup>
        </Menu>
        <Menu defaultOpen>
          <MenuTrigger>
            <text>Open menu</text>
          </MenuTrigger>
          <MenuPopup>
            <MenuItem disabled onClick={onDisabledItem}>
              Disabled item
            </MenuItem>
          </MenuPopup>
        </Menu>
      </>
    );

    const triggers = elementTree.root?.querySelectorAll('.LxMenuTrigger') ?? [];
    const disabledTrigger = triggers[0];
    if (!disabledTrigger) throw new Error('expected disabled MenuTrigger');
    expect(disabledTrigger.getAttribute('focusable')).toBe('false');
    expect(disabledTrigger.getAttribute('aria-disabled')).toBe('true');
    fireEvent.tap(disabledTrigger);
    expect(onOpenChange).not.toHaveBeenCalled();

    const disabledItem = await waitFor(() => {
      const item = elementTree.root?.querySelector('.LxMenuItem--disabled');
      if (!item) throw new Error('expected disabled MenuItem');
      return item;
    });
    expect(disabledItem.getAttribute('focusable')).toBe('false');
    expect(disabledItem.getAttribute('aria-disabled')).toBe('true');
    fireCatchKeyDown(disabledItem, { key: 'Enter' });
    fireEvent.tap(disabledItem);
    expect(onDisabledItem).not.toHaveBeenCalled();
  });

  it('focuses the first enabled item and navigates in visual order', async () => {
    const firstAction = rs.fn();
    const disabledAction = rs.fn();
    const lastAction = rs.fn();

    render(
      <Menu>
        <MenuTrigger>
          <text>Open</text>
        </MenuTrigger>
        <MenuPopup>
          <MenuItem onClick={firstAction}>First</MenuItem>
          <MenuItem disabled onClick={disabledAction}>Disabled</MenuItem>
          <MenuItem onClick={lastAction}>Last</MenuItem>
        </MenuPopup>
      </Menu>
    );

    await openMenu();
    const items = elementTree.root?.querySelectorAll('.LxMenuItem') ?? [];
    const first = items[0];
    if (!first) throw new Error('expected first MenuItem');
    await waitFor(() => {
      expect(first.getAttribute('class')).toContain('LxMenuItem--highlighted');
    });

    fireCatchKeyDown(first, { key: 'ArrowDown' });
    const movedItems = elementTree.root?.querySelectorAll('.LxMenuItem') ?? [];
    expect(movedItems[2]?.getAttribute('class')).toContain(
      'LxMenuItem--highlighted'
    );
    fireCatchKeyDown(movedItems[2]!, { key: 'Enter' });

    expect(lastAction).toHaveBeenCalledTimes(1);
    expect(firstAction).not.toHaveBeenCalled();
    expect(disabledAction).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(elementTree.root?.querySelector('.LxMenuPopup')).toBeNull();
    });
  });

  it('wraps Tab and Shift+Tab while the menu is open', async () => {
    render(
      <Menu>
        <MenuTrigger>
          <text>Open</text>
        </MenuTrigger>
        <MenuPopup>
          <MenuItem onClick={() => {}}>First</MenuItem>
          <MenuItem onClick={() => {}}>Last</MenuItem>
        </MenuPopup>
      </Menu>
    );

    await openMenu();
    const items = elementTree.root?.querySelectorAll('.LxMenuItem') ?? [];
    const first = items[0];
    if (!first) throw new Error('expected first MenuItem');
    fireCatchKeyDown(first, { key: 'Tab', shiftKey: true });
    const shiftedItems = elementTree.root?.querySelectorAll('.LxMenuItem') ?? [];
    expect(shiftedItems[1]?.getAttribute('class')).toContain(
      'LxMenuItem--highlighted'
    );
    fireCatchKeyDown(shiftedItems[1]!, { key: 'Tab' });
    const wrappedItems = elementTree.root?.querySelectorAll('.LxMenuItem') ?? [];
    expect(wrappedItems[0]?.getAttribute('class')).toContain(
      'LxMenuItem--highlighted'
    );
  });
});
