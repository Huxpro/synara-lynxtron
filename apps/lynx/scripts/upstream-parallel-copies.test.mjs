import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PARALLEL_COPIES_MANIFEST,
  checkEntry,
  declarationTexts,
  hashDeclarations,
  runParallelCopies,
} from "./upstream-parallel-copies.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SOURCE = `import { x } from "./x";
const LIMIT = 3;
export function clamp(value: number): number {
  return Math.min(LIMIT, value);
}
export type Mode = "a" | "b";
function Nested() {
  const LIMIT = 9;
  return LIMIT;
}
`;

test("reads top-level declarations only, whatever their kind", () => {
  assert.deepEqual(declarationTexts(SOURCE, "a.ts", ["LIMIT", "clamp", "Mode"]), [
    "const LIMIT = 3;",
    "export function clamp(value: number): number {\n  return Math.min(LIMIT, value);\n}",
    'export type Mode = "a" | "b";',
  ]);
});

test("an unchanged upstream matches; an edit to a recorded declaration is reported with its copy", () => {
  const entry = {
    upstream: "a.ts",
    symbols: ["LIMIT", "clamp"],
    copies: ["copy.ts"],
    sha256: hashDeclarations(SOURCE, "a.ts", ["LIMIT", "clamp"]),
  };
  assert.deepEqual(checkEntry(entry, SOURCE), []);
  // A change elsewhere in the file is not drift of the copied declarations.
  assert.deepEqual(checkEntry(entry, SOURCE.replace('"a" | "b"', '"a" | "c"')), []);
  const [problem] = checkEntry(entry, SOURCE.replace("const LIMIT = 3;", "const LIMIT = 4;"));
  assert.match(problem, /a\.ts: upstream changed LIMIT, clamp; re-sync copy\.ts/);
});

test("a renamed or removed declaration stops the check instead of passing", () => {
  const entry = { upstream: "a.ts", symbols: ["clamp"], copies: ["copy.ts"], sha256: "x" };
  const [problem] = checkEntry(entry, SOURCE.replace("function clamp", "function clampValue"));
  assert.match(problem, /top-level declaration clamp is gone/);
});

test("--check exits 1 on drift and --update records the new text", () => {
  const root = mkdtempSync(path.join(tmpdir(), "parallel-copies-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "src/a.ts"), SOURCE);
  const manifestFile = path.join(root, "manifest.json");
  writeFileSync(
    manifestFile,
    JSON.stringify({
      entries: [{ upstream: "src/a.ts", symbols: ["clamp"], copies: ["c.ts"], sha256: "" }],
    }),
  );
  const silent = { log: () => {}, logError: () => {} };
  assert.equal(runParallelCopies({ manifestFile, root, ...silent }), 1);
  assert.equal(runParallelCopies({ update: true, manifestFile, root, ...silent }), 0);
  assert.equal(runParallelCopies({ manifestFile, root, ...silent }), 0);
  writeFileSync(path.join(root, "src/a.ts"), SOURCE.replace("Math.min", "Math.max"));
  assert.equal(runParallelCopies({ manifestFile, root, ...silent }), 1);
});

test("the committed manifest matches upstream and every listed copy exists", () => {
  const manifest = JSON.parse(readFileSync(path.join(repoRoot, PARALLEL_COPIES_MANIFEST), "utf8"));
  assert.ok(manifest.entries.length > 0);
  for (const entry of manifest.entries) {
    assert.deepEqual(
      checkEntry(entry, readFileSync(path.join(repoRoot, entry.upstream), "utf8")),
      [],
    );
    assert.ok(entry.copies.length > 0, `${entry.upstream} names no copy`);
    for (const copy of entry.copies) readFileSync(path.join(repoRoot, copy), "utf8");
  }
});
