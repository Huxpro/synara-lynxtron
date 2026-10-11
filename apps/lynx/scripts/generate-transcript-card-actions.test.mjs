import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { SOURCES, generateTranscriptCardActions } from "./generate-transcript-card-actions.mjs";
const sources = Object.fromEntries(
  Object.entries(SOURCES).map(([key, file]) => [
    key,
    fs.readFileSync(new URL(`../../../${file}`, import.meta.url), "utf8"),
  ]),
);
test("extracts upstream plan, undo and recovery decisions", () => {
  const output = generateTranscriptCardActions(sources);
  assert.match(output, /\.plan\/\$\{filename\}/);
  assert.match(output, /toSorted\(\(left, right\) => right - left\)/);
  assert.match(output, /scope: "files"/);
  assert.match(output, /current\.hasPendingApprovals/);
  assert.match(output, /avoid repeating them and resume the remaining work/);
});
test("fails closed on absent or duplicated callback", () => {
  assert.throws(
    () =>
      generateTranscriptCardActions({
        ...sources,
        undo: sources.undo.replace("const onUndoTurnFiles", "const otherUndo"),
      }),
    /Expected one onUndoTurnFiles/,
  );
  assert.throws(
    () =>
      generateTranscriptCardActions({
        ...sources,
        plan: sources.plan + "\nconst handleCopy = () => {};",
      }),
    /Expected one handleCopy/,
  );
});
test("fails closed on changed recovery guard shape", () => {
  assert.throws(
    () =>
      generateTranscriptCardActions({
        ...sources,
        recovery: sources.recovery.replaceAll("return false;", "return null;"),
      }),
    /changed shape/,
  );
});
