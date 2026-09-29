import { beforeEach, describe, expect, it, rs } from "@rstest/core";
import { readFileSync } from "node:fs";
import { useState } from "@lynx-js/react";
import { fireEvent, render } from "@lynx-js/react/testing-library";

import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandInput,
  CommandItem,
} from "./command.lynx";

beforeEach(() => {
  Object.assign(lynx, {
    requestAnimationFrame(callback: () => void) {
      callback();
      return 0;
    },
  });
});

function commandItem(): Element {
  const item = elementTree.root?.querySelector(".LxCommandItem");
  if (!item) throw new Error("expected CommandItem");
  return item;
}

function fireCatchKeyDown(
  element: Element,
  payload: { readonly key: string; readonly shiftKey?: boolean },
) {
  const event = new Event("catchEvent:keydown", { bubbles: true });
  Object.assign(event, payload);
  fireEvent(element, event);
}

function fireGlobalKeyDown(
  element: Element,
  payload: { readonly key: string; readonly shiftKey?: boolean },
) {
  const event = new Event("globalEvent:keydown", { bubbles: true });
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

describe("Lynx CommandItem interaction contract", () => {
  it("honors an explicitly disabled initial highlight", () => {
    render(
      <Command autoHighlight={false}>
        <CommandItem value="first" onClick={() => {}}>
          <text>First</text>
        </CommandItem>
        <CommandItem value="last" onClick={() => {}}>
          <text>Last</text>
        </CommandItem>
      </Command>,
    );

    const items = elementTree.root?.querySelectorAll(".LxCommandItem") ?? [];
    expect(items[0]?.getAttribute("class")).not.toContain("LxCommandItem--highlighted");
    expect(items[1]?.getAttribute("class")).not.toContain("LxCommandItem--highlighted");
  });

  it("keeps the command-row radius on the rendered Native node", () => {
    render(
      <Command>
        <CommandItem value="recent" onClick={() => {}}>
          Recent
        </CommandItem>
      </Command>,
    );
    expect(elementTree.root?.querySelector(".LxCommandItem")?.getAttribute("style")).toContain(
      "border-radius: 10px",
    );
  });

  it("keeps the command search row transparent and the footer horizontally split", () => {
    const commandSource = readFileSync(new URL("./command.lynx.tsx", import.meta.url), "utf8");
    const primitiveStyles = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");
    const sidebarStyles = readFileSync(
      new URL("../../app/sidebar-disclosure.css", import.meta.url),
      "utf8",
    );

    expect(commandSource).toContain('className={cx("LxCommandTextarea", props.className)}');
    expect(commandSource).toContain("<textarea");
    expect(commandSource).toContain('confirm-type="search"');
    expect(commandSource).toContain("global-bindkeydown={handleKeyDown}");
    expect(commandSource).toContain('className={cx("LxCommandList", props.className)}');
    expect(commandSource).toContain('scroll-orientation="vertical"');
    expect(commandSource).toContain(
      '<view className="LxCommandInput" catchkeydown={handleKeyDown}>',
    );
    expect(commandSource).toMatch(/<textarea[\s\S]*?bindkeydown=\{handleKeyDown\}/);
    expect(commandSource).toContain("bindconfirm={() => {");
    expect(commandSource).not.toContain("<Input");
    expect(primitiveStyles).toContain(".LxCommandTextarea");
    expect(primitiveStyles).toMatch(
      /\.LxCommandTextarea\s*\{[^}]*height:\s*36px;[^}]*box-sizing:\s*border-box;[^}]*padding-top:\s*9px;[^}]*padding-bottom:\s*9px;[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxCommandInput > svg\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*flex-shrink:\s*0;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxCommandInput\s*\{[^}]*flex-shrink:\s*0;[^}]*height:\s*48px;[^}]*min-height:\s*48px;[^}]*box-sizing:\s*border-box;/s,
    );
    expect(commandSource).toContain('viewportClassName="LxCommandDialogViewport"');
    expect(commandSource).toContain("bottomStickOnMobile={false}");
    expect(primitiveStyles).toMatch(
      /\.LxDialogViewport\.LxCommandDialogViewport\s*\{[^}]*z-index:\s*2100;[^}]*padding-top:\s*4vh;[^}]*padding-bottom:\s*15vh;/s,
    );
    expect(sidebarStyles).toMatch(/\.SidebarResizeOverlay\s*\{[^}]*z-index:\s*2000;/s);
    expect(primitiveStyles).toMatch(
      /\.LxDialogPopup\.LxCommandDialogPopup\s*\{[^}]*border-radius:\s*18px;[^}]*box-shadow:\s*0 10px 15px -3px rgba\(0,\s*0,\s*0,\s*0\.05\),\s*0 4px 6px -4px rgba\(0,\s*0,\s*0,\s*0\.05\);/s,
    );
    expect(primitiveStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.LxDialogViewport\.LxCommandDialogViewport\s*\{[^}]*padding:\s*8px;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.LxDialogPopup\.LxCommandDialogPopup\s*\{[^}]*height:\s*calc\(100vh - 16px\);[^}]*max-height:\s*calc\(100vh - 16px\);/s,
    );
    expect(primitiveStyles).toMatch(
      /\.SliceRoot--viewport-short-height \.LxCommandPanel\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.SliceRoot--viewport-short-height \.LxCommandList\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;/s,
    );
    expect(primitiveStyles).toMatch(/\.LxCommandList\s*\{[^}]*margin-top:\s*7px;/s);
    expect(primitiveStyles).toMatch(
      /\.LxCommandPanel\s*\{[^}]*border-bottom-width:\s*0;[^}]*border-left-color:\s*var\(--color-border-light, var\(--border\)\);[^}]*border-right-color:\s*var\(--color-border-light, var\(--border\)\);[^}]*border-top-color:\s*var\(--color-border-light, var\(--border\)\);[^}]*border-bottom-color:\s*var\(--color-border-light, var\(--border\)\);[^}]*border-top-left-radius:\s*14px;[^}]*border-top-right-radius:\s*14px;[^}]*box-shadow:\s*0 1px 2px 0 rgba\(0,\s*0,\s*0,\s*0\.05\);/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxCommand \.LxCommandItem\s*\{[^}]*padding:\s*6px 10px;[^}]*border-radius:\s*10px;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxCommandGroupLabel__text\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*500;[^}]*line-height:\s*16px;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxKbd__text\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*500;[^}]*line-height:\s*16px;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxCommandShortcut\s*\{[^}]*margin-left:\s*auto;[^}]*font-size:\s*12px;[^}]*font-weight:\s*500;[^}]*line-height:\s*18px;[^}]*letter-spacing:\s*1\.2px;[^}]*opacity:\s*0\.72;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxCommandFooter\s*\{[^}]*flex-direction:\s*row;[^}]*justify-content:\s*space-between;[^}]*border-bottom-left-radius:\s*17px;[^}]*border-bottom-right-radius:\s*17px;/s,
    );
    expect(primitiveStyles).toMatch(
      /\.LxCommandFooter > text\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
  });

  it("accepts native textarea input without the crashing Flutter input model", () => {
    const onChange = rs.fn();
    render(
      <Command>
        <CommandInput value="" onChange={onChange} />
      </Command>,
    );

    const textarea = elementTree.root?.querySelector(".LxCommandTextarea");
    if (!textarea) throw new Error("expected command textarea");
    const inputEvent = new Event("bindEvent:input", { bubbles: true });
    Object.assign(inputEvent, {
      detail: {
        value: "P9",
        selectionStart: 2,
        selectionEnd: 2,
        isComposing: false,
      },
    });
    textarea.dispatchEvent(inputEvent);

    expect(onChange).toHaveBeenLastCalledWith({
      currentTarget: { value: "P9" },
    });
  });

  it("activates the highlighted command from native textarea confirmation", () => {
    const onClick = rs.fn();
    render(
      <Command>
        <CommandInput value="" onChange={() => {}} />
        <CommandItem value="first" onClick={onClick}>
          <text>First</text>
        </CommandItem>
      </Command>,
    );

    const textarea = elementTree.root?.querySelector(".LxCommandTextarea");
    if (!textarea) throw new Error("expected command textarea");
    textarea.dispatchEvent(new Event("bindEvent:confirm", { bubbles: true }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("publishes hover, pressed, focus, highlight and exact key/tap activation", () => {
    const primitiveStyles = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");
    const onClick = rs.fn();
    const onMouseDown = rs.fn((event: { preventDefault(): void }) => event.preventDefault());
    const onItemHighlighted = rs.fn();

    render(
      <Command onItemHighlighted={onItemHighlighted}>
        <CommandItem value="action:new-thread" onClick={onClick} onMouseDown={onMouseDown}>
          <text>New thread</text>
        </CommandItem>
      </Command>,
    );

    const item = commandItem();
    fireEvent(item, new Event("bindEvent:mouseenter", { bubbles: true }));
    expect(item.getAttribute("class")).toContain("ui-hover");
    expect(onItemHighlighted).toHaveBeenLastCalledWith("action:new-thread");
    expect(primitiveStyles).toMatch(
      /\.LxCommandItem\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s,
    );
    expect(primitiveStyles).not.toMatch(/\.LxCommandItem\.ui-pressed\s*\{[^}]*opacity:/s);

    fireEvent.mousedown(item);
    expect(item.getAttribute("class")).toContain("ui-pressed");
    expect(onMouseDown).toHaveBeenCalledTimes(1);

    fireEvent.mouseup(item);
    expect(item.getAttribute("class")).not.toContain("ui-pressed");

    fireEvent.focus(item);
    expect(item.getAttribute("class")).toContain("ui-focus");
    expect(onItemHighlighted).toHaveBeenLastCalledWith("action:new-thread");

    fireCatchKeyDown(item, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.tap(item);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("keeps the primitive as the single command item radius owner", () => {
    render(
      <Command>
        <CommandItem value="first" className="cursor-pointer rounded-lg px-2.5" onClick={() => {}}>
          <text>First</text>
        </CommandItem>
      </Command>,
    );

    expect(commandItem().getAttribute("class")).toContain("cursor-pointer");
    expect(commandItem().getAttribute("class")).toContain("px-2.5");
    expect(commandItem().getAttribute("class")).not.toContain("rounded-lg");
  });

  it("keeps disabled items unfocusable and handler-free", () => {
    const onClick = rs.fn();
    const onMouseDown = rs.fn();
    const onItemHighlighted = rs.fn();

    render(
      <Command onItemHighlighted={onItemHighlighted}>
        <CommandItem disabled value="action:disabled" onClick={onClick} onMouseDown={onMouseDown}>
          <text>Unavailable</text>
        </CommandItem>
      </Command>,
    );

    const item = commandItem();
    expect(item.getAttribute("focusable")).toBe("false");
    expect(item.getAttribute("aria-disabled")).toBe("true");

    fireEvent.mousedown(item);
    fireEvent.focus(item);
    fireCatchKeyDown(item, { key: "Enter" });
    fireEvent.tap(item);

    expect(onMouseDown).not.toHaveBeenCalled();
    expect(onItemHighlighted).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(item.getAttribute("class")).toBe("LxCommandItem LxCommandItem--disabled");
  });

  it("moves in visual order, skips disabled items, and activates the highlighted item", () => {
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
      </Command>,
    );

    const items = elementTree.root?.querySelectorAll(".LxCommandItem") ?? [];
    const keyboardTarget = elementTree.root?.querySelector(".LxCommandInput");
    if (!keyboardTarget) throw new Error("expected CommandInput keyboard owner");
    expect(items[0]?.getAttribute("class")).toContain("LxCommandItem--highlighted");

    fireCatchKeyDown(keyboardTarget, { key: "ArrowDown" });
    expect(items[2]?.getAttribute("class")).toContain("LxCommandItem--highlighted");
    fireCatchKeyDown(keyboardTarget, { key: "Enter" });
    expect(lastAction).toHaveBeenCalledTimes(1);
    expect(firstAction).not.toHaveBeenCalled();
    expect(disabledAction).not.toHaveBeenCalled();

    fireCatchKeyDown(keyboardTarget, { key: "Tab" });
    expect(items[0]?.getAttribute("class")).toContain("LxCommandItem--highlighted");
    fireCatchKeyDown(keyboardTarget, { key: "Tab", shiftKey: true });
    expect(items[2]?.getAttribute("class")).toContain("LxCommandItem--highlighted");
  });

  it("dismisses the controlled command dialog from input Escape", () => {
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
      </CommandDialog>,
    );

    const input = elementTree.root?.querySelector(".LxCommandInput");
    if (!input) throw new Error("expected CommandInput keyboard owner");
    fireCatchKeyDown(input, { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("preserves navigation when the owner rerenders with inline actions", () => {
    const firstAction = rs.fn();
    const lastAction = rs.fn();
    render(<RerenderingCommand firstAction={firstAction} lastAction={lastAction} />);

    const items = elementTree.root?.querySelectorAll(".LxCommandItem") ?? [];
    const first = items[0];
    if (!first) throw new Error("expected first CommandItem");
    fireCatchKeyDown(first, { key: "ArrowDown" });
    const movedItems = elementTree.root?.querySelectorAll(".LxCommandItem") ?? [];
    expect(movedItems[1]?.getAttribute("class")).toContain("LxCommandItem--highlighted");
    fireCatchKeyDown(movedItems[1]!, { key: "Enter" });
    expect(lastAction).toHaveBeenCalledTimes(1);
    expect(firstAction).not.toHaveBeenCalled();
  });
});
