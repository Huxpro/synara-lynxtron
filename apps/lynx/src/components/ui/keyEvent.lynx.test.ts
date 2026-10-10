import { describe, expect, it, rs } from "@rstest/core";

import type { LynxInputKeyEvent } from "./input.lynx";
import { hostKeyHandler, keyHandlerForHost } from "./keyEvent.lynx";

describe("host key handler", () => {
  it("is the handler itself on the desktop host", () => {
    const handler = (_event: LynxInputKeyEvent) => undefined;
    expect(keyHandlerForHost(handler, false)).toBe(handler);
    // Tests and the Native bundle do not set the Lynx-for-Web flag.
    expect(hostKeyHandler(handler)).toBe(handler);
  });

  it("lets a handler call the event's methods on a cloned web event", () => {
    const seen: string[] = [];
    const handler = keyHandlerForHost((event: LynxInputKeyEvent) => {
      event.preventDefault();
      event.stopPropagation();
      seen.push(`${event.key}:${String(event.shiftKey)}`);
    }, true);
    // What web-core delivers: plain data, no methods.
    handler({ key: "Enter", shiftKey: false } as unknown as LynxInputKeyEvent);
    expect(seen).toEqual(["Enter:false"]);
  });

  it("still reaches methods an event does carry", () => {
    const preventDefault = rs.fn();
    const stopPropagation = rs.fn();
    keyHandlerForHost((event: LynxInputKeyEvent) => {
      event.preventDefault();
      event.stopPropagation();
    }, true)({ key: "Tab", preventDefault, stopPropagation });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });
});
