// usage: node scripts/comparison-cells.mjs [--surfaces landing,thread,…] [--out file]
//
// N4 base cells: for each main surface, reach it through the real UI in both
// renderers of the latest certified run (one theme × one window size), then
// compare every control the two renderers label the same way. A control
// matches when its box differs by at most 2px in x, y, width and height.
// Page errors are collected in both renderers. Numbers only, no screenshots.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { nativeNodesMatchingClasses } from "./comparison-measure.mjs";
import {
  openElectronDriver,
  openNativeDriver,
  readCertifiedRun,
  waitFor,
} from "./comparison-workflow.mjs";

export const CONTROL_TOLERANCE_PX = 2;

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const FIXTURE_TRANSCRIPT_THREAD_ID = "comparison-fixture-transcript-v2";
const pick = (driver, targets) => targets[driver.kind] ?? targets.both;
const textTarget = (selector, text, label) => ({
  electron: { selector, text },
  native: { label: label ?? text },
});
const BACK_TO_APP = textTarget("button", "Back to app");

async function leaveSettings(driver) {
  if (await driver.find(pick(driver, BACK_TO_APP))) await driver.tap(pick(driver, BACK_TO_APP));
}

/** How each base surface is reached, and what proves it is ready. */
export const SURFACES = Object.freeze({
  landing: {
    open: async (driver) => {
      await leaveSettings(driver);
      await driver.tap(pick(driver, textTarget("a, button", "New thread")));
    },
    ready: (driver) =>
      driver.find(
        pick(driver, {
          electron: { testId: "composer-editor" },
          native: { label: "Message composer" },
        }),
      ),
  },
  thread: {
    open: async (driver) => {
      await leaveSettings(driver);
      await driver.tap({ attribute: ["data-thread-id", FIXTURE_TRANSCRIPT_THREAD_ID] });
    },
    ready: (driver) => driver.find({ label: "Copy message" }),
  },
  settings: {
    open: (driver) => driver.tap(pick(driver, textTarget("button", "Settings"))),
    ready: (driver) => driver.find(pick(driver, BACK_TO_APP)),
  },
  kanban: {
    open: async (driver) => {
      await leaveSettings(driver);
      await driver.tap(pick(driver, textTarget("a, button", "Kanban")));
    },
    ready: (driver) => driver.find(pick(driver, textTarget("main button", "New task"))),
  },
  pr: {
    open: async (driver) => {
      await leaveSettings(driver);
      await driver.tap(pick(driver, textTarget("a, button", "Pull requests")));
    },
    ready: (driver) =>
      driver.find(
        pick(driver, {
          electron: { selector: "button", text: "Merged" },
          native: { text: "Merged" },
        }),
      ),
  },
  automations: {
    open: async (driver) => {
      await leaveSettings(driver);
      await driver.tap(pick(driver, textTarget("a, button", "Automations")));
    },
    ready: (driver) => driver.find(pick(driver, textTarget("button", "New automation"))),
  },
});

/** Visible controls by accessible label: Map<label, box[]> in window pixels. */
export async function labeledControls(driver) {
  if (driver.kind === "electron") {
    const entries = await driver.evaluate(`(() => {
      const closedOverlay = '[role="dialog"][data-closed], [role="alertdialog"][data-closed], [role="menu"][data-closed], [data-slot$="popup"][data-closed]';
      return Array.from(document.querySelectorAll("[aria-label]")).flatMap((node) => {
        if (node.closest('[aria-hidden="true"]') || node.closest(closedOverlay)) return [];
        const r = node.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0 || r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) return [];
        return [[node.getAttribute("aria-label"), { x: r.x, y: r.y, width: r.width, height: r.height }]];
      });
    })()`);
    return groupByLabel(entries);
  }
  const root = await driver.documentRoot();
  const windowNode = nativeNodesMatchingClasses(root, ".SliceRoot")[0];
  const windowBox = windowNode ? await nativeBox(driver, windowNode.nodeId) : null;
  const entries = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    const attributes = node?.attributes ?? [];
    let label = null;
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      if (attributes[index] === "accessibility-label") label = String(attributes[index + 1]);
    }
    if (label) {
      const box = await nativeBox(driver, node.nodeId);
      const visible =
        box &&
        box.width > 0 &&
        box.height > 0 &&
        (!windowBox ||
          (box.x + box.width > windowBox.x &&
            box.y + box.height > windowBox.y &&
            box.x < windowBox.x + windowBox.width &&
            box.y < windowBox.y + windowBox.height));
      if (visible) entries.push([label, box]);
    }
    queue.push(...(node?.children ?? []));
  }
  return groupByLabel(entries);
}

async function nativeBox(driver, nodeId) {
  const quad = (await driver.send("DOM.getBoxModel", { nodeId }))?.model?.border;
  if (!quad) return null;
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function onlyIn(from, other) {
  return [...from.keys()].filter((label) => !other.has(label)).toSorted();
}

function groupByLabel(entries) {
  const byLabel = new Map();
  for (const [label, box] of entries) {
    if (!byLabel.has(label)) byLabel.set(label, []);
    byLabel.get(label).push(box);
  }
  return byLabel;
}

/**
 * Compares controls labeled identically in both renderers. Only labels that
 * occur once on each side are compared (repeated labels cannot be paired
 * safely); the rest are reported as counts.
 */
export function compareControls(electron, native, tolerance = CONTROL_TOLERANCE_PX) {
  const compared = [];
  for (const [label, electronBoxes] of electron) {
    const nativeBoxes = native.get(label);
    if (!nativeBoxes || electronBoxes.length !== 1 || nativeBoxes.length !== 1) continue;
    const [e] = electronBoxes;
    const [n] = nativeBoxes;
    const delta = {
      x: round(n.x - e.x),
      y: round(n.y - e.y),
      width: round(n.width - e.width),
      height: round(n.height - e.height),
    };
    const worst = Math.max(...Object.values(delta).map(Math.abs));
    compared.push({ label, electron: e, native: n, delta, worst, match: worst <= tolerance });
  }
  compared.sort((left, right) => right.worst - left.worst);
  return {
    compared: compared.length,
    matched: compared.filter((entry) => entry.match).length,
    outside: compared.filter((entry) => !entry.match),
    electronOnly: onlyIn(electron, native),
    nativeOnly: onlyIn(native, electron),
    repeated: [...electron.keys()].filter(
      (label) =>
        native.has(label) && (electron.get(label).length > 1 || native.get(label).length > 1),
    ).length,
  };
}

async function electronErrors(driver) {
  return driver.evaluate(
    `(() => { const fatal = document.body.innerText.includes("Something went wrong.") ? ["error screen: " + document.body.innerText.slice(0, 160)] : []; return [...(window.__comparisonCellErrors ?? []), ...fatal]; })()`,
  );
}

function nativeConsoleErrors(devtoolPort) {
  try {
    const output = execFileSync(
      "node",
      [
        "/Users/bytedance/.claude/skills/lynx-devtool/scripts/index.mjs",
        "get-console",
        "-c",
        `localhost:${devtoolPort}`,
        "--level",
        "error",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : (parsed.messages ?? parsed.logs ?? []);
  } catch {
    return null;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const option = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const surfaces = option("--surfaces", Object.keys(SURFACES).join(",")).split(",");
  const run = readCertifiedRun();
  const electron = await openElectronDriver(run.options.electronCdpPort);
  const native = await openNativeDriver(run.native.devtool.port);
  await electron.evaluate(
    `window.__comparisonCellErrors ??= []; if (!window.__comparisonCellErrorsHooked) { window.__comparisonCellErrorsHooked = true; addEventListener("error", (event) => window.__comparisonCellErrors.push(String(event.message))); addEventListener("unhandledrejection", (event) => window.__comparisonCellErrors.push(String(event.reason))); }`,
  );
  const nativeErrorsBefore = nativeConsoleErrors(run.native.devtool.port)?.length ?? null;
  const report = {
    runId: run.runId,
    theme: run.options.theme,
    window: { width: run.options.width, height: run.options.height },
    tolerancePx: CONTROL_TOLERANCE_PX,
    cells: {},
  };
  for (const name of surfaces) {
    const surface = SURFACES[name];
    const cell = { surface: name };
    try {
      for (const driver of [electron, native]) {
        await surface.open(driver);
        await waitFor(() => surface.ready(driver), {
          label: `${name} on ${driver.kind}`,
          timeoutMs: 20_000,
        });
      }
      await sleep(800);
      const comparison = compareControls(
        await labeledControls(electron),
        await labeledControls(native),
      );
      const errors = await electronErrors(electron);
      cell.comparison = { ...comparison, outside: comparison.outside.slice(0, 25) };
      cell.pass = comparison.outside.length === 0 && errors.length === 0;
      cell.electronErrors = errors;
    } catch (error) {
      cell.pass = false;
      cell.error = String(error?.message ?? error);
    }
    report.cells[name] = cell;
    const summary = cell.comparison
      ? `${cell.comparison.matched}/${cell.comparison.compared} controls ≤${CONTROL_TOLERANCE_PX}px`
      : cell.error;
    console.log(
      `[cell] ${run.options.theme} ${run.options.width}×${run.options.height} ${name}: ${cell.pass ? "PASS" : "FAIL"} (${summary})`,
    );
  }
  const nativeErrorsAfter = nativeConsoleErrors(run.native.devtool.port);
  report.nativeConsoleErrors =
    nativeErrorsAfter === null || nativeErrorsBefore === null
      ? null
      : nativeErrorsAfter.slice(nativeErrorsBefore);
  electron.close();
  native.close();
  const out = option("--out");
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  }
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
