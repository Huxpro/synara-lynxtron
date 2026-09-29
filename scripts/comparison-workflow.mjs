// Drives the same user workflow in both renderers of a certified comparison
// run and checks the outcome against the backend (canonical RPC snapshot).
//
// Electron is driven through CDP (real mouse/keyboard/text input events);
// Lynxtron through its DevTool (touch emulation + text insertion, the input
// paths the DevTool implements). Targets are addressed semantically — by
// accessible label on both sides — so one workflow definition covers both.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { openSynaraRpcSession } from "./comparison-fixture.mjs";
import { nativeNodesMatchingClasses } from "./comparison-measure.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultLynxDevtoolConnector =
  "/Users/bytedance/.agents/skills/lynx-devtool/scripts/connector.mjs";
const sleep = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

export async function waitFor(
  check,
  { timeoutMs = 15_000, intervalMs = 150, label = "condition" } = {},
) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await check();
    if (last) return last;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

/** Accessible-label / text / attribute / class target → matching predicate for a Native DOM node. */
export function nativeTargetMatches(node, target) {
  const attributes = node?.attributes ?? [];
  const read = (name) => {
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      if (attributes[index] === name) return String(attributes[index + 1]);
    }
    return null;
  };
  if (target.label !== undefined) {
    const label = read("accessibility-label") ?? read("aria-label");
    if (label === null) return false;
    return target.label instanceof RegExp ? target.label.test(label) : label === target.label;
  }
  if (target.text !== undefined) {
    // Visible text lives in zero-size RAW-TEXT children; match their TEXT element.
    if (node?.nodeName !== "TEXT") return false;
    const text = (node.children ?? [])
      .map((child) => {
        const childAttributes = child?.attributes ?? [];
        for (let index = 0; index + 1 < childAttributes.length; index += 2) {
          if (childAttributes[index] === "text") return String(childAttributes[index + 1]);
        }
        return "";
      })
      .join("");
    return target.text instanceof RegExp ? target.text.test(text) : text === target.text;
  }
  if (target.attribute !== undefined) {
    const [name, value] = target.attribute;
    return read(name) === value;
  }
  if (target.className !== undefined) {
    const classes = (read("class") ?? "").split(/\s+/);
    return target.className
      .split(".")
      .filter(Boolean)
      .every((token) => classes.includes(token));
  }
  return false;
}

/** CSS selector for an Electron target (label, testId, attribute or raw selector). */
function electronSelectorFor(target) {
  return (
    target.selector ??
    (target.label !== undefined
      ? `[aria-label=${JSON.stringify(String(target.label))}]`
      : target.testId !== undefined
        ? `[data-testid=${JSON.stringify(target.testId)}]`
        : target.attribute !== undefined
          ? `[${target.attribute[0]}=${JSON.stringify(target.attribute[1])}]`
          : null)
  );
}

function allNodes(root) {
  const nodes = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    nodes.push(node);
    queue.push(...(node?.children ?? []));
  }
  return nodes;
}

export async function openElectronDriver(cdpPort) {
  const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((r) => r.json());
  const target = targets.find(
    (candidate) => candidate.type === "page" && candidate.url.startsWith("http://127.0.0.1:"),
  );
  if (!target) throw new Error(`No Electron page on CDP port ${cdpPort}.`);
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  let id = 0;
  const send = (method, params = {}) =>
    new Promise((resolveSend, rejectSend) => {
      const requestId = ++id;
      const timeout = setTimeout(() => rejectSend(new Error(`${method} timed out`)), 15_000);
      const onMessage = (event) => {
        const message = JSON.parse(String(event.data));
        if (message.id !== requestId) return;
        socket.removeEventListener("message", onMessage);
        clearTimeout(timeout);
        if (message.error) rejectSend(new Error(`${method}: ${message.error.message}`));
        else resolveSend(message.result);
      };
      socket.addEventListener("message", onMessage);
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result?.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ?? "Electron evaluation failed",
      );
    }
    return result?.result?.value;
  };
  const find = (target) =>
    evaluate(`(() => {
      const text = ${JSON.stringify(target.text ?? null)};
      const nodes = Array.from(document.querySelectorAll(${JSON.stringify(electronSelectorFor(target))}));
      const node = nodes.find((candidate) => {
        const r = candidate.getBoundingClientRect();
        const inViewport = r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
        // Closed Base UI overlays stay mounted (data-closed, opacity 0) during and after
        // exit. Only overlays: a collapsed Collapsible is also data-closed but on screen.
        if (candidate.closest('[role="dialog"][data-closed], [role="alertdialog"][data-closed], [role="menu"][data-closed], [data-slot$="popup"][data-closed]')) return false;
        return r.width > 0 && r.height > 0 && inViewport && (text === null || (candidate.innerText ?? "").includes(text));
      });
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height, text: (node.innerText ?? node.textContent ?? "").slice(0, 2000) };
    })()`);
  const pointer = async (x, y) => {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
  };
  return {
    kind: "electron",
    evaluate,
    find,
    async tap(target) {
      const box = await waitFor(() => find(target), {
        label: `Electron ${JSON.stringify(target)}`,
      });
      await pointer(box.x, box.y);
      return box;
    },
    type: (text) => send("Input.insertText", { text }),
    /** Mouse wheel at a point; negative deltaY scrolls content toward the top. */
    async scroll(point, deltaY) {
      await send("Input.dispatchMouseEvent", {
        type: "mouseWheel",
        x: point.x,
        y: point.y,
        deltaX: 0,
        deltaY,
      });
    },
    async press(key) {
      const keys = {
        Enter: { code: "Enter", windowsVirtualKeyCode: 13 },
        Escape: { code: "Escape", windowsVirtualKeyCode: 27 },
      };
      const descriptor = keys[key];
      if (!descriptor) throw new Error(`Unsupported key ${key}`);
      await send("Input.dispatchKeyEvent", { type: "keyDown", key, ...descriptor });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key, ...descriptor });
    },
    /** Renderer reload (the app process keeps running); resolves once the document is ready again. */
    async reload() {
      await send("Page.reload", { ignoreCache: false });
      await sleep(500);
      await waitFor(
        async () => {
          try {
            return (await evaluate("document.readyState")) === "complete";
          } catch {
            return false;
          }
        },
        { label: "the Electron document after reload", timeoutMs: 30_000 },
      );
    },
    close: () => socket.close(),
  };
}

export async function openNativeDriver(devtoolPort) {
  const connectorPath = process.env.LYNX_DEVTOOL_CONNECTOR?.trim() || defaultLynxDevtoolConnector;
  const { createDefaultConnector } = await import(connectorPath);
  const connector = createDefaultConnector();
  const clientId = `localhost:${devtoolPort}`;
  const session = async () =>
    waitFor(async () => (await connector.sendListSessionMessage(clientId)).at(-1), {
      label: "a Lynx DevTool session",
      timeoutMs: 30_000,
    });
  let current = await session();
  const send = async (method, params = {}) => {
    const reply = await connector.sendCDPMessage(clientId, current.session_id, method, params);
    return reply?.result ?? reply;
  };
  const documentRoot = async () => {
    const document = await send("DOM.getDocument", { depth: -1 });
    return document?.root ?? document;
  };
  const boxOf = async (nodeId) => {
    const quad = (await send("DOM.getBoxModel", { nodeId }))?.model?.border;
    if (!quad) return null;
    const xs = [quad[0], quad[2], quad[4], quad[6]];
    const ys = [quad[1], quad[3], quad[5], quad[7]];
    return {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys),
    };
  };
  const find = async (target) => {
    const documentNode = await documentRoot();
    // The app root spans the window; off-canvas matches (a closed dock) are skipped.
    const sliceRoot = nativeNodesMatchingClasses(documentNode, ".SliceRoot")[0];
    // `within` scopes the search to the first element with those classes (e.g. a menu layer).
    const root =
      target.within !== undefined
        ? nativeNodesMatchingClasses(documentNode, target.within)[0]
        : documentNode;
    if (!root) return null;
    const windowBox = sliceRoot ? await boxOf(sliceRoot.nodeId) : null;
    const candidates =
      target.className !== undefined
        ? nativeNodesMatchingClasses(root, target.className)
        : allNodes(root).filter((node) => nativeTargetMatches(node, target));
    for (const node of candidates) {
      const box = await boxOf(node.nodeId);
      if (!box) continue;
      const width = box.right - box.left;
      const height = box.bottom - box.top;
      if (width <= 0 || height <= 0) continue;
      if (
        windowBox &&
        (box.right <= windowBox.left ||
          box.left >= windowBox.right ||
          box.bottom <= windowBox.top ||
          box.top >= windowBox.bottom)
      ) {
        continue;
      }
      return {
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        x: box.left + width / 2,
        y: box.top + height / 2,
        width,
        height,
      };
    }
    return null;
  };
  const touch = async (x, y) => {
    for (const type of ["mousePressed", "mouseReleased"]) {
      await send("Input.emulateTouchFromMouseEvent", {
        type,
        x: Math.round(x),
        y: Math.round(y),
        timestamp: Date.now() / 1000,
        button: "left",
      });
    }
  };
  return {
    kind: "native",
    send,
    find,
    documentRoot,
    async tap(target) {
      const box = await waitFor(() => find(target), { label: `Native ${JSON.stringify(target)}` });
      await touch(box.x, box.y);
      return box;
    },
    type: (text) => send("Input.insertText", { text }),
    /**
     * Finger drag at a point (the input a touch/trackpad user gives a Lynx
     * list); negative deltaY scrolls content toward the top.
     */
    async scroll(point, deltaY) {
      const steps = 12;
      const x = Math.round(point.x);
      const startY = Math.round(point.y);
      const emit = (type, y) =>
        send("Input.emulateTouchFromMouseEvent", {
          type,
          x,
          y,
          timestamp: Date.now() / 1000,
          button: "left",
        });
      await emit("mousePressed", startY);
      for (let index = 1; index <= steps; index += 1) {
        await emit("mouseMoved", Math.round(startY - (deltaY * index) / steps));
        await sleep(16);
      }
      await sleep(120);
      await emit("mouseReleased", Math.round(startY - deltaY));
    },
    async press(key) {
      throw new Error(`Lynx DevTool cannot dispatch key "${key}"; drive the equivalent control.`);
    },
    async reconnect() {
      current = await session();
    },
    /** LynxView reload (the Lynxtron process keeps running); reattaches to the new session. */
    async reload() {
      // The DevTool session survives a LynxView reload and element ids restart,
      // so the reload is observed through the JS context: a marker set before
      // it is gone once the page runtime has been rebuilt.
      const marker = "__synaraComparisonReloadMarker";
      const markerPresent = async () => {
        const reply = await send("Runtime.evaluate", {
          expression: `typeof globalThis.${marker}`,
          returnByValue: true,
        });
        return (reply?.result ?? reply)?.value === "number";
      };
      await send("Runtime.evaluate", { expression: `globalThis.${marker} = 1` });
      if (!(await markerPresent()))
        throw new Error("Could not mark the Lynx JS context before reload.");
      await send("Page.reload", {});
      await waitFor(
        async () => {
          try {
            return !(await markerPresent()) && (await find({ className: "SliceRoot" })) !== null;
          } catch {
            return false;
          }
        },
        { label: "the reloaded Lynx document", timeoutMs: 30_000, intervalMs: 300 },
      );
    },
    close: () => undefined,
  };
}

export function readCertifiedRun(root = repositoryRoot) {
  const run = JSON.parse(
    readFileSync(join(root, ".synara-desktop-comparison", "runs", "latest.json"), "utf8"),
  );
  if (run.status !== "certified") throw new Error(`Latest run is ${run.status}, not certified.`);
  return run;
}

export async function openBackend(run) {
  const token = process.env.SYNARA_COMPARE_AUTH_TOKEN?.trim() || "synara-local-desktop-comparison";
  const session = await openSynaraRpcSession(
    `ws://127.0.0.1:${run.backend.port}/?token=${token}`,
    "comparison-workflow",
  );
  return {
    ...session,
    snapshot: () => session.request("orchestration.getSnapshot", {}),
    async thread(threadId) {
      const snapshot = await session.request("orchestration.getSnapshot", {});
      return snapshot.threads.find((thread) => thread.id === threadId) ?? null;
    },
  };
}
