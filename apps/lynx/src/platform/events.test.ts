import { afterEach, describe, expect, it } from "@rstest/core";

import {
  addDocumentEventListener,
  addWindowEventListener,
  dispatchWindowEvent,
  removeWindowEventListener,
  resetWindowEventListenersForTest,
} from "./events";

describe("Lynx events port", () => {
  afterEach(() => {
    resetWindowEventListenersForTest();
  });

  it("delivers renderer-local bus events with their detail", () => {
    const received: unknown[] = [];
    const listener = (event: Event) => received.push((event as CustomEvent).detail);
    addWindowEventListener("synara:ws-transport-state", listener);

    dispatchWindowEvent(
      new CustomEvent("synara:ws-transport-state", { detail: { state: "open" } }),
    );
    removeWindowEventListener("synara:ws-transport-state", listener);
    dispatchWindowEvent(
      new CustomEvent("synara:ws-transport-state", { detail: { state: "closed" } }),
    );

    expect(received).toEqual([{ state: "open" }]);
  });

  it("isolates listener failures and accepts document listeners as no-ops", () => {
    const received: string[] = [];
    addWindowEventListener("probe", () => {
      throw new Error("boom");
    });
    addWindowEventListener("probe", () => received.push("second"));
    addDocumentEventListener("visibilitychange", () => received.push("document"));

    expect(dispatchWindowEvent(new Event("probe"))).toBe(true);
    expect(received).toEqual(["second"]);
  });
});
