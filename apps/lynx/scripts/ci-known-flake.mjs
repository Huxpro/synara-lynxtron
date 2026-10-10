// FILE: ci-known-flake.mjs
// Purpose: Decide whether a failed run of upstream's CI workflow failed ONLY on
//          the one known upstream test race, so the fork may re-run it once.
// Layer: Fork CI tooling (used by the rerun job in .github/workflows/lynx-fork.yml)
//
// The race (tracking issue #50): in apps/web/src/components/ChatView.browser.tsx,
// "keeps sidebar shortcut hints clear of row content" hovers a pinned sidebar row
// about 8 s after mount. The Activity coachmark holds the announcement slot for
// 8 s and then hands it to the Tasks coachmark, whose popup opens over that row.
// When it opens between the hover and the opacity read, the row loses :hover and
// the assertion reads 1. Upstream owns the test and ci.yml, and the fork edits
// neither. Delete this file and the workflow once the upstream fix is merged in.
//
// The decision is deliberately narrow: first attempt only, the chat-workflows
// browser shard is the only failed lane, and that shard has exactly one failed
// test with this name and this assertion. Anything else is left red.

import { readFileSync, appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const KNOWN_FLAKE_TEST =
  "keeps sidebar shortcut hints clear of row content (Activity: false, custom: ";
export const KNOWN_FLAKE_ASSERTION = "AssertionError: expected 1 to be +0";

const SHARD_JOB = /^Browser Tests \(chat-workflows \d+\/\d+\)$/;
// The aggregate job fails whenever a lane fails; it carries no result of its own.
const AGGREGATE_JOB = "Format, Lint, Typecheck, Test, Browser Test, Build";
const PASSING = new Set(["success", "skipped"]);

/** Removes the Actions timestamp prefix and ANSI colour codes from a log. */
export function normalizeLog(log) {
  return log
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^﻿?\d{4}-\d{2}-\d{2}T[\d:.]+Z /, ""));
}

/** Names of the tests Vitest reported as failed ("   × name 123ms"). */
export function failedTestNames(log) {
  const names = [];
  for (const line of normalizeLog(log)) {
    const match = /^\s+× (.+?)\s+\d+ms$/.exec(line);
    if (match) names.push(match[1]);
  }
  return names;
}

/**
 * @param {{ attempt: number, jobs: Array<{ name: string, conclusion: string | null }>, shardLog: string | null }} input
 * @returns {{ rerun: boolean, reason: string }}
 */
export function decideRerun({ attempt, jobs, shardLog }) {
  if (attempt !== 1)
    return { rerun: false, reason: `attempt ${attempt}: only the first is re-run` };
  const notPassing = jobs.filter((job) => !PASSING.has(job.conclusion ?? "pending"));
  const shards = notPassing.filter((job) => SHARD_JOB.test(job.name));
  const others = notPassing.filter(
    (job) => !SHARD_JOB.test(job.name) && job.name !== AGGREGATE_JOB,
  );
  if (others.length > 0) {
    return {
      rerun: false,
      reason: `other lanes did not pass: ${others.map((j) => j.name).join(", ")}`,
    };
  }
  if (shards.length !== 1 || shards[0].conclusion !== "failure") {
    return { rerun: false, reason: "the chat-workflows shard is not the single failed lane" };
  }
  if (!shardLog) return { rerun: false, reason: "no shard log to inspect" };
  const failed = failedTestNames(shardLog);
  if (failed.length !== 1) {
    return {
      rerun: false,
      reason: `${failed.length} failed tests in the shard, expected exactly 1`,
    };
  }
  if (!failed[0].startsWith(KNOWN_FLAKE_TEST)) {
    return { rerun: false, reason: `failed test is not the known race: ${failed[0]}` };
  }
  const lines = normalizeLog(shardLog);
  if (!lines.some((line) => line.startsWith(KNOWN_FLAKE_ASSERTION))) {
    return { rerun: false, reason: "the known test failed with a different assertion" };
  }
  if (!lines.some((line) => /^\s+Tests\s+1 failed\b/.test(line))) {
    return { rerun: false, reason: "the Vitest summary does not report exactly 1 failed test" };
  }
  return { rerun: true, reason: `only the known coachmark race failed: ${failed[0]}` };
}

function main(argv) {
  const arg = (name) => {
    const index = argv.indexOf(name);
    return index === -1 ? null : (argv[index + 1] ?? null);
  };
  const jobsPath = arg("--jobs");
  const logPath = arg("--log");
  const attempt = Number(arg("--attempt"));
  if (!jobsPath || !Number.isInteger(attempt)) {
    console.error("usage: ci-known-flake.mjs --attempt <n> --jobs <jobs.json> [--log <shard.log>]");
    process.exit(2);
  }
  const jobs = JSON.parse(readFileSync(jobsPath, "utf8"));
  const shardLog = logPath ? readFileSync(logPath, "utf8") : null;
  const decision = decideRerun({ attempt, jobs, shardLog });
  console.log(JSON.stringify(decision));
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `rerun=${decision.rerun}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
