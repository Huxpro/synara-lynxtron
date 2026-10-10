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
  NAVIGATION_TARGETS,
  showAppSidebar,
  DOCK_ADD_PANEL,
  DOCK_FIRST_OPEN_TIMEOUT_MS,
  DOCK_TOGGLE,
  openAutomationsSurface,
  openDockWithPane,
  openKanbanSurface,
  openPullRequestsSurface,
  openSettings,
  pick,
  settingsShown,
} from "./comparison-navigation.mjs";
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

/**
 * Controls that sit a fixed distance from Electron's because a block above them exists
 * only on the Electron host. Unlike a named exemption, the control still has to be where
 * the offset says, at its Electron size: only the stated shift is explained.
 */
export const NAMED_OFFSETS = Object.freeze([
  {
    // The General settings rows, top to bottom as far as either matrix size shows them.
    label:
      /^(Default provider|Default thread mode|Delete worktree on archive|Move sent messages to top|Project sort order|Thread sort order)$/,
    delta: { x: 0, y: -222 },
    reason:
      "Electron's General panel opens with the Safari import button (28px + 24px gap) and the Synara Beta card (146px + 24px gap), which upstream renders only where the Electron desktop bridge supports them; Native has no such bridge, so its rows start 222px higher",
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
const textTarget = (selector, text, label) => ({
  electron: { selector, text },
  native: { label: label ?? text },
});

/** How each base surface is reached, and what proves it is ready. */
export const SURFACES = Object.freeze({
  landing: {
    open: async (driver) => {
      await showAppSidebar(driver);
      await driver.tap(pick(driver, NAVIGATION_TARGETS.newThread));
    },
    ready: async (driver) => {
      const composer = await driver.find(
        pick(driver, {
          electron: { testId: "composer-editor" },
          native: { label: "Message composer" },
        }),
      );
      if (!composer || driver.kind !== "electron") return composer;
      return (await electronModelTriggerSettled(driver)) ? composer : null;
    },
  },
  thread: {
    open: async (driver) => {
      await showAppSidebar(driver);
      await driver.tap({ attribute: ["data-thread-id", FIXTURE_TRANSCRIPT_THREAD_ID] });
    },
    ready: (driver) => driver.find({ label: "Copy message" }),
  },
  settings: {
    open: openSettings,
    ready: settingsShown,
  },
  kanban: {
    open: openKanbanSurface,
    ready: (driver) => driver.find(pick(driver, textTarget("main button", "New task"))),
  },
  pr: {
    open: openPullRequestsSurface,
    // Upstream's Code review page, on both renderers: the kind tab carries its count once
    // the inbox list has loaded.
    ready: (driver) => driver.find({ label: "All, 0" }),
  },
  automations: {
    open: openAutomationsSurface,
    ready: (driver) => driver.find(pick(driver, textTarget("button", "New automation"))),
  },
});

const MODEL_TRIGGER_QUIET_MS = 6_000;
const modelTriggerSeen = new WeakMap();

/**
 * Electron draws the composer's model trigger before its model catalog has loaded: the
 * effort label ("Medium") is missing until then, so the trigger is ~50px narrower and
 * everything left of it sits elsewhere. Native reads the built-in catalog and shows the
 * label at once. Settled means the effort label is there, or (a model without an effort
 * ladder never gets one) the trigger has kept its width for MODEL_TRIGGER_QUIET_MS.
 */
async function electronModelTriggerSettled(driver) {
  const trigger = await driver.evaluate(`(() => {
    const node = document.querySelector('[aria-label="Change model and reasoning"]');
    if (!node) return null;
    const label = node.querySelector("span > span > span");
    return {
      width: node.getBoundingClientRect().width,
      // Provider icon and model name are always there; the effort label is a second span.
      hasEffortLabel: (label?.querySelectorAll(":scope > span").length ?? 0) > 1,
    };
  })()`);
  return modelTriggerSettled(modelTriggerSeen, driver, trigger, Date.now());
}

/** Pure part of the check above, so the timing rule can be tested without a renderer. */
export function modelTriggerSettled(seenByDriver, driver, trigger, now) {
  if (!trigger) {
    seenByDriver.delete(driver);
    return false;
  }
  if (trigger.hasEffortLabel) return true;
  const seen = seenByDriver.get(driver);
  if (!seen || seen.width !== trigger.width) {
    seenByDriver.set(driver, { width: trigger.width, since: now });
    return false;
  }
  return now - seen.since >= MODEL_TRIGGER_QUIET_MS;
}

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

/** What the right dock shows: its tabs, the empty dock's launcher, or nothing. */
async function dockShown(driver) {
  if (await driver.find(DOCK_ADD_PANEL)) return "tabs";
  return (await driver.find({ label: "Open Review" })) ? "launcher" : "closed";
}

/** The dock as "add-panel-menu" found it, per renderer, so its close can restore it. */
const dockBeforeAddPanelMenu = new WeakMap();

/**
 * State increments (plan N4), each tied to the workflow that exercises it: opened
 * from a base surface, measured (labelled controls plus popup/dialog boxes), closed.
 */
export const INCREMENTS = Object.freeze({
  "landing-diff-dock": {
    workflow: "J3",
    base: "landing",
    // The web landing is the draft thread: its toggle opens the empty dock's launcher.
    open: (driver) => driver.tap(DOCK_TOGGLE),
    ready: (driver) => driver.find({ label: "Open Review" }),
    readyTimeoutMs: DOCK_FIRST_OPEN_TIMEOUT_MS,
    probes: [],
    close: (driver) => driver.tap(DOCK_TOGGLE),
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
      dockBeforeAddPanelMenu.set(driver, await dockShown(driver));
      await openDockWithPane(driver, "Open Review");
      await driver.tap(DOCK_ADD_PANEL);
    },
    // The dock keeps whichever panes earlier steps opened, so only the menu is awaited.
    ready: (driver) => probeBox(driver, MENU_PROBE),
    probes: [MENU_PROBE],
    // Puts the dock back as it was found. A Diff pane left open sits ahead of the panes a
    // later workflow adds, which changes that workflow's tab order on both renderers.
    close: async (driver) => {
      await driver.tap(DOCK_ADD_PANEL);
      await waitFor(async () => !(await probeBox(driver, MENU_PROBE)), {
        label: `the Add panel menu to close on ${driver.kind}`,
      });
      const before = dockBeforeAddPanelMenu.get(driver);
      dockBeforeAddPanelMenu.delete(driver);
      if (before === undefined || before === "tabs") return;
      await driver.tap({ label: "Close Diff" });
      await waitFor(() => driver.find({ label: "Open Review" }), {
        label: `the empty dock on ${driver.kind}`,
      });
      if (before === "closed") await driver.tap(DOCK_TOGGLE);
    },
  },
  "settings-appearance": {
    workflow: "J4",
    base: "settings",
    open: (driver) => driver.tap(pick(driver, textTarget("button", "Appearance"))),
    // Upstream's Appearance panel opens on the theme mode picker, on both renderers.
    ready: (driver) => driver.find({ label: "Theme preference" }),
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
  "automation-model-menu": {
    workflow: "J5",
    base: "automations",
    // The web automation dialog uses the compact provider/model picker.
    open: async (driver) => {
      await driver.tap(pick(driver, textTarget("button", "New automation")));
      await waitFor(() => probeBox(driver, DIALOG_PROBE), { label: "automation dialog" });
      await driver.tap(
        pick(driver, {
          electron: {
            selector: '[role="dialog"] button[data-slot="menu-trigger"]',
            text: "GPT-5 Codex",
          },
          native: { label: "Change model and reasoning" },
        }),
      );
    },
    probes: [MENU_PROBE],
    close: async (driver) => {
      await driver.tap(
        pick(driver, {
          electron: {
            selector: '[role="dialog"] button[data-slot="menu-trigger"]',
            text: "GPT-5 Codex",
          },
          native: { label: "Change model and reasoning" },
        }),
      );
      await driver.tap(
        pick(driver, {
          electron: { selector: '[role="dialog"] button', text: "Cancel" },
          native: { text: "Cancel" },
        }),
      );
    },
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
        // A control an ancestor clips away entirely is not on screen: the rail layout keeps
        // the collapsed panel mounted at its full width inside a zero-width, paint-contained
        // column, so its rows still have boxes that overlap the window.
        let left = r.left, top = r.top, right = r.right, bottom = r.bottom;
        for (let parent = control.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          const clipsX = style.overflowX !== "visible" || /paint|strict|content/.test(style.contain);
          const clipsY = style.overflowY !== "visible" || /paint|strict|content/.test(style.contain);
          if (!clipsX && !clipsY) continue;
          const p = parent.getBoundingClientRect();
          if (clipsX) { left = Math.max(left, p.left); right = Math.min(right, p.right); }
          if (clipsY) { top = Math.max(top, p.top); bottom = Math.min(bottom, p.bottom); }
          if (right <= left || bottom <= top) return [];
        }
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

/**
 * A named offset explains a control only when what is left after removing the offset is
 * within tolerance (or is the scrollbar gutter).
 */
export function namedOffsetExemption(label, electron, delta, tolerance = CONTROL_TOLERANCE_PX) {
  const offset = NAMED_OFFSETS.find((entry) => entry.label.test(label));
  if (!offset) return null;
  const rest = {
    x: round(delta.x - offset.delta.x),
    y: round(delta.y - offset.delta.y),
    width: delta.width,
    height: delta.height,
  };
  const within = Object.values(rest).every((value) => Math.abs(value) <= tolerance);
  return within || scrollbarGutterExemption(electron, rest, tolerance) ? offset.reason : null;
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
            scrollbarGutterExemption(e, delta, tolerance) ??
            namedOffsetExemption(label, e, delta, tolerance)),
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

/**
 * `get-console` prints one `- [level/thread]: message` entry per console
 * message, each possibly spanning several lines, and nothing when there are
 * none.
 */
export function parseDevtoolConsole(output) {
  const entries = [];
  for (const line of output.split("\n")) {
    const header = /^- \[([a-z]+)\/([a-z-]+)\]: (.*)$/.exec(line);
    if (header) {
      entries.push({ level: header[1], thread: header[2], text: header[3] });
    } else if (entries.length > 0 && line.trim() !== "") {
      entries[entries.length - 1].text += `\n${line}`;
    } else if (line.trim() !== "") {
      throw new Error(`Unrecognized get-console output: ${line}`);
    }
  }
  return entries;
}

/**
 * The errors logged between the run's two probes. An unreadable console, or
 * one that missed either probe, is reported as unavailable, never as clean.
 */
export function errorsBetweenProbes(entries, probe) {
  if (entries === null) return "unavailable: get-console returned no parsable output";
  const start = entries.findIndex((entry) => entry.text.includes(`${probe}:start`));
  const end = entries.findIndex((entry) => entry.text.includes(`${probe}:end`));
  if (start < 0 || end < 0) return "unavailable: get-console did not capture the run's probes";
  return entries.slice(start + 1, end);
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
    return parseDevtoolConsole(output);
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
  await installElectronErrorHook(electron);
  // The DevTool hands the console backlog to the first `get-console` of an app
  // session and returns nothing to later ones. So the console is read once, at
  // the end, and the run brackets itself with two probe errors: errors are
  // reported only when both probes came back. A session whose console was
  // already read (an earlier cell run, a manual `get-console`) reports
  // "unavailable"; relaunch to observe errors.
  const consoleProbe = `comparison-cells-probe-${Date.now()}`;
  await native.evaluate(`console.error(${JSON.stringify(`${consoleProbe}:start`)})`);
  const report = {
    runId: run.runId,
    theme: run.options.theme,
    window: { width: run.options.width, height: run.options.height },
    tolerancePx: CONTROL_TOLERANCE_PX,
    cells: {},
  };
  const measured = await measureCells({
    electron,
    native,
    surfaces,
    increments,
    title: `${run.options.theme} ${run.options.width}×${run.options.height}`,
  });
  report.cells = measured.cells;
  report.increments = measured.increments;
  await native.evaluate(`console.error(${JSON.stringify(`${consoleProbe}:end`)})`);
  await sleep(500);
  report.nativeConsoleErrors = errorsBetweenProbes(
    nativeConsoleErrors(run.native.devtool.port),
    consoleProbe,
  );
  electron.close();
  native.close();
  const out = option("--out");
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  }
  process.exit(0);
}

/**
 * Hooks page errors on the reference renderer so each surface cell can report them. Safe
 * to call again after a reload.
 */
export function installElectronErrorHook(electron) {
  return electron.evaluate(
    `window.__comparisonCellErrors ??= []; if (!window.__comparisonCellErrorsHooked) { window.__comparisonCellErrorsHooked = true; addEventListener("error", (event) => window.__comparisonCellErrors.push(String(event.message))); addEventListener("unhandledrejection", (event) => window.__comparisonCellErrors.push(String(event.reason))); }`,
  );
}

/**
 * Measures the named surfaces, then the named increments, on one open pair of drivers:
 * the reference renderer (`electron`: Electron, or the Web original in a browser) and the
 * Lynx renderer (`native`: Lynxtron, or Lynx for Web). One loop for every pair, so the
 * desktop matrix and the browser pair (comparison-web.mjs) cannot measure differently.
 * `title` prefixes each result line (theme and window size).
 */
export async function measureCells({
  electron,
  native,
  surfaces,
  increments,
  title,
  surfaceReadyTimeoutMs = 20_000,
}) {
  const report = { cells: {}, increments: {} };
  for (const name of surfaces) {
    const surface = SURFACES[name];
    const cell = { surface: name };
    try {
      for (const driver of [electron, native]) {
        await surface.open(driver);
        await waitFor(() => surface.ready(driver), {
          label: `${name} on ${driver.kind}`,
          timeoutMs: surfaceReadyTimeoutMs,
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
    console.log(`[cell] ${title} ${name}: ${cell.pass ? "PASS" : "FAIL"} (${summary})`);
  }
  for (const name of increments) {
    const increment = INCREMENTS[name];
    const base = SURFACES[increment.base];
    const cell = { increment: name, workflow: increment.workflow, base: increment.base };
    try {
      for (const driver of [electron, native]) {
        await base.open(driver);
        await waitFor(() => base.ready(driver), {
          label: `${increment.base} on ${driver.kind}`,
          timeoutMs: surfaceReadyTimeoutMs,
        });
        await increment.open(driver);
        await waitFor(
          () => (increment.ready ? increment.ready(driver) : probeBox(driver, increment.probes[0])),
          { label: `${name} on ${driver.kind}`, timeoutMs: increment.readyTimeoutMs ?? 15_000 },
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
      `[increment] ${title} ${name} (${increment.workflow}): ${cell.pass ? "PASS" : "FAIL"} ${cell.comparison ? `${cell.comparison.matched}/${cell.comparison.compared} controls` : cell.error} ${probeSummary}`,
    );
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
