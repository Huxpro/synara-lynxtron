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

/**
 * Differences verified by hand where the labelled element differs but what the
 * user sees matches. Each names what was compared instead.
 */
export const NAMED_EXEMPTIONS = Object.freeze([
  {
    label: /^(Dark|Light) theme contrast$/,
    reason:
      "range slider: Electron's <input type=range> box is its 6px track; Native labels the 14px thumb row centred on the same track",
  },
  {
    label: /^Message \d+: /,
    reason:
      "trail tick: Native labels the 56×10 hit row around the tick; the visible 6×2 tick is at the same x/y as Electron's",
  },
]);

/** Electron-only labels that are explained rather than counted as missing. */
export const COVERAGE_EXEMPTIONS = Object.freeze([
  {
    label: /^Settings sections$/,
    reason:
      "Electron names its settings <nav> landmark; Lynx has no landmark role, and the section buttons it contains are exposed and compared directly",
  },
  {
    label: /^(Dark|Light) theme code theme$/,
    reason:
      "Native's highlighter has fixed GitHub themes, so the code-theme select is hidden rather than offered as a no-op (39d4601c3; registered residual)",
  },
  {
    label: /^(Dark|Light) theme (accent|background|foreground) color$/,
    reason:
      "Electron's swatch button opens a 2D picker popover; Native edits the hex inline in the same swatch, named '<color> hex value' (registered residual)",
  },
  {
    label: /^Theme preference$/,
    reason:
      "Electron names the radiogroup; Lynx has no group role, so Native names each radio 'Theme preference: <mode>'",
  },
  {
    label: /^Git actions$/,
    reason:
      "Electron names the split-button group; Lynx has no group role, and both buttons inside (Commit, Git action options) are compared directly",
  },
  {
    label: /^Toggle Sidebar$/,
    reason:
      "Electron's closed right-panel rail: an invisible 16px hit strip on the window's right edge; Native opens the panel from the header toggle only (registered residual)",
  },
]);

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

const MENU_PROBE = {
  name: "menu popup",
  electron: '[data-slot="menu-popup"]:not([data-closed])',
  native: ".LxMenuPopup",
};
const DIALOG_PROBE = {
  name: "dialog popup",
  electron: '[role="dialog"]:not([data-closed])',
  native: ".LxDialogPopup",
};

/**
 * State increments (plan N4), each tied to the workflow that exercises it: opened
 * from a base surface, measured (labelled controls plus popup/dialog boxes), closed.
 */
export const INCREMENTS = Object.freeze({
  "landing-diff-dock": {
    workflow: "J3",
    base: "landing",
    // The web landing is the draft thread: its diff toggle opens the right dock.
    open: (driver) => driver.tap({ label: "Toggle diff panel" }),
    ready: (driver) => driver.find({ label: "Show file tree" }),
    probes: [],
    close: (driver) => driver.tap({ label: "Toggle diff panel" }),
  },
  "model-menu": {
    workflow: "J1",
    base: "thread",
    open: (driver) => driver.tap({ label: "Change model and reasoning" }),
    probes: [MENU_PROBE],
    close: (driver) => driver.tap({ label: "Change model and reasoning" }),
  },
  "add-panel-menu": {
    workflow: "J3",
    base: "thread",
    open: async (driver) => {
      if (!(await driver.find({ label: "Add panel" }))) {
        await driver.tap({ label: "Toggle diff panel" });
        await waitFor(() => driver.find({ label: "Add panel" }), { label: "the dock" });
      }
      await driver.tap({ label: "Add panel" });
    },
    // The diff toolbar is part of this state; wait until its files have loaded.
    ready: async (driver) =>
      (await probeBox(driver, MENU_PROBE)) && driver.find({ label: "Show file tree" }),
    probes: [MENU_PROBE],
    close: (driver) => driver.tap({ label: "Add panel" }),
  },
  "settings-appearance": {
    workflow: "J4",
    base: "settings",
    open: (driver) => driver.tap(pick(driver, textTarget("button", "Appearance"))),
    ready: (driver) => driver.find({ label: "Use system UI font" }),
    probes: [],
    close: () => undefined,
  },
  "automation-dialog": {
    workflow: "J5",
    base: "automations",
    open: (driver) => driver.tap(pick(driver, textTarget("button", "New automation"))),
    probes: [DIALOG_PROBE],
    close: (driver) =>
      driver.tap(
        pick(driver, {
          electron: { selector: '[role="dialog"] button', text: "Cancel" },
          native: { text: "Cancel" },
        }),
      ),
  },
  "kanban-new-task": {
    workflow: "J6",
    base: "kanban",
    open: (driver) => driver.tap(pick(driver, textTarget("main button", "New task"))),
    probes: [DIALOG_PROBE],
    close: (driver) =>
      driver.tap(
        pick(driver, {
          electron: { selector: '[role="dialog"] [aria-label="Close"]' },
          native: { label: "Close" },
        }),
      ),
  },
});

async function probeBox(driver, probe) {
  if (driver.kind === "electron") {
    return driver.evaluate(
      `(() => { const node = Array.from(document.querySelectorAll(${JSON.stringify(probe.electron)})).find((candidate) => candidate.getBoundingClientRect().width > 0); if (!node) return null; const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`,
    );
  }
  const node = nativeNodesMatchingClasses(await driver.documentRoot(), probe.native)[0];
  return node ? nativeBox(driver, node.nodeId) : null;
}

export function compareProbe(name, electron, native, tolerance = CONTROL_TOLERANCE_PX) {
  if (!electron || !native)
    return { name, missing: !electron ? "electron" : "native", match: false };
  const delta = {
    x: round(native.x - electron.x),
    y: round(native.y - electron.y),
    width: round(native.width - electron.width),
    height: round(native.height - electron.height),
  };
  const worst = Math.max(...Object.values(delta).map(Math.abs));
  return { name, electron, native, delta, worst, match: worst <= tolerance };
}

/** Visible controls by accessible label: Map<label, box[]> in window pixels. */
export async function labeledControls(driver) {
  if (driver.kind === "electron") {
    const entries = await driver.evaluate(`(() => {
      const closedOverlay = '[role="dialog"][data-closed], [role="alertdialog"][data-closed], [role="menu"][data-closed], [data-slot$="popup"][data-closed]';
      // An open modal is the whole accessible page, as for assistive technology.
      const modal = Array.from(document.querySelectorAll('[aria-modal="true"]')).filter((node) => !node.closest(closedOverlay) && node.getBoundingClientRect().width > 0).at(-1);
      return Array.from((modal ?? document).querySelectorAll("[aria-label]")).flatMap((node) => {
        if (node.closest('[aria-hidden="true"]') || node.closest(closedOverlay)) return [];
        // The Input primitive names the inner field; measure its control, as on Native.
        const control = node.matches('[data-slot="input"]') && node.parentElement?.matches('[data-slot="input-control"]') ? node.parentElement : node;
        const r = control.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0 || r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) return [];
        // Width of the classic scrollbar (app CSS: 10px) on the nearest overflowing ancestor.
        let gutter = 0;
        for (let parent = node.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (!/(auto|scroll)/.test(style.overflowY)) continue;
          const bar = parent.offsetWidth - parent.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
          if (bar > 0) { gutter = bar; break; }
        }
        return [[node.getAttribute("aria-label"), { x: r.x, y: r.y, width: r.width, height: r.height, gutter }]];
      });
    })()`);
    return groupByLabel(entries);
  }
  const root = await driver.documentRoot();
  const windowNode = nativeNodesMatchingClasses(root, ".SliceRoot")[0];
  const windowBox = windowNode ? await nativeBox(driver, windowNode.nodeId) : null;
  const entries = [];
  // Native dialogs declare aria-modal like the web popup; scope to the open one.
  const modals = [];
  const scan = [root];
  while (scan.length > 0) {
    const node = scan.shift();
    const attributes = node?.attributes ?? [];
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      if (attributes[index] === "aria-modal" && String(attributes[index + 1]) === "true") {
        modals.push(node);
      }
    }
    scan.push(...(node?.children ?? []));
  }
  let modal = null;
  for (const candidate of modals) {
    const box = await nativeBox(driver, candidate.nodeId);
    if (box && box.width > 0 && box.height > 0) modal = candidate;
  }
  const queue = [[modal ?? root, null]];
  while (queue.length > 0) {
    const [node, parent] = queue.shift();
    const attributes = node?.attributes ?? [];
    let label = null;
    let className = "";
    let hidden = false;
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      if (attributes[index] === "accessibility-label") label = String(attributes[index + 1]);
      if (attributes[index] === "class") className = String(attributes[index + 1]);
      // Lynx's documented subtree hiding (the web side honors aria-hidden).
      if (attributes[index] === "accessibility-elements-hidden") {
        hidden = String(attributes[index + 1]) === "true";
      }
    }
    if (hidden) continue;
    if (label) {
      // Native Input names the inner .LxInput field; the control the web names
      // (a padded <input>/<textarea>) is its wrapper.
      const measured = /(^|\s)LxInput(\s|$)/.test(className) && parent ? parent : node;
      const box = await nativeBox(driver, measured.nodeId);
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
    queue.push(...(node?.children ?? []).map((child) => [child, node]));
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

/**
 * Electron (app CSS) gives overflowing panes a classic 10px scrollbar; Lynx
 * scroll-views overlay their indicator. Content in such a pane shifts right by
 * half the gutter when centred and by all of it when right-aligned, and nothing
 * else changes. That is an engine difference, named rather than counted.
 */
export function scrollbarGutterExemption(electron, delta, tolerance = CONTROL_TOLERANCE_PX) {
  const gutter = electron.gutter ?? 0;
  if (gutter <= 0) return null;
  const onlyHorizontal = [delta.y, delta.width, delta.height].every(
    (value) => Math.abs(value) <= tolerance,
  );
  const shift = Math.abs(delta.x);
  const explained =
    Math.abs(shift - gutter / 2) <= tolerance || Math.abs(shift - gutter) <= tolerance;
  return onlyHorizontal && explained && delta.x > 0 ? `scrollbar-gutter (${gutter}px)` : null;
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
    compared.push({
      label,
      electron: e,
      native: n,
      delta,
      worst,
      match: worst <= tolerance,
      exemption:
        worst <= tolerance
          ? null
          : (NAMED_EXEMPTIONS.find((entry) => entry.label.test(label))?.reason ??
            scrollbarGutterExemption(e, delta, tolerance)),
    });
  }
  compared.sort((left, right) => right.worst - left.worst);
  return {
    compared: compared.length,
    matched: compared.filter((entry) => entry.match).length,
    exempt: compared.filter((entry) => entry.exemption),
    outside: compared.filter((entry) => !entry.match && !entry.exemption),
    electronOnly: onlyIn(electron, native),
    // Electron controls with no Native counterpart fail the cell unless named.
    missing: onlyIn(electron, native).filter(
      (label) => !COVERAGE_EXEMPTIONS.some((entry) => entry.label.test(label)),
    ),
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
  const increments = option("--increments", Object.keys(INCREMENTS).join(","))
    .split(",")
    .filter(Boolean);
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
      cell.comparison = {
        ...comparison,
        outside: comparison.outside.slice(0, 25),
        exempt: comparison.exempt.map((entry) => ({
          label: entry.label,
          delta: entry.delta,
          exemption: entry.exemption,
        })),
      };
      cell.pass =
        comparison.outside.length === 0 && comparison.missing.length === 0 && errors.length === 0;
      cell.electronErrors = errors;
    } catch (error) {
      cell.pass = false;
      cell.error = String(error?.message ?? error);
    }
    report.cells[name] = cell;
    const summary = cell.comparison
      ? `${cell.comparison.matched}/${cell.comparison.compared} controls ≤${CONTROL_TOLERANCE_PX}px, ${cell.comparison.exempt.length} named exemptions`
      : cell.error;
    console.log(
      `[cell] ${run.options.theme} ${run.options.width}×${run.options.height} ${name}: ${cell.pass ? "PASS" : "FAIL"} (${summary})`,
    );
  }
  report.increments = {};
  for (const name of increments) {
    const increment = INCREMENTS[name];
    const base = SURFACES[increment.base];
    const cell = { increment: name, workflow: increment.workflow, base: increment.base };
    try {
      for (const driver of [electron, native]) {
        await base.open(driver);
        await waitFor(() => base.ready(driver), {
          label: `${increment.base} on ${driver.kind}`,
          timeoutMs: 20_000,
        });
        await increment.open(driver);
        await waitFor(
          () => (increment.ready ? increment.ready(driver) : probeBox(driver, increment.probes[0])),
          { label: `${name} on ${driver.kind}`, timeoutMs: 15_000 },
        );
      }
      await sleep(600);
      const comparison = compareControls(
        await labeledControls(electron),
        await labeledControls(native),
      );
      const probes = [];
      for (const probe of increment.probes) {
        probes.push(
          compareProbe(probe.name, await probeBox(electron, probe), await probeBox(native, probe)),
        );
      }
      cell.comparison = {
        ...comparison,
        outside: comparison.outside.slice(0, 25),
        exempt: comparison.exempt.map((entry) => ({
          label: entry.label,
          delta: entry.delta,
          exemption: entry.exemption,
        })),
      };
      cell.probes = probes;
      cell.pass =
        comparison.outside.length === 0 &&
        comparison.missing.length === 0 &&
        probes.every((probe) => probe.match);
    } catch (error) {
      cell.pass = false;
      cell.error = String(error?.message ?? error);
    } finally {
      for (const driver of [electron, native]) {
        await Promise.resolve()
          .then(() => increment.close(driver))
          .catch(() => undefined);
      }
      await sleep(400);
    }
    report.increments[name] = cell;
    const probeSummary = (cell.probes ?? [])
      .map(
        (probe) =>
          `${probe.name} ${probe.match ? "≤2px" : JSON.stringify(probe.delta ?? probe.missing)}`,
      )
      .join("; ");
    console.log(
      `[increment] ${run.options.theme} ${run.options.width}×${run.options.height} ${name} (${increment.workflow}): ${cell.pass ? "PASS" : "FAIL"} ${cell.comparison ? `${cell.comparison.matched}/${cell.comparison.compared} controls` : cell.error} ${probeSummary}`,
    );
  }
  const nativeErrorsAfter = nativeConsoleErrors(run.native.devtool.port);
  // On Lynxtron the DevTool console capture can return nothing at all (not even
  // a probe console.error), so an unreadable console is reported as such, never
  // as "no errors".
  report.nativeConsoleErrors =
    nativeErrorsAfter === null || nativeErrorsBefore === null
      ? "unavailable: get-console returned no parsable output"
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
