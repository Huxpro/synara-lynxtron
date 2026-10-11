import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { excludeStop } from "./chat-workflow-without-stop.mjs";

test("adapts only the Stop/resend block of the current J1 and preserves later workflows", () => {
  const source = readFileSync(
    new URL("../../../scripts/comparison-workflows.mjs", import.meta.url),
    "utf8",
  );
  const adapted = excludeStop(source);
  const reload =
    '    await step("reload the renderer, reopen the thread, and continue it", async () => {';
  assert.equal(adapted.slice(adapted.indexOf(reload)), source.slice(source.indexOf(reload)));
  assert.ok(adapted.includes("send again without Stop (#35 excluded)"));
  assert.ok(adapted.includes("resendToken, thread.threadId"));
  assert.ok(!adapted.includes('await driver.tap({ label: "Stop generation" })'));
});

test("refuses changed, duplicated, or reversed boundaries", () => {
  const start = '    await step("stop a streaming turn, then resend", async () => {';
  const end =
    '    await step("reload the renderer, reopen the thread, and continue it", async () => {';
  assert.throws(() => excludeStop(""));
  assert.throws(() => excludeStop(start + start + end));
  assert.throws(() => excludeStop(end + start));
});
