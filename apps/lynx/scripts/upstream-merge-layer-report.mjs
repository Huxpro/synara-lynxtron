#!/usr/bin/env node
// FILE: apps/lynx/scripts/upstream-merge-layer-report.mjs
// Purpose: After (or before) an upstream merge, show where upstream's apps/web
//   changes land relative to the Lynx reuse graph, so the hand-port queue is an
//   explicit list instead of something found by comparing screenshots.
// Usage: node apps/lynx/scripts/upstream-merge-layer-report.mjs <base> <head> [--json]
//   <base>/<head> are git revisions, e.g. the previous sync point and upstream/main.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, "../../..");
const REUSE_REPORT = join(repoRoot, "apps/lynx/plan/reports/p5-r1-reuse-baseline.json");
const WEB_SOURCE_ROOT = "apps/web/src/";
const TEST_FILE = /\.(test|browser)\.tsx?$|(^|\/)__tests__\/|Fixtures?\.tsx?$/;

// Web modules whose behavior Lynx still re-implements instead of sharing. A
// change here never conflicts in git; it has to be ported by hand, so call it
// out. Modules leave this list when Lynx starts running the upstream source:
// wsNativeApi.ts, store.ts, storeSelectors.ts (M1-M3a) and routes/__root.tsx
// (EventRouter is generated from it) are no longer here.
export const LYNX_PARALLEL_STATE_MODULES = Object.freeze({
  "apps/web/src/wsTransport.ts": "apps/lynx/src/adapters/wsTransport.lynx.ts (compat transport)",
  "apps/web/src/components/ChatView.tsx": "apps/lynx/src/app/router.tsx (ThreadPage)",
  "apps/web/src/components/Sidebar.tsx": "apps/lynx/src/components/sidebar/Sidebar.lynx.tsx",
});

// State modules Lynx runs from upstream source (directly, or through the
// EventRouter generator), whatever the reuse report's classification says.
export const LYNX_SHARED_STATE_MODULES = Object.freeze(
  new Set([
    "apps/web/src/routes/__root.tsx",
    "apps/web/src/wsNativeApi.ts",
    "apps/web/src/store.ts",
    "apps/web/src/storeSelectors.ts",
  ]),
);

export function classifyUpstreamChange(path, reuseModules) {
  if (TEST_FILE.test(path)) return "tests";
  if (path in LYNX_PARALLEL_STATE_MODULES) return "parallel-state";
  if (LYNX_SHARED_STATE_MODULES.has(path)) return "shared";
  const module = reuseModules.get(path);
  if (!module) return "web-only";
  if (module.currentReuse === "SHARED") return "shared";
  if (module.classification === "EXCLUSIVE") return "exclusive";
  return "lynx-counterpart";
}

export const LAYER_LABELS = Object.freeze({
  shared: "Shared with Lynx (arrives with the merge)",
  "parallel-state": "State/session with a parallel Lynx implementation (port by hand)",
  "lynx-counterpart": "Reachable from Lynx through its own counterpart (port by hand)",
  exclusive: "Platform-exclusive on Lynx (port by hand if the feature exists there)",
  "web-only": "Not reachable from Lynx (web-only or new)",
  tests: "Tests",
});

function readReuseModules() {
  const report = JSON.parse(readFileSync(REUSE_REPORT, "utf8"));
  const modules = new Map();
  for (const screen of report.screens) {
    for (const module of screen.modules) modules.set(module.path, module);
  }
  return { modules, generatedAt: report.generatedAt };
}

function readNumstat(base, head) {
  const output = execFileSync(
    "git",
    ["diff", "--numstat", "--no-renames", base, head, "--", WEB_SOURCE_ROOT],
    { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [added, deleted, path] = line.split("\t");
      return { path, churn: (Number(added) || 0) + (Number(deleted) || 0) };
    });
}

export function buildLayerReport(changes, reuseModules) {
  const layers = new Map(Object.keys(LAYER_LABELS).map((key) => [key, { files: [], churn: 0 }]));
  for (const change of changes) {
    const layer = layers.get(classifyUpstreamChange(change.path, reuseModules));
    layer.files.push(change);
    layer.churn += change.churn;
  }
  for (const layer of layers.values()) layer.files.sort((left, right) => right.churn - left.churn);
  return layers;
}

function main() {
  const [base, head, ...flags] = process.argv.slice(2);
  if (!base || !head) {
    console.error("Usage: upstream-merge-layer-report.mjs <base> <head> [--json]");
    process.exit(2);
  }
  const { modules, generatedAt } = readReuseModules();
  const changes = readNumstat(base, head);
  const layers = buildLayerReport(changes, modules);
  if (flags.includes("--json")) {
    console.log(JSON.stringify(Object.fromEntries(layers), null, 2));
    return;
  }
  const totalChurn = changes.reduce((sum, change) => sum + change.churn, 0);
  console.log(`Upstream changes in ${WEB_SOURCE_ROOT} between ${base} and ${head}`);
  console.log(`${changes.length} files, ${totalChurn} changed lines.`);
  console.log(`Reuse classification from ${generatedAt}; rerun audit:reuse if it is stale.\n`);
  for (const [key, layer] of layers) {
    const share = totalChurn === 0 ? 0 : (100 * layer.churn) / totalChurn;
    console.log(
      `${LAYER_LABELS[key]}: ${layer.files.length} files, ${layer.churn} lines (${share.toFixed(1)}%)`,
    );
    if (key === "shared" || key === "web-only" || key === "tests") continue;
    for (const change of layer.files.slice(0, 15)) {
      const counterpart = LYNX_PARALLEL_STATE_MODULES[change.path];
      console.log(
        `  ${String(change.churn).padStart(5)}  ${change.path.slice(WEB_SOURCE_ROOT.length)}` +
          (counterpart ? `  ->  ${counterpart}` : ""),
      );
    }
    if (layer.files.length > 15) console.log(`  ... ${layer.files.length - 15} more`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
