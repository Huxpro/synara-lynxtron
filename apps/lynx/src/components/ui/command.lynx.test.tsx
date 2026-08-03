import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { readFileSync } from 'node:fs';
import { useState } from '@lynx-js/react';
import {
  fireEvent,
  render,
} from '@lynx-js/react/testing-library';

import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandInput,
  CommandItem,
} from './command.lynx';

beforeEach(() => {
  Object.assign(lynx, {
    requestAnimationFrame(callback: () => void) {
      callback();
      return 0;
    },
  });
});

function commandItem(): Element {
  const item = elementTree.root?.querySelector('.LxCommandItem');
  if (!item) throw new Error('expected CommandItem');
  return item;
}

function fireCatchKeyDown(
  element: Element,
  payload: { readonly key: string; readonly shiftKey?: boolean }
) {
  const event = new Event('catchEvent:keydown', { bubbles: true });
  Object.assign(event, payload);
  fireEvent(element, event);
}

function RerenderingCommand(props: {
  readonly firstAction: () => void;
  readonly lastAction: () => void;
}) {
  const [, setHighlighted] = useState<string | null>(null);
  return (
    <Command onItemHighlighted={(value) => setHighlighted(value)}>
      <CommandItem value="first" onClick={() => props.firstAction()}>
        <text>First</text>
      </CommandItem>
      <CommandItem value="last" onClick={() => props.lastAction()}>
        <text>Last</text>
      </CommandItem>
    </Command>
  );
}

describe('Lynx CommandItem interaction contract', () => {
  it('keeps the command search row transparent and the footer horizontally split', () => {
    const commandSource = readFileSync(
      new URL('./command.lynx.tsx', import.meta.url),
      'utf8'
    );
    const primitiveStyles = readFileSync(
      new URL('./primitives.css', import.meta.url),
      'utf8'
    );

    expect(commandSource).toContain("className={cx('LxCommandTextarea', props.className)}");
    expect(commandSource).toContain('<textarea');
    expect(commandSource).toContain('confirm-type="search"');
    expect(commandSource).toContain('bindconfirm={() => {');
    expect(commandSource).not.toContain('<Input');
    expect(primitiveStyles).toContain('.LxCommandTextarea');
    expect(commandSource).toContain(
      'viewportClassName="LxCommandDialogViewport"'
    );
    expect(primitiveStyles).toMatch(
      /\.LxDialogViewport\.LxCommandDialogViewport\s*\{[^}]*padding-top:\s*4vh;[^}]*padding-bottom:\s*15vh;/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxCommandFooter\s*\{[^}]*flex-direction:\s*row;[^}]*justify-content:\s*space-between;/s
    );
  });

  it('accepts native textarea input without the crashing Flutter input model', () => {
    const onChange = rs.fn();
    render(
      <Command>
        <CommandInput value="" onChange={onChange} />
      </Command>
    );

    const textarea = elementTree.root?.querySelector('.LxCommandTextarea');
    if (!textarea) throw new Error('expected command textarea');
    const inputEvent = new Event('bindEvent:input', { bubbles: true });
    Object.assign(inputEvent, {
      detail: {
        value: 'P9',
        selectionStart: 2,
        selectionEnd: 2,
        isComposing: false,
      },
    });
    textarea.dispatchEvent(inputEvent);

    expect(onChange).toHaveBeenLastCalledWith({
      currentTarget: { value: 'P9' },
    });
  });

  it('activates the highlighted command from native textarea confirmation', () => {
    const onClick = rs.fn();
    render(
      <Command>
        <CommandInput value="" onChange={() => {}} />
        <CommandItem value="first" onClick={onClick}>
          <text>First</text>
        </CommandItem>
      </Command>
    );

    const textarea = elementTree.root?.querySelector('.LxCommandTextarea');
    if (!textarea) throw new Error('expected command textarea');
    textarea.dispatchEvent(new Event('bindEvent:confirm', { bubbles: true }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('publishes hover, pressed, focus, highlight and exact key/tap activation', () => {
    const onClick = rs.fn();
    const onMouseDown = rs.fn(
      (event: { preventDefault(): void }) => event.preventDefault()
    );
    const onItemHighlighted = rs.fn();

    render(
      <Command onItemHighlighted={onItemHighlighted}>
        <CommandItem
          value="action:new-thread"
          onClick={onClick}
          onMouseDown={onMouseDown}
        >
          <text>New thread</text>
        </CommandItem>
      </Command>
    );

    const item = commandItem();
    fireEvent(
      item,
      new Event('bindEvent:mouseenter', { bubbles: true })
    );
    expect(item.getAttribute('class')).toContain('ui-hover');
    expect(onItemHighlighted).toHaveBeenLastCalledWith('action:new-thread');

    fireEvent.mousedown(item);
    expect(item.getAttribute('class')).toContain('ui-pressed');
    expect(onMouseDown).toHaveBeenCalledTimes(1);

    fireEvent.mouseup(item);
    expect(item.getAttribute('class')).not.toContain('ui-pressed');

    fireEvent.focus(item);
    expect(item.getAttribute('class')).toContain('ui-focus');
    expect(onItemHighlighted).toHaveBeenLastCalledWith('action:new-thread');

    fireCatchKeyDown(item, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.tap(item);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('keeps disabled items unfocusable and handler-free', () => {
    const onClick = rs.fn();
    const onMouseDown = rs.fn();
    const onItemHighlighted = rs.fn();

    render(
      <Command onItemHighlighted={onItemHighlighted}>
        <CommandItem
          disabled
          value="action:disabled"
          onClick={onClick}
          onMouseDown={onMouseDown}
        >
          <text>Unavailable</text>
        </CommandItem>
      </Command>
    );

    const item = commandItem();
    expect(item.getAttribute('focusable')).toBe('false');
    expect(item.getAttribute('aria-disabled')).toBe('true');

    fireEvent.mousedown(item);
    fireEvent.focus(item);
    fireCatchKeyDown(item, { key: 'Enter' });
    fireEvent.tap(item);

    expect(onMouseDown).not.toHaveBeenCalled();
    expect(onItemHighlighted).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(item.getAttribute('class')).toBe(
      'LxCommandItem LxCommandItem--disabled'
    );
  });

  it('moves in visual order, skips disabled items, and activates the highlighted item', () => {
    const firstAction = rs.fn();
    const disabledAction = rs.fn();
    const lastAction = rs.fn();

    render(
      <Command>
        <CommandInput value="" onChange={() => {}} />
        <CommandItem value="first" onClick={firstAction}>
          <text>First</text>
        </CommandItem>
        <CommandItem disabled value="disabled" onClick={disabledAction}>
          <text>Disabled</text>
        </CommandItem>
        <CommandItem value="last" onClick={lastAction}>
          <text>Last</text>
        </CommandItem>
      </Command>
    );

    const items = elementTree.root?.querySelectorAll('.LxCommandItem') ?? [];
    const keyboardTarget = items[0];
    if (!keyboardTarget) throw new Error('expected CommandItem');
    expect(items[0]?.getAttribute('class')).toContain(
      'LxCommandItem--highlighted'
    );

    fireCatchKeyDown(keyboardTarget, { key: 'ArrowDown' });
    expect(items[2]?.getAttribute('class')).toContain(
      'LxCommandItem--highlighted'
    );
    fireCatchKeyDown(keyboardTarget, { key: 'Enter' });
    expect(lastAction).toHaveBeenCalledTimes(1);
    expect(firstAction).not.toHaveBeenCalled();
    expect(disabledAction).not.toHaveBeenCalled();

    fireCatchKeyDown(keyboardTarget, { key: 'Tab' });
    expect(items[0]?.getAttribute('class')).toContain(
      'LxCommandItem--highlighted'
    );
    fireCatchKeyDown(keyboardTarget, { key: 'Tab', shiftKey: true });
    expect(items[2]?.getAttribute('class')).toContain(
      'LxCommandItem--highlighted'
    );
  });

  it('dismisses the controlled command dialog from input Escape', () => {
    const onOpenChange = rs.fn();
    render(
      <CommandDialog open onOpenChange={onOpenChange}>
        <CommandDialogPopup>
          <Command>
            <CommandInput value="" onChange={() => {}} />
            <CommandItem value="first" onClick={() => {}}>
              <text>First</text>
            </CommandItem>
          </Command>
        </CommandDialogPopup>
      </CommandDialog>
    );

    fireCatchKeyDown(commandItem(), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('preserves navigation when the owner rerenders with inline actions', () => {
    const firstAction = rs.fn();
    const lastAction = rs.fn();
    render(
      <RerenderingCommand
        firstAction={firstAction}
        lastAction={lastAction}
      />
    );

    const items = elementTree.root?.querySelectorAll('.LxCommandItem') ?? [];
    const first = items[0];
    if (!first) throw new Error('expected first CommandItem');
    fireCatchKeyDown(first, { key: 'ArrowDown' });
    const movedItems =
      elementTree.root?.querySelectorAll('.LxCommandItem') ?? [];
    expect(movedItems[1]?.getAttribute('class')).toContain(
      'LxCommandItem--highlighted'
    );
    fireCatchKeyDown(movedItems[1]!, { key: 'Enter' });
    expect(lastAction).toHaveBeenCalledTimes(1);
    expect(firstAction).not.toHaveBeenCalled();
  });
});
