// A Lynx DevTool connector for the Lynx-for-Web host.
//
// `openNativeDriver` (comparison-workflow.mjs) drives Lynxtron through the Lynx DevTool
// connector: it lists sessions, reads the element tree (DOM.getDocument), boxes
// (DOM.getBoxModel), and sends touches and text. Lynx for Web renders the same Lynx
// elements into the `<lynx-view>` shadow tree of an ordinary browser page, so this module
// answers those same methods from that page over Chrome's DevTools protocol. The driver,
// the cell definitions and the control collection then run unchanged on the browser pair;
// only the transport differs. Select it with LYNX_DEVTOOL_CONNECTOR (comparison-web.mjs
// does), and pass Chrome's remote-debugging port where the DevTool port goes.

/** Path the Web dev server serves the Lynx-for-Web build under (apps/web/lynxDevSurface.ts). */
export const LYNX_WEB_PAGE_PATH = "/lynx/";
/** The `<lynx-view>` whose shadow tree holds the Lynx elements (src/main/web/web-host.ts). */
export const LYNX_WEB_HOST_SELECTOR = "#root-view";

const REGISTRY_EXPRESSION =
  "(globalThis.__comparisonWebNodes ??= { next: 1, elements: new Map(), ids: new WeakMap() })";

/**
 * Runs in the page (serialized with toString, so it must not close over anything).
 * Reduces the shadow tree to the shape the DevTool's DOM.getDocument returns: nodes with a
 * `nodeId`, an upper-case `nodeName` and a flat `[name, value, …]` attribute list.
 *
 * - `x-view`/`x-text`/… are web-core's custom elements for Lynx `view`/`text`/…; the name
 *   drops the prefix (`TEXT` is what the driver matches visible text on).
 * - `lynx-wrapper` has no box (`display: contents`) and no Native counterpart, so its
 *   children take its place.
 * - web-core's own `style`/`link`/`iframe` nodes are not Lynx elements and are left out.
 * - An element's own shadow root is web-core's implementation of that element (the
 *   `<textarea>` inside `x-textarea`), not part of the Lynx tree, and is not entered.
 */
export function collectLynxWebTree(shadowRoot, registry) {
  for (const [id, element] of registry.elements) {
    if (!element.isConnected) registry.elements.delete(id);
  }
  const idOf = (element) => {
    let id = registry.ids.get(element);
    if (id === undefined) {
      id = registry.next;
      registry.next += 1;
      registry.ids.set(element, id);
    }
    registry.elements.set(id, element);
    return id;
  };
  const nameOf = (tagName) => {
    const tag = String(tagName).toUpperCase();
    return tag.startsWith("X-") ? tag.slice(2) : tag;
  };
  const childrenOf = (parent) => {
    const nodes = [];
    for (const child of parent.children) {
      const tag = String(child.tagName).toUpperCase();
      if (tag === "STYLE" || tag === "LINK" || tag === "SCRIPT" || tag === "IFRAME") continue;
      if (tag === "LYNX-WRAPPER") nodes.push(...childrenOf(child));
      else nodes.push(nodeOf(child));
    }
    return nodes;
  };
  const nodeOf = (element) => {
    const attributes = [];
    for (const name of element.getAttributeNames()) {
      attributes.push(name, element.getAttribute(name) ?? "");
    }
    return {
      nodeId: idOf(element),
      nodeName: nameOf(element.tagName),
      attributes,
      children: childrenOf(element),
    };
  };
  return {
    root: {
      nodeId: 0,
      nodeName: "#document",
      attributes: [],
      children: shadowRoot ? childrenOf(shadowRoot) : [],
    },
  };
}

/**
 * Runs in the page. The border quad DOM.getBoxModel reports, in window pixels.
 *
 * web-core builds some Lynx elements (`x-textarea`, `x-input`) as a `display: contents`
 * host around a control in the host's own shadow root. Such a host has no box of its own;
 * the box of the Lynx element is the one its rendered parts cover, which is what the
 * Native element reports.
 */
export function lynxWebBoxModel(registry, nodeId, displayOf) {
  const element = registry.elements.get(nodeId);
  if (!element || !element.isConnected) return null;
  let rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0 && displayOf(element) === "contents") {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    const cover = (part) => {
      const r = part.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      } else if (displayOf(part) === "contents") {
        for (const child of part.children) cover(child);
      }
    };
    for (const part of [...(element.shadowRoot?.children ?? []), ...element.children]) cover(part);
    if (right > left && bottom > top) rect = { left, top, right, bottom };
  }
  return {
    model: {
      border: [
        rect.left,
        rect.top,
        rect.right,
        rect.top,
        rect.right,
        rect.bottom,
        rect.left,
        rect.bottom,
      ],
    },
  };
}

export function lynxWebDocumentExpression() {
  return `(${collectLynxWebTree.toString()})(document.querySelector(${JSON.stringify(LYNX_WEB_HOST_SELECTOR)})?.shadowRoot ?? null, ${REGISTRY_EXPRESSION})`;
}

export function lynxWebBoxModelExpression(nodeId) {
  return `(${lynxWebBoxModel.toString()})(${REGISTRY_EXPRESSION}, ${JSON.stringify(Number(nodeId))}, (element) => getComputedStyle(element).display)`;
}

/**
 * The DevTool's touch emulation as browser mouse input: web-core derives `tap` from the
 * pointer sequence a real click produces. A press is preceded by a move to the point, as
 * a pointer arriving there would be; a move while pressed is a drag.
 */
export function mouseEventsForTouch(params, pressed) {
  const point = { x: Number(params.x), y: Number(params.y) };
  if (params.type === "mousePressed") {
    return {
      pressed: true,
      events: [
        { type: "mouseMoved", ...point, button: "none", buttons: 0 },
        { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 },
      ],
    };
  }
  if (params.type === "mouseReleased") {
    return {
      pressed: false,
      events: [{ type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 }],
    };
  }
  if (params.type === "mouseMoved") {
    return {
      pressed,
      events: [
        {
          type: "mouseMoved",
          ...point,
          button: pressed ? "left" : "none",
          buttons: pressed ? 1 : 0,
        },
      ],
    };
  }
  throw new Error(`Unsupported touch emulation type ${JSON.stringify(params.type)}.`);
}

/** Chrome's debugging port from the driver's `localhost:<port>` client id. */
export function cdpPortFromClientId(clientId) {
  const match = /:(\d+)$/.exec(String(clientId));
  if (!match) throw new Error(`Client id ${JSON.stringify(clientId)} has no port.`);
  return Number(match[1]);
}

export function isLynxWebPageTarget(target) {
  if (target?.type !== "page") return false;
  try {
    return new URL(target.url).pathname.startsWith(LYNX_WEB_PAGE_PATH);
  } catch {
    return false;
  }
}

/** One error line per uncaught exception or `console.error`, from the page or its workers. */
export function pageErrorFromCdpEvent(message) {
  if (message?.method === "Runtime.exceptionThrown") {
    const details = message.params?.exceptionDetails;
    return `exception: ${details?.exception?.description ?? details?.text ?? "unknown"}`;
  }
  if (message?.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
    const text = (message.params.args ?? [])
      .map((argument) => argument.value ?? argument.description ?? "")
      .join(" ");
    return `console.error: ${text}`;
  }
  return null;
}

// Errors per debugging port. Module state, because `openNativeDriver` creates its own
// connector instance and the runner reads the errors through this module.
const pageErrorsByPort = new Map();

/** Errors seen since the last call (or since attach), and forgets them. */
export function takeLynxWebPageErrors(cdpPort) {
  const errors = pageErrorsByPort.get(Number(cdpPort)) ?? [];
  pageErrorsByPort.set(Number(cdpPort), []);
  return errors;
}

/** A request/response CDP session on one page target, with the page's workers attached. */
export async function openCdpPageSession(webSocketDebuggerUrl, { onEvent = () => undefined } = {}) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id !== undefined) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.reject(new Error(`${request.method}: ${message.error.message}`));
      else request.resolve(message.result);
      return;
    }
    onEvent(message);
  });
  const send = (method, params = {}, sessionId = undefined, timeoutMs = 15_000) =>
    new Promise((resolveSend, rejectSend) => {
      const requestId = ++id;
      const timeout = setTimeout(() => {
        pending.delete(requestId);
        rejectSend(new Error(`${method} timed out`));
      }, timeoutMs);
      pending.set(requestId, { method, resolve: resolveSend, reject: rejectSend, timeout });
      socket.send(
        JSON.stringify({ id: requestId, method, params, ...(sessionId ? { sessionId } : {}) }),
      );
    });
  const evaluate = async (expression, timeoutMs = 15_000) => {
    const result = await send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      undefined,
      timeoutMs,
    );
    if (result?.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? "Page evaluation failed");
    }
    return result?.result?.value;
  };
  return { send, evaluate, close: () => socket.close() };
}

export function createWebConnector({
  listTargets = (cdpPort) =>
    fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json()),
  openSession = openCdpPageSession,
} = {}) {
  const sessions = new Map();
  const attach = async (clientId, sessionId) => {
    const key = `${clientId}/${sessionId}`;
    if (sessions.has(key)) return sessions.get(key);
    const cdpPort = cdpPortFromClientId(clientId);
    const target = (await listTargets(cdpPort)).find((candidate) => candidate.id === sessionId);
    if (!target) throw new Error(`No Lynx-for-Web page ${sessionId} on port ${cdpPort}.`);
    if (!pageErrorsByPort.has(cdpPort)) pageErrorsByPort.set(cdpPort, []);
    let session = null;
    session = await openSession(target.webSocketDebuggerUrl, {
      onEvent(message) {
        // The Lynx background thread is a worker: attach to it to hear its errors too.
        if (message.method === "Target.attachedToTarget") {
          session?.send("Runtime.enable", {}, message.params.sessionId).catch(() => undefined);
          return;
        }
        const error = pageErrorFromCdpEvent(message);
        if (error !== null) pageErrorsByPort.get(cdpPort).push(error);
      },
    });
    await session.send("Runtime.enable");
    await session.send("Target.setAutoAttach", {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    });
    const entry = { session, pressed: false };
    sessions.set(key, entry);
    return entry;
  };
  const evaluated = async (entry, expression) => {
    const result = await entry.session.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result?.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? "Page evaluation failed");
    }
    return result?.result?.value;
  };
  return {
    async sendListSessionMessage(clientId) {
      const targets = await listTargets(cdpPortFromClientId(clientId));
      return targets
        .filter(isLynxWebPageTarget)
        .map((target) => ({ session_id: target.id, url: target.url, type: "lynx-for-web" }));
    },
    async sendCDPMessage(clientId, sessionId, method, params = {}) {
      const entry = await attach(clientId, sessionId);
      if (method === "DOM.getDocument") {
        return { result: await evaluated(entry, lynxWebDocumentExpression()) };
      }
      if (method === "DOM.getBoxModel") {
        return { result: await evaluated(entry, lynxWebBoxModelExpression(params.nodeId)) };
      }
      if (method === "Input.emulateTouchFromMouseEvent") {
        const { pressed, events } = mouseEventsForTouch(params, entry.pressed);
        entry.pressed = pressed;
        for (const event of events) await entry.session.send("Input.dispatchMouseEvent", event);
        return { result: {} };
      }
      if (method === "Runtime.evaluate") {
        return {
          result: await entry.session.send("Runtime.evaluate", {
            ...params,
            awaitPromise: true,
          }),
        };
      }
      if (method === "Input.insertText" || method === "Page.reload") {
        return { result: await entry.session.send(method, params) };
      }
      // Never answer an unknown method with an empty result: the driver would read it as
      // "nothing there" instead of "not asked".
      throw new Error(`The Lynx-for-Web connector does not implement ${method}.`);
    },
    close() {
      for (const { session } of sessions.values()) session.close();
      sessions.clear();
    },
  };
}

/** The entry point `openNativeDriver` looks for in a DevTool connector module. */
export function createDefaultConnector() {
  return createWebConnector();
}
