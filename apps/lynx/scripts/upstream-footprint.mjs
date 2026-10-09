#!/usr/bin/env node
// FILE: apps/lynx/scripts/upstream-footprint.mjs
// Purpose: Measures the fork's diff inside upstream-owned paths against the
//   last merged upstream commit, and fails `--check` when it grows. The fork
//   consumes pristine upstream source through build-time derivation (aliases,
//   environment shims, generated modules); hand edits to upstream files are
//   legacy to be removed, so the footprint may only shrink.
// Usage: node apps/lynx/scripts/upstream-footprint.mjs [--check] [--update-baseline] [--json]
//   [--working-tree]  measure the working tree instead of HEAD (before committing)

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, "../../..");
const BASELINE_PATH = join(repoRoot, "apps/lynx/plan/upstream-footprint.baseline.json");

// Paths upstream owns. Everything under them should match upstream.
export const UPSTREAM_OWNED_PATHS = Object.freeze([
  "apps/web",
  "apps/server",
  "apps/desktop",
  "apps/marketing",
  "packages",
  ".github",
]);

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

export function parseNameStatus(output) {
  const modified = [];
  const added = [];
  const deleted = [];
  for (const line of output.split("\n")) {
    if (!line) continue;
    const [status, ...paths] = line.split("\t");
    const path = paths.at(-1);
    if (status.startsWith("A")) added.push(path);
    else if (status.startsWith("D")) deleted.push(path);
    else modified.push(path);
  }
  return { modified, added, deleted };
}

export function parseNumstat(output) {
  let lines = 0;
  for (const line of output.split("\n")) {
    if (!line) continue;
    const [added, removed] = line.split("\t");
    lines += (Number(added) || 0) + (Number(removed) || 0);
  }
  return lines;
}

// Files the fork changed that upstream also has. Fork-added files are counted
// separately: they do not conflict, but they do not belong in upstream's tree.
export function measureFootprint(upstreamRevision, { workingTree = false } = {}) {
  const pathspec = ["--", ...UPSTREAM_OWNED_PATHS];
  // Without a second revision `git diff` compares against the working tree
  // (tracked files; an untracked file there is not counted until it is added).
  const revisions = workingTree ? [upstreamRevision] : [upstreamRevision, "HEAD"];
  const { modified, added, deleted } = parseNameStatus(
    git(["diff", "--name-status", "--no-renames", ...revisions, ...pathspec]),
  );
  const changedLines = parseNumstat(
    git(["diff", "--numstat", "--no-renames", "--diff-filter=MD", ...revisions, ...pathspec]),
  );
  return {
    modifiedUpstreamFiles: modified.length + deleted.length,
    changedLinesInUpstreamFiles: changedLines,
    forkFilesInUpstreamPaths: added.length,
  };
}

export function compareFootprint(current, baseline) {
  return Object.keys(baseline.counts)
    .filter((key) => current[key] > baseline.counts[key])
    .map((key) => `${key}: ${current[key]} > baseline ${baseline.counts[key]}`);
}

// Prefer the live upstream ref (it moves the base forward after a merge); fall
// back to the recorded revision where the remote is not configured, e.g. CI.
function resolveUpstreamRevision(baseline) {
  try {
    return git(["merge-base", "HEAD", baseline.upstreamRef]).trim();
  } catch {
    return baseline.upstreamRevision;
  }
}

function main() {
  const flags = new Set(process.argv.slice(2));
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  const upstreamRevision = resolveUpstreamRevision(baseline);
  const current = measureFootprint(upstreamRevision, { workingTree: flags.has("--working-tree") });
  if (flags.has("--update-baseline")) {
    const next = { ...baseline, upstreamRevision, counts: current };
    writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`Baseline updated at ${upstreamRevision.slice(0, 9)}: ${JSON.stringify(current)}`);
    return;
  }
  if (flags.has("--json")) {
    console.log(JSON.stringify({ upstreamRevision, current, baseline: baseline.counts }, null, 2));
  } else {
    console.log(`Fork footprint in upstream-owned paths vs ${upstreamRevision.slice(0, 9)}:`);
    for (const [key, value] of Object.entries(current)) {
      console.log(`  ${key}: ${value} (baseline ${baseline.counts[key]})`);
    }
  }
  if (!flags.has("--check")) return;
  const regressions = compareFootprint(current, baseline);
  if (regressions.length > 0) {
    console.error(
      "\nThe fork's footprint in upstream-owned files grew. Do not edit upstream files: " +
        "absorb the difference on the Lynx side (alias, environment shim, generated module). " +
        "See apps/lynx/docs/architecture-principles.md.\n  " +
        regressions.join("\n  "),
    );
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
