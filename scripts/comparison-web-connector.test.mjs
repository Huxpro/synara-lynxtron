import { describe, expect, it } from "vitest";

import { nativeNodesMatchingClasses } from "./comparison-measure.mjs";
import {
  cdpPortFromClientId,
  collectLynxWebTree,
  createWebConnector,
  isLynxWebPageTarget,
  lynxWebBoxModel,
  mouseEventsForTouch,
  pageErrorFromCdpEvent,
  takeLynxWebPageErrors,
} from "./comparison-web-connector.mjs";
import { nativeTargetMatches } from "./comparison-workflow.mjs";

function element(tagName, attributes = {}, children = [], extra = {}) {
  return {
    tagName,
    children,
    isConnected: true,
    getAttributeNames: () => Object.keys(attributes),
    getAttribute: (name) => attributes[name] ?? null,
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    ...extra,
  };
}

const rect = (left, top, width, height) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});

const registry = () => ({ next: 1, elements: new Map(), ids: new WeakMap() });

describe("Lynx-for-Web DevTool connector", () => {
  it("reduces the shadow tree to the DevTool's document shape", () => {
    const label = element("X-TEXT", { class: "Title" }, [
      element("RAW-TEXT", { text: "New thread" }),
    ]);
    const button = element(
      "X-VIEW",
      { class: "AppRailButton active", "accessibility-label": "Home" },
      [label],
    );
    const shadowRoot = {
      children: [
        element("STYLE"),
        element("LINK"),
        element("X-VIEW", { class: "SliceRoot" }, [
          // A wrapper has no box and no Native counterpart: its children take its place.
          element("LYNX-WRAPPER", {}, [button]),
        ]),
      ],
    };
    const { root } = collectLynxWebTree(shadowRoot, registry());
    expect(root.nodeName).toBe("#document");
    expect(root.children).toHaveLength(1);
    const [slice] = root.children;
    expect(slice.nodeName).toBe("VIEW");
    expect(slice.children[0].attributes).toEqual([
      "class",
      "AppRailButton active",
      "accessibility-label",
      "Home",
    ]);
    // The harness's own matchers read it as they read a Native tree.
    expect(nativeNodesMatchingClasses(root, ".AppRailButton.active")).toHaveLength(1);
    expect(nativeTargetMatches(slice.children[0], { label: "Home" })).toBe(true);
    expect(nativeTargetMatches(slice.children[0].children[0], { text: "New thread" })).toBe(true);
  });

  it("keeps an element's id across reads and forgets detached elements", () => {
    const first = element("X-VIEW");
    const second = element("X-VIEW");
    const shadowRoot = { children: [first, second] };
    const shared = registry();
    const before = collectLynxWebTree(shadowRoot, shared).root.children.map((node) => node.nodeId);
    second.isConnected = false;
    shadowRoot.children = [first];
    const after = collectLynxWebTree(shadowRoot, shared).root.children.map((node) => node.nodeId);
    expect(after).toEqual([before[0]]);
    expect(shared.elements.has(before[1])).toBe(false);
    expect(collectLynxWebTree(null, registry()).root.children).toEqual([]);
  });

  it("reports an element's border box as a quad", () => {
    const shared = registry();
    const box = element("X-VIEW", {}, [], { getBoundingClientRect: () => rect(10, 20, 30, 40) });
    const [{ nodeId }] = collectLynxWebTree({ children: [box] }, shared).root.children;
    expect(lynxWebBoxModel(shared, nodeId, () => "flex")).toEqual({
      model: { border: [10, 20, 40, 20, 40, 60, 10, 60] },
    });
    expect(lynxWebBoxModel(shared, 999, () => "flex")).toBeNull();
  });

  it("gives a display:contents element the box of its rendered parts", () => {
    const shared = registry();
    const inner = element("TEXTAREA", {}, [], {
      getBoundingClientRect: () => rect(437, 716, 708, 42),
    });
    const form = element("FORM", {}, [inner]);
    const textarea = element("X-TEXTAREA", { "accessibility-label": "Message composer" }, [], {
      shadowRoot: { children: [element("STYLE"), form] },
    });
    const display = (node) => (node === textarea || node === form ? "contents" : "block");
    const [{ nodeId }] = collectLynxWebTree({ children: [textarea] }, shared).root.children;
    expect(lynxWebBoxModel(shared, nodeId, display).model.border).toEqual([
      437, 716, 1145, 716, 1145, 758, 437, 758,
    ]);
    // A hidden element (zero size, not display:contents) stays zero: it is not on screen.
    expect(lynxWebBoxModel(shared, nodeId, () => "none").model.border).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it("turns the DevTool's touch emulation into a click's mouse sequence", () => {
    const press = mouseEventsForTouch({ type: "mousePressed", x: 5, y: 6 }, false);
    expect(press.pressed).toBe(true);
    expect(press.events.map((event) => [event.type, event.button, event.buttons])).toEqual([
      ["mouseMoved", "none", 0],
      ["mousePressed", "left", 1],
    ]);
    const drag = mouseEventsForTouch({ type: "mouseMoved", x: 5, y: 9 }, true);
    expect(drag.events).toEqual([{ type: "mouseMoved", x: 5, y: 9, button: "left", buttons: 1 }]);
    const release = mouseEventsForTouch({ type: "mouseReleased", x: 5, y: 9 }, true);
    expect(release.pressed).toBe(false);
    expect(release.events[0]).toMatchObject({ type: "mouseReleased", clickCount: 1 });
    expect(() => mouseEventsForTouch({ type: "mouseWheel", x: 0, y: 0 }, false)).toThrow(
      /Unsupported/,
    );
  });

  it("finds the Lynx-for-Web page among a browser's targets", () => {
    expect(cdpPortFromClientId("localhost:9741")).toBe(9741);
    expect(() => cdpPortFromClientId("localhost")).toThrow(/no port/);
    expect(
      isLynxWebPageTarget({ type: "page", url: "http://localhost:6464/lynx/?route=%2F" }),
    ).toBe(true);
    expect(isLynxWebPageTarget({ type: "page", url: "http://localhost:6464/thread/a" })).toBe(
      false,
    );
    expect(isLynxWebPageTarget({ type: "worker", url: "http://localhost:6464/lynx/w.js" })).toBe(
      false,
    );
    expect(isLynxWebPageTarget({ type: "page", url: "about:blank" })).toBe(false);
  });

  it("reads errors, and only errors, from protocol events", () => {
    expect(
      pageErrorFromCdpEvent({
        method: "Runtime.exceptionThrown",
        params: { exceptionDetails: { exception: { description: "TypeError: x" } } },
      }),
    ).toBe("exception: TypeError: x");
    expect(
      pageErrorFromCdpEvent({
        method: "Runtime.consoleAPICalled",
        params: { type: "error", args: [{ value: "[lynx-web]" }, { description: "boom" }] },
      }),
    ).toBe("console.error: [lynx-web] boom");
    expect(
      pageErrorFromCdpEvent({
        method: "Runtime.consoleAPICalled",
        params: { type: "log", args: [] },
      }),
    ).toBeNull();
  });

  it("answers the driver's methods from the page and refuses the ones it does not know", async () => {
    const sent = [];
    let onEvent;
    const connector = createWebConnector({
      listTargets: async () => [
        { id: "blank", type: "page", url: "about:blank" },
        {
          id: "lynx",
          type: "page",
          url: "http://localhost:6464/lynx/",
          webSocketDebuggerUrl: "ws://x",
        },
      ],
      openSession: async (_url, options) => {
        onEvent = options.onEvent;
        return {
          send: async (method, params, sessionId) => {
            sent.push([method, params, sessionId]);
            if (method === "Runtime.evaluate")
              return { result: { value: { root: { nodeId: 0 } } } };
            return {};
          },
          close() {},
        };
      },
    });
    const sessions = await connector.sendListSessionMessage("localhost:9741");
    expect(sessions.map((session) => session.session_id)).toEqual(["lynx"]);
    const document = await connector.sendCDPMessage("localhost:9741", "lynx", "DOM.getDocument", {
      depth: -1,
    });
    expect(document.result).toEqual({ root: { nodeId: 0 } });
    await connector.sendCDPMessage("localhost:9741", "lynx", "Input.emulateTouchFromMouseEvent", {
      type: "mousePressed",
      x: 1,
      y: 2,
    });
    expect(sent.filter(([method]) => method === "Input.dispatchMouseEvent")).toHaveLength(2);
    // One attach: the session is reused.
    expect(sent.filter(([method]) => method === "Target.setAutoAttach")).toHaveLength(1);
    // A worker (the Lynx background thread) is attached so its errors are heard too.
    onEvent({ method: "Target.attachedToTarget", params: { sessionId: "worker-1" } });
    expect(sent.at(-1)).toEqual(["Runtime.enable", {}, "worker-1"]);
    onEvent({
      method: "Runtime.consoleAPICalled",
      params: { type: "error", args: [{ value: "from the worker" }] },
    });
    expect(takeLynxWebPageErrors(9741)).toEqual(["console.error: from the worker"]);
    expect(takeLynxWebPageErrors(9741)).toEqual([]);
    await expect(
      connector.sendCDPMessage("localhost:9741", "lynx", "CSS.getComputedStyleForNode", {}),
    ).rejects.toThrow(/does not implement/);
    await expect(
      connector.sendCDPMessage("localhost:9741", "gone", "DOM.getDocument", {}),
    ).rejects.toThrow(/No Lynx-for-Web page/);
  });
});
