import assert from "node:assert/strict";
import test from "node:test";

import { decideRerun, failedTestNames } from "./ci-known-flake.mjs";

const SHARD = "Browser Tests (chat-workflows 1/1)";
const AGGREGATE = "Format, Lint, Typecheck, Test, Browser Test, Build";
const FLAKE = "keeps sidebar shortcut hints clear of row content (Activity: false, custom: false)";

// Shaped like `gh api repos/<repo>/actions/jobs/<id>/logs`: timestamp prefix, ANSI colours.
const line = (text) => `2026-10-09T18:38:01.0548081Z ${text}`;
const shardLog = (
  failed,
  assertion = "AssertionError: expected 1 to be +0 // Object.is equality",
) =>
  [
    line(
      "     \u001b[33m\u001b[2m✓\u001b[22m\u001b[39m keeps the active chat explicitly unread \u001b[33m 19746\u001b[2mms\u001b[22m\u001b[39m",
    ),
    ...failed.map((name) =>
      line(
        `\u001b[31m     \u001b[31m×\u001b[31m ${name}\u001b[39m\u001b[33m 9251\u001b[2mms\u001b[22m\u001b[39m`,
      ),
    ),
    line(
      `\u001b[31m\u001b[1mAssertionError\u001b[22m: ${assertion.replace("AssertionError: ", "")}\u001b[39m`,
    ),
    line("  2 × retrying hover action"),
    line(
      `\u001b[2m      Tests \u001b[22m \u001b[1m\u001b[31m${failed.length} failed\u001b[39m\u001b[22m | 127 passed (208)`,
    ),
  ].join("\n");

const jobs = (extra = []) => [
  { name: "Typecheck", conclusion: "success" },
  { name: "Browser Tests (components 1/1)", conclusion: "success" },
  { name: SHARD, conclusion: "failure" },
  { name: AGGREGATE, conclusion: "failure" },
  ...extra,
];

test("reads failed test names and ignores Playwright call-log lines", () => {
  assert.deepEqual(failedTestNames(shardLog([FLAKE])), [FLAKE]);
});

test("re-runs when only the known race failed on the first attempt", () => {
  assert.equal(decideRerun({ attempt: 1, jobs: jobs(), shardLog: shardLog([FLAKE]) }).rerun, true);
});

test("never re-runs a second attempt", () => {
  assert.equal(decideRerun({ attempt: 2, jobs: jobs(), shardLog: shardLog([FLAKE]) }).rerun, false);
});

test("leaves the run red when another test failed beside the race", () => {
  const log = shardLog([FLAKE, "cancels a multi-question (confirmed)"]);
  assert.equal(decideRerun({ attempt: 1, jobs: jobs(), shardLog: log }).rerun, false);
});

test("leaves the run red when a different test failed", () => {
  const log = shardLog(["follows the final text batch when the assistant turn settles"]);
  assert.equal(decideRerun({ attempt: 1, jobs: jobs(), shardLog: log }).rerun, false);
});

test("leaves the run red when the known test fails another way", () => {
  const log = shardLog([FLAKE], "AssertionError: expected 5 to be 6 // Object.is equality");
  assert.equal(decideRerun({ attempt: 1, jobs: jobs(), shardLog: log }).rerun, false);
});

test("leaves the run red when any other lane failed or was cancelled", () => {
  for (const conclusion of ["failure", "cancelled", "timed_out", null]) {
    const decision = decideRerun({
      attempt: 1,
      jobs: jobs([{ name: "Unit Tests", conclusion }]),
      shardLog: shardLog([FLAKE]),
    });
    assert.equal(decision.rerun, false, String(conclusion));
  }
});

test("leaves the run red without a shard log", () => {
  assert.equal(decideRerun({ attempt: 1, jobs: jobs(), shardLog: null }).rerun, false);
});
