// Paired style/geometry measurement for a certified comparison run.
//
// Reads the latest run manifest written by scripts/dev-electron-lynxtron.mjs,
// then resolves each probe in both renderers — Electron through CDP, Lynxtron
// through its DevTool — and reduces the matched element to one comparable
// record: what paints the probed edge (border or layout-neutral gradient
// hairline), its color, thickness, and window-space position. Records are
// written as JSON evidence; no screenshots are taken.
//
// usage: node scripts/comparison-measure.mjs --probes <probes.json> [--out <file>]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCssColor as parseSharedCssColor } from "../apps/lynx/scripts/css-color.logic.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultLynxDevtoolConnector =
  "/Users/bytedance/.agents/skills/lynx-devtool/scripts/connector.mjs";

/** Parses a CSS color (any serialization Chromium or Lynx emits) into [r, g, b, a]. */
export function parseCssColor(value) {
  const color = parseSharedCssColor(value);
  return color && [color.r, color.g, color.b, color.a];
}

function firstGradientColor(backgroundImage) {
  const text = String(backgroundImage ?? "");
  const start = text.indexOf("linear-gradient(");
  if (start < 0) return null;
  // First argument = everything up to the first comma at parenthesis depth 0.
  let depth = 0;
  let index = start + "linear-gradient(".length;
  const from = index;
  for (; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(") depth += 1;
    else if (char === ")") {
      if (depth === 0) break;
      depth -= 1;
    } else if (char === "," && depth === 0) break;
  }
  return parseCssColor(text.slice(from, index));
}

/**
 * Reduces an element to the paint on one of its edges. `box` is the border box
 * in window coordinates; `style` maps CSS property names to computed values.
 */
export function edgePaint(style, box, edge) {
  const horizontal = edge === "top" || edge === "bottom";
  const width = Number.parseFloat(style[`border-${edge}-width`] ?? "0") || 0;
  const borderStyle = String(style[`border-${edge}-style`] ?? "none");
  const borderColor = parseCssColor(style[`border-${edge}-color`]);
  const lineAt = (thickness) => {
    if (edge === "bottom")
      return { x: box.x, y: box.y + box.height - thickness, length: box.width };
    if (edge === "top") return { x: box.x, y: box.y, length: box.width };
    if (edge === "left") return { x: box.x, y: box.y, length: box.height };
    return { x: box.x + box.width - thickness, y: box.y, length: box.height };
  };
  const visibleBorder = width > 0 && borderStyle !== "none" && borderStyle !== "hidden";
  if (visibleBorder && borderColor === null) {
    // Never let an unrecognized color serialization read as "no divider".
    return { kind: "unparsed", raw: style[`border-${edge}-color`], thickness: width, line: null };
  }
  if (visibleBorder && borderColor[3] > 0) {
    return {
      kind: "border",
      color: borderColor,
      thickness: width,
      occupiesLayout: true,
      line: lineAt(width),
    };
  }
  const gradientColor = firstGradientColor(style["background-image"]);
  const size = String(style["background-size"] ?? "");
  const position = String(style["background-position"] ?? "");
  if (gradientColor?.[3] > 0 && horizontal && /\b1px\b/.test(size)) {
    const anchored = edge === "bottom" ? /bottom|100%/.test(position) : /top|0%/.test(position);
    if (anchored) {
      return {
        kind: "gradient",
        color: gradientColor,
        thickness: 1,
        occupiesLayout: false,
        line: lineAt(1),
      };
    }
  }
  return { kind: "none", color: null, thickness: 0, occupiesLayout: false, line: null };
}

/** N2 tolerances: alpha within 1/255, channels within 1, edge within 1 logical px. */
export function compareEdgePaint(electron, native, tolerance = { alpha: 1 / 255, position: 1 }) {
  const problems = [];
  for (const [name, paint] of [
    ["Electron", electron],
    ["Native", native],
  ]) {
    if (paint.kind === "unparsed") problems.push(`${name} color not parsed: ${paint.raw}`);
  }
  if (problems.length > 0) return { match: false, problems };
  if (electron.kind === "none" || native.kind === "none") {
    if (electron.kind !== native.kind)
      problems.push(`paint ${native.kind} vs Electron ${electron.kind}`);
    return { match: problems.length === 0, problems };
  }
  const [er, eg, eb, ea] = electron.color;
  const [nr, ng, nb, na] = native.color;
  if (Math.max(Math.abs(er - nr), Math.abs(eg - ng), Math.abs(eb - nb)) > 1) {
    problems.push(`rgb ${[nr, ng, nb]} vs Electron ${[er, eg, eb]}`);
  }
  if (Math.abs(ea - na) > tolerance.alpha + 1e-6) {
    problems.push(`alpha ${na.toFixed(4)} vs Electron ${ea.toFixed(4)}`);
  }
  if (Math.abs(electron.thickness - native.thickness) > 0.01) {
    problems.push(`thickness ${native.thickness} vs Electron ${electron.thickness}`);
  }
  if (electron.occupiesLayout !== native.occupiesLayout) {
    problems.push(
      `${native.occupiesLayout ? "occupies" : "does not occupy"} layout; Electron ${electron.occupiesLayout ? "does" : "does not"}`,
    );
  }
  if (electron.line && native.line) {
    const dx = Math.abs(electron.line.x - native.line.x);
    const dy = Math.abs(electron.line.y - native.line.y);
    if (Math.max(dx, dy) > tolerance.position) {
      problems.push(`edge offset (${dx.toFixed(1)}, ${dy.toFixed(1)})px`);
    }
  }
  return { match: problems.length === 0, problems };
}

const ELECTRON_STYLE_PROPERTIES = [
  "border-top-width",
  "border-top-style",
  "border-top-color",
  "border-bottom-width",
  "border-bottom-style",
  "border-bottom-color",
  "border-left-width",
  "border-left-style",
  "border-left-color",
  "border-right-width",
  "border-right-style",
  "border-right-color",
  "background-image",
  "background-size",
  "background-position",
];

async function openElectron(cdpPort) {
  const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((r) => r.json());
  const target = targets.find(
    (candidate) => candidate.type === "page" && /^http:\/\/127\.0\.0\.1:/.test(candidate.url),
  );
  if (!target) throw new Error(`No Electron page on CDP port ${cdpPort}.`);
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  let id = 0;
  const evaluate = (expression) =>
    new Promise((resolveEval, rejectEval) => {
      const requestId = ++id;
      const onMessage = (event) => {
        const message = JSON.parse(String(event.data));
        if (message.id !== requestId) return;
        socket.removeEventListener("message", onMessage);
        if (message.error || message.result?.exceptionDetails) {
          rejectEval(new Error(JSON.stringify(message.error ?? message.result.exceptionDetails)));
        } else resolveEval(message.result?.result?.value);
      };
      socket.addEventListener("message", onMessage);
      socket.send(
        JSON.stringify({
          id: requestId,
          method: "Runtime.evaluate",
          params: { expression, returnByValue: true, awaitPromise: true },
        }),
      );
    });
  return { evaluate, close: () => socket.close() };
}

async function measureElectron(electron, probe) {
  const result = await electron.evaluate(`(() => {
    const scope = ${JSON.stringify(probe.electron.within ?? null)} === null ? document : document.querySelector(${JSON.stringify(probe.electron.within ?? "")});
    if (!scope) return [];
    const nodes = Array.from(scope.querySelectorAll(${JSON.stringify(probe.electron.selector)}))
      .filter((node) => { const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    return nodes.slice(0, 40).map((node) => {
      const r = node.getBoundingClientRect();
      const computed = getComputedStyle(node);
      const style = Object.fromEntries(${JSON.stringify(ELECTRON_STYLE_PROPERTIES)}.map((p) => [p, computed.getPropertyValue(p)]));
      return { box: { x: r.x, y: r.y, width: r.width, height: r.height }, style, className: String(node.className).slice(0, 160) };
    });
  })()`);
  return result ?? [];
}

async function openNative(port) {
  const connectorPath = process.env.LYNX_DEVTOOL_CONNECTOR?.trim() || defaultLynxDevtoolConnector;
  const { createDefaultConnector } = await import(connectorPath);
  const connector = createDefaultConnector();
  const clientId = `localhost:${port}`;
  const sessions = await connector.sendListSessionMessage(clientId);
  const session = sessions.at(-1);
  if (!session) throw new Error(`No Lynx DevTool session on ${clientId}.`);
  const send = async (method, params = {}) => {
    const reply = await connector.sendCDPMessage(clientId, session.session_id, method, params);
    return reply?.result ?? reply;
  };
  return { send };
}

/**
 * Lynx DevTool does not resolve selectors from the document root, so Native
 * probes match class tokens (`.A` or `.A.B`) over one full DOM snapshot.
 */
export function nativeNodesMatchingClasses(root, selector) {
  const wanted = selector
    .split(".")
    .map((token) => token.trim())
    .filter(Boolean);
  const matches = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    const attributes = node?.attributes ?? [];
    let classes = [];
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      if (attributes[index] === "class") classes = String(attributes[index + 1]).split(/\s+/);
    }
    if (wanted.length > 0 && wanted.every((token) => classes.includes(token))) matches.push(node);
    queue.push(...(node?.children ?? []));
  }
  return matches;
}

function quadToBox(quad) {
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

async function measureNative(native, probe, documentRoot) {
  const records = [];
  for (const node of nativeNodesMatchingClasses(documentRoot, probe.native.selector).slice(0, 40)) {
    const computed = await native.send("CSS.getComputedStyleForNode", { nodeId: node.nodeId });
    const style = Object.fromEntries(
      (computed?.computedStyle ?? []).map((entry) => [entry.name, entry.value]),
    );
    const model = await native.send("DOM.getBoxModel", { nodeId: node.nodeId });
    const border = model?.model?.border;
    if (!border) continue;
    const box = quadToBox(border);
    if (box.width <= 0 || box.height <= 0) continue;
    records.push({ nodeId: node.nodeId, box, style });
  }
  return records;
}

/** First match, or the match whose border-box origin is nearest `near`. */
export function pickNode(nodes, near) {
  if (!near || nodes.length === 0) return nodes[0] ?? null;
  const distance = (node) => Math.hypot(node.box.x - near.x, node.box.y - near.y);
  return nodes.reduce((best, node) => (distance(node) < distance(best) ? node : best));
}

export async function measureProbes(probes, run) {
  const electron = await openElectron(run.options.electronCdpPort);
  const native = await openNative(run.native.devtool.port);
  const document = await native.send("DOM.getDocument", { depth: -1 });
  const documentRoot = document?.root ?? document;
  const results = [];
  try {
    for (const probe of probes) {
      const [electronNodes, nativeNodes] = [
        await measureElectron(electron, probe),
        await measureNative(native, probe, documentRoot),
      ];
      const e =
        probe.electron.index === undefined
          ? pickNode(electronNodes, probe.electron.near)
          : (electronNodes[probe.electron.index] ?? null);
      const n = pickNode(nativeNodes, probe.native.near ?? probe.electron.near);
      const electronPaint = e ? edgePaint(e.style, e.box, probe.edge) : null;
      const nativePaint = n ? edgePaint(n.style, n.box, probe.edge) : null;
      results.push({
        id: probe.id,
        role: probe.role,
        edge: probe.edge,
        electron: e ? { matches: electronNodes.length, box: e.box, paint: electronPaint } : null,
        native: n ? { matches: nativeNodes.length, box: n.box, paint: nativePaint } : null,
        comparison:
          electronPaint && nativePaint
            ? compareEdgePaint(electronPaint, nativePaint)
            : {
                match: false,
                problems: [`${e ? "" : "Electron "}${n ? "" : "Native "}element not found`.trim()],
              },
      });
    }
  } finally {
    electron.close();
  }
  return results;
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const argv = process.argv.slice(2);
  const option = (name) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const probesPath = option("--probes");
  if (!probesPath) throw new Error("--probes <file> is required.");
  const runPath = join(repositoryRoot, ".synara-desktop-comparison", "runs", "latest.json");
  if (!existsSync(runPath)) throw new Error("No comparison run manifest; start the harness first.");
  const run = JSON.parse(readFileSync(runPath, "utf8"));
  if (run.status !== "certified") throw new Error(`Latest run is ${run.status}, not certified.`);
  const probes = JSON.parse(readFileSync(probesPath, "utf8"));
  const results = await measureProbes(probes, run);
  const report = {
    runId: run.runId,
    theme: run.options.theme,
    viewport: { width: run.options.width, height: run.options.height },
    route: run.options.route,
    measuredAt: new Date().toISOString(),
    results,
  };
  const out = option("--out");
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  }
  for (const result of results) {
    console.log(
      `${result.comparison.match ? "MATCH" : "DIFF "} ${result.id}: ${result.comparison.problems.join("; ") || "ok"}`,
    );
  }
}
