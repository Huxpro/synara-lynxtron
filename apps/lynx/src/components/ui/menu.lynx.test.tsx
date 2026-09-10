import { describe, expect, it, rs } from '@rstest/core';
import {
  fireEvent,
  render,
  waitFor,
} from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuOverlayProvider,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
  menuPlacementRequiresPopupSize,
  resolveMenuCoordinates,
  resolveSubmenuCoordinates,
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
  it('portals popup layers into the shared viewport overlay host', async () => {
    render(
      <MenuOverlayProvider>
        <view className="ClippingScrollAncestor">
          <Menu defaultOpen>
            <MenuTrigger>Open</MenuTrigger>
            <MenuPopup>Action</MenuPopup>
          </Menu>
        </view>
      </MenuOverlayProvider>
    );

    await waitFor(() => {
      expect(elementTree.root?.querySelector('.LxMenuOverlayHost')).not.toBeNull();
      expect(elementTree.root?.querySelector('.LxMenuLayer')).not.toBeNull();
    });
    const source = readFileSync(
      new URL('./menu.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain(
      'createPortal(<Fragment>{props.children}</Fragment>, hostRef.current)'
    );
    expect(source).toContain('<MenuPortal>');
    const primitiveStyles = readFileSync(
      new URL('./primitives.css', import.meta.url),
      'utf8'
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuOverlayHost\s*\{[^}]*z-index:\s*1100;[^}]*width:\s*0;[^}]*height:\s*0;[^}]*overflow:\s*visible;[^}]*pointer-events:\s*none;/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuLayer\s*\{[^}]*z-index:\s*1100;/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuItem__row\s*\{[^}]*justify-content:\s*flex-start;[^}]*gap:\s*8px;/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuItem__trailing\s*\{[^}]*margin-left:\s*auto;/s
    );
    expect(source).toContain('if (byId && hasMenuRectSize(byId)) return byId;');
    expect(source).toContain('return getRectByRef(ref, true);');
  });

  it('clamps tall submenus vertically and flips them at the right viewport edge', () => {
    expect(
      resolveSubmenuCoordinates({
        align: 'start',
        anchor: { x: 700, y: 650, width: 220, height: 32 },
        popup: { x: 0, y: 0, width: 260, height: 310 },
        viewport: { x: 0, y: 0, width: 1280, height: 788 },
      })
    ).toEqual({ left: 226, top: -180 });
    expect(
      resolveSubmenuCoordinates({
        align: 'end',
        anchor: { x: 700, y: 650, width: 220, height: 32 },
        popup: { x: 0, y: 0, width: 260, height: 310 },
        viewport: { x: 0, y: 0, width: 1280, height: 788 },
      })
    ).toEqual({ left: 226, top: -278 });
    const primitiveStyles = readFileSync(
      new URL('./primitives.css', import.meta.url),
      'utf8'
    );
    const primitiveSource = readFileSync(
      new URL('./menu.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuSubPopup--align-end\s*\{[^}]*top:\s*auto;[^}]*bottom:\s*0;/s
    );
    expect(primitiveSource).toMatch(
      /top:\s*\x60\$\{Math\.round\(coordinates\.top\)\}px\x60/s
    );
    expect(primitiveSource).toContain(
      "props.align === 'end' ? { bottom: 'auto' } : {}"
    );
    expect(
      resolveSubmenuCoordinates({
        anchor: { x: 1050, y: 100, width: 220, height: 32 },
        popup: { x: 0, y: 0, width: 260, height: 310 },
        viewport: { x: 0, y: 0, width: 1280, height: 788 },
      })
    ).toEqual({ left: -266, top: 0 });
    expect(
      resolveSubmenuCoordinates({
        align: 'start',
        side: 'left',
        anchor: { x: 700, y: 100, width: 208, height: 26 },
        popup: { x: 0, y: 0, width: 208, height: 319 },
        viewport: { x: 0, y: 0, width: 1280, height: 820 },
      })
    ).toEqual({ left: -214, top: 0 });
    expect(
      resolveSubmenuCoordinates({
        align: 'start',
        anchor: { x: 96, y: 146, width: 208, height: 26 },
        popup: { x: 0, y: 0, width: 208, height: 286 },
        viewport: { x: 0, y: 0, width: 468, height: 620 },
      })
    ).toEqual({ left: 0, top: 26 });
  });

  it('shows bottom-start menus as soon as the anchor is measured', () => {
    expect(
      menuPlacementRequiresPopupSize({ align: 'start', side: 'bottom' })
    ).toBe(false);
    expect(
      menuPlacementRequiresPopupSize({ align: 'end', side: 'bottom' })
    ).toBe(true);
    expect(
      menuPlacementRequiresPopupSize({ align: 'start', side: 'top' })
    ).toBe(true);
  });

  it('matches the shared Web option text line box', () => {
    const source = readFileSync(
      new URL('./menu.lynx.tsx', import.meta.url),
      'utf8'
    );
    const primitiveStyles = readFileSync(
      new URL('./primitives.css', import.meta.url),
      'utf8'
    );

    expect(primitiveStyles).toMatch(
      /\.LxMenuItem__text\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuItem\s*\{[^}]*min-height:\s*32px;[^}]*padding:\s*6px 10px;/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuItem\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuItem\.ui-pressed\s*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s
    );
    expect(primitiveStyles).not.toMatch(
      /\.LxMenuItem\.ui-pressed\s*\{[^}]*opacity:/s
    );
    expect(primitiveStyles).not.toMatch(
      /\.LxMenuTrigger\.ui-(?:hover|focus|pressed)\s*\{/
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuTrigger--disabled\s*\{[^}]*opacity:\s*0\.48;/s
    );
    expect(source).toContain(
      'attempt < MENU_ANCHOR_RETRY_COUNT'
    );
    expect(source).toContain('if (await refreshAnchorRect()) return;');
    expect(source).toContain(
      'await sleepOnHost(MENU_ANCHOR_RETRY_DELAY_MS)'
    );
    expect(source).toContain(
      'if (menu.anchorRect.width > 0 && menu.anchorRect.height > 0) return;'
    );
    expect(source).toContain('const nextRect = menuRectFromLayout(event);');
    expect(source).not.toContain('menuLayoutHasGlobalPosition(event)');
    expect(source).toContain('void refreshAnchorRect();');
    expect(source).toContain('synara-menu-sub-trigger-');
    expect(source).toMatch(
      /<view[\s\S]{0,120}ref=\{menu\.triggerRef\}[\s\S]{0,80}flatten=\{false\}/
    );
    expect(source).toContain(
      'resolveMenuTriggerRect(\n        triggerIdRef.current!,\n        menu.triggerRef'
    );
    expect(source).toContain('opacity: positioned ? 1 : 0');
    expect(source).toContain('...props.style');
    expect(source).not.toContain(
      "visibility: positioned ? 'visible' : 'hidden'"
    );
  });

  it('normalizes global anchors into a nested Web layer viewport', () => {
    expect(
      resolveMenuCoordinates({
        align: 'end',
        anchor: { x: 993, y: 489, width: 70, height: 28 },
        popup: { x: 0, y: 0, width: 260, height: 222 },
        side: 'top',
        sideOffset: 6,
        viewport: { x: 408, y: 429, width: 1280, height: 820 },
      })
    ).toEqual({ left: 395, top: 0 });
    expect(
      resolveMenuCoordinates({
        align: 'end',
        anchor: { x: 993, y: 489, width: 70, height: 28 },
        popup: { x: 0, y: 0, width: 260, height: 222 },
        side: 'top',
        sideOffset: 6,
        viewport: { x: 0, y: 0, width: 1280, height: 820 },
      })
    ).toEqual({ left: 803, top: 261 });
  });

  it('opens from its anchor and dismisses from item, backdrop, and Escape', async () => {
    const onAction = rs.fn();
    const onOpenChange = rs.fn();

    render(
      <Menu onOpenChange={onOpenChange}>
        <MenuTrigger ariaLabel="Open actions">
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
    expect(trigger.getAttribute('accessibility-label')).toBe('Open actions');
    expect(trigger.getAttribute('accessibility-value')).toBe('Collapsed');

    await openMenu();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('accessibility-value')).toBe('Expanded');
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

  it('supports explicit trigger activation without toggling menu state', () => {
    const onActivate = rs.fn();
    const onOpenChange = rs.fn();
    render(
      <Menu onOpenChange={onOpenChange}>
        <MenuTrigger onActivate={onActivate}>
          <text>Activate</text>
        </MenuTrigger>
        <MenuPopup>
          <MenuItem onClick={() => {}}>Hidden</MenuItem>
        </MenuPopup>
      </Menu>
    );

    fireEvent.tap(menuTrigger());

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(elementTree.root?.querySelector('.LxMenuPopup')).toBeNull();
  });

  it('keeps passive anchor triggers out of accessibility and activation', () => {
    const onOpenChange = rs.fn();
    render(
      <Menu onOpenChange={onOpenChange}>
        <MenuTrigger passive>
          <text>Search field</text>
        </MenuTrigger>
      </Menu>
    );

    const trigger = menuTrigger();
    expect(trigger.getAttribute('focusable')).toBe('false');
    expect(trigger.getAttribute('accessibility-element')).toBe('false');
    fireEvent.tap(trigger);
    expect(onOpenChange).not.toHaveBeenCalled();
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

  it('renders the switch variant with a checked track and thumb', async () => {
    const onCheckedChange = rs.fn();
    render(
      <Menu defaultOpen>
        <MenuTrigger>
          <text>Open</text>
        </MenuTrigger>
        <MenuPopup>
          <MenuCheckboxItem
            checked
            variant="switch"
            onCheckedChange={onCheckedChange}
          >
            Plan mode
          </MenuCheckboxItem>
        </MenuPopup>
      </Menu>
    );

    const switchTrack = await waitFor(() => {
      const element = elementTree.root?.querySelector('.LxMenuSwitch');
      if (!element) throw new Error('expected switch track');
      return element;
    });
    expect(switchTrack.getAttribute('class')).toContain(
      'LxMenuSwitch--checked'
    );
    expect(
      elementTree.root?.querySelector('.LxMenuSwitch__thumb')
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelector('.LxMenuIndicator')
    ).toBeNull();
    const item = elementTree.root?.querySelector('.LxMenuItem--switch');
    if (!item) throw new Error('expected switch menu item');
    expect(item.getAttribute('role')).toBe('menuitemcheckbox');
    expect(item.getAttribute('accessibility-role')).toBe('switch');
    expect(item.getAttribute('aria-checked')).toBe('true');
    expect(item.getAttribute('accessibility-value')).toBe('Selected');
    fireEvent.tap(item);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(elementTree.root?.querySelector('.LxMenuPopup')).not.toBeNull();
  });

  it('publishes radio and checkbox selection on the interactive menu item', async () => {
    render(
      <Menu defaultOpen>
        <MenuTrigger>
          <text>Open</text>
        </MenuTrigger>
        <MenuPopup>
          <MenuRadioGroup value="normal">
            <MenuRadioItem value="normal">Default</MenuRadioItem>
            <MenuRadioItem value="fast">Fast</MenuRadioItem>
          </MenuRadioGroup>
          <MenuCheckboxItem checked onCheckedChange={() => undefined}>
            Enabled
          </MenuCheckboxItem>
        </MenuPopup>
      </Menu>
    );

    const items = await waitFor(() => {
      const elements = elementTree.root?.querySelectorAll('.LxMenuItem') ?? [];
      if (elements.length !== 3) throw new Error('expected selection menu items');
      return elements;
    });
    expect(items[0]?.getAttribute('role')).toBe('menuitemradio');
    expect(items[0]?.getAttribute('accessibility-role')).toBe('radio');
    expect(items[0]?.getAttribute('aria-checked')).toBe('true');
    expect(items[0]?.getAttribute('accessibility-value')).toBe('Selected');
    expect(items[1]?.getAttribute('aria-checked')).toBe('false');
    expect(items[1]?.getAttribute('accessibility-value')).toBe('Not selected');
    expect(items[2]?.getAttribute('role')).toBe('menuitemcheckbox');
    expect(items[2]?.getAttribute('accessibility-role')).toBe('checkbox');
    expect(items[2]?.getAttribute('aria-checked')).toBe('true');
  });

  it('uses generated Check and Chevron identities for shared menu states', () => {
    render(
      <Menu defaultOpen>
        <MenuTrigger>
          <text>Open</text>
        </MenuTrigger>
        <MenuPopup>
          <MenuCheckboxItem checked onCheckedChange={() => undefined}>
            Enabled
          </MenuCheckboxItem>
          <MenuSub>
            <MenuSubTrigger>More</MenuSubTrigger>
          </MenuSub>
        </MenuPopup>
      </Menu>
    );

    expect(
      elementTree.root?.querySelector('.LxMenuIndicatorIcon')
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelector('.LxMenuSubTrigger__chevron')
    ).not.toBeNull();
    const source = readFileSync(
      new URL('./menu.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).not.toContain("{props.checked ? '✓' : ''}");
    expect(source).not.toContain('>›</text>');
  });

  it('keeps submenu content independent until its trigger opens it', async () => {
    render(
      <Menu defaultOpen>
        <MenuTrigger>
          <text>Open</text>
        </MenuTrigger>
        <MenuPopup>
          <MenuSub>
            <MenuSubTrigger>Fast</MenuSubTrigger>
            <MenuSubPopup>
              <MenuRadioGroup value="normal">
                <MenuRadioItem value="normal">Default</MenuRadioItem>
                <MenuRadioItem value="fast">Fast</MenuRadioItem>
              </MenuRadioGroup>
            </MenuSubPopup>
          </MenuSub>
        </MenuPopup>
      </Menu>
    );

    expect(elementTree.root?.querySelector('.LxMenuSubPopup')).toBeNull();
    const trigger = await waitFor(() => {
      const element = elementTree.root?.querySelector('.LxMenuSubTrigger');
      if (!element) throw new Error('expected submenu trigger');
      return element;
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.tap(trigger);
    const popup = await waitFor(() => {
      const element = elementTree.root?.querySelector('.LxMenuSubPopup');
      if (!element) throw new Error('expected independent submenu popup');
      return element;
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(popup.getAttribute('role')).toBe('menu');
  });

  it('opens submenus on pointer intent and supports directional keyboard dismissal', async () => {
    render(
      <Menu defaultOpen>
        <MenuTrigger>Open</MenuTrigger>
        <MenuPopup>
          <MenuSub>
            <MenuSubTrigger>Model</MenuSubTrigger>
            <MenuSubPopup>Models</MenuSubPopup>
          </MenuSub>
        </MenuPopup>
      </Menu>
    );
    const trigger = elementTree.root?.querySelector('.LxMenuSubTrigger');
    fireEvent(trigger!, new Event('bindEvent:mouseenter', { bubbles: true }));
    await waitFor(() =>
      expect(elementTree.root?.querySelector('.LxMenuSubPopup')).not.toBeNull()
    );
    fireCatchKeyDown(trigger!, { key: 'ArrowLeft' });
    await waitFor(() =>
      expect(elementTree.root?.querySelector('.LxMenuSubPopup')).toBeNull()
    );
  });

  it('dismisses the parent menu when Escape is pressed after its submenu closes', async () => {
    const onOpenChange = rs.fn();
    render(
      <Menu defaultOpen onOpenChange={onOpenChange}>
        <MenuTrigger>Open</MenuTrigger>
        <MenuPopup>
          <MenuSub defaultOpen>
            <MenuSubTrigger>Model</MenuSubTrigger>
            <MenuSubPopup>Models</MenuSubPopup>
          </MenuSub>
        </MenuPopup>
      </Menu>
    );
    const trigger = elementTree.root?.querySelector('.LxMenuSubTrigger');
    fireCatchKeyDown(trigger!, { key: 'Escape' });
    await waitFor(() =>
      expect(elementTree.root?.querySelector('.LxMenuSubPopup')).toBeNull()
    );
    fireCatchKeyDown(trigger!, { key: 'Escape' });
    await waitFor(() =>
      expect(elementTree.root?.querySelector('.LxMenuPopup')).toBeNull()
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('notifies a submenu owner before opening from pointer intent', async () => {
    const onOpen = rs.fn();
    render(
      <Menu defaultOpen>
        <MenuTrigger>Open</MenuTrigger>
        <MenuPopup>
          <MenuSub>
            <MenuSubTrigger onOpen={onOpen}>Model</MenuSubTrigger>
            <MenuSubPopup>Models</MenuSubPopup>
          </MenuSub>
        </MenuPopup>
      </Menu>
    );
    const trigger = elementTree.root?.querySelector('.LxMenuSubTrigger');
    fireEvent(trigger!, new Event('bindEvent:mouseenter', { bubbles: true }));
    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1));
  });

  it('supports controlled submenu ownership', async () => {
    const onOpenChange = rs.fn();
    render(
      <Menu defaultOpen>
        <MenuTrigger>Open</MenuTrigger>
        <MenuPopup>
          <MenuSub open={false} onOpenChange={onOpenChange}>
            <MenuSubTrigger>Model</MenuSubTrigger>
            <MenuSubPopup>Models</MenuSubPopup>
          </MenuSub>
        </MenuPopup>
      </Menu>
    );
    const trigger = elementTree.root?.querySelector('.LxMenuSubTrigger');
    fireEvent.tap(trigger!);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(elementTree.root?.querySelector('.LxMenuSubPopup')).toBeNull();
  });

  it('uses the viewport-clamped top coordinate for end-aligned submenus', () => {
    const source = readFileSync(new URL('./menu.lynx.tsx', import.meta.url), 'utf8');
    expect(source).toMatch(/top:\s*\x60\$\{Math\.round\(coordinates\.top\)\}px\x60/);
    expect(source).toContain("props.align === 'end' ? { bottom: 'auto' } : {}");
  });

  it('normalizes Native popup-local trigger rectangles before portal placement', () => {
    const source = readFileSync(new URL('./menu.lynx.tsx', import.meta.url), 'utf8');
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(source).toContain('parentOrigin.x + rect.left');
    expect(source).toContain('parentOrigin.y + rect.top');
    expect(source).toContain('props.portaled ? (');
    expect(source).toContain('className="LxMenuSubLayer" catchtap={menu.close}');
    expect(styles).toMatch(
      /\.LxMenuSubLayer\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*1102;[^}]*width:\s*100vw;[^}]*height:\s*100vh;/s
    );
  });

});
