import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { formatGeneratedText } from "./format-generated.mjs";
import {
  DIFF_CHANGE_MARKERS_OUTPUT,
  DIFF_CHANGE_MARKERS_SOURCE,
  generateDiffChangeMarkers,
  runDiffChangeMarkersGenerator,
} from "./generate-diff-change-markers.mjs";
import { EventRouterGenerationError } from "./generate-event-router.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const upstreamSource = fs.readFileSync(path.join(repoRoot, DIFF_CHANGE_MARKERS_SOURCE), "utf8");

const FIXTURE = `
import { useEffect } from "react";
import { type DiffChangeMarkerKind, resolveDiffChangeMarkers } from "./DiffPanel.logic";

const UNRELATED = 3;

const CHANGE_MARKER_COLOR_BY_KIND: Record<DiffChangeMarkerKind, string> = {
  added: "var(--success)",
  removed: "var(--destructive)",
  modified: "var(--muted-foreground)",
};

const CHANGE_MARKER_LABEL_BY_KIND: Record<DiffChangeMarkerKind, string> = {
  added: "Added",
  removed: "Deleted",
  modified: "Modified",
};

export function DiffPanelChangeMarkers() {
  useEffect(() => void resolveDiffChangeMarkers, []);
  return <div aria-label={CHANGE_MARKER_LABEL_BY_KIND.added}>{UNRELATED}</div>;
}
`;

test("extracts only the two tables and the type they close over", () => {
  const result = generateDiffChangeMarkers({ sourceText: FIXTURE });
  assert.deepEqual(
    result.declarations.map((declaration) => declaration.names),
    [["CHANGE_MARKER_COLOR_BY_KIND"], ["CHANGE_MARKER_LABEL_BY_KIND"]],
  );
  assert.deepEqual(result.imports, [
    'import { type DiffChangeMarkerKind } from "~/components/DiffPanel.logic";',
  ]);
  assert.match(result.text, /modified: "Modified"/);
  assert.match(
    result.text,
    /export \{ CHANGE_MARKER_COLOR_BY_KIND, CHANGE_MARKER_LABEL_BY_KIND \};/,
  );
  assert.doesNotMatch(result.text, /UNRELATED|useEffect|DiffPanelChangeMarkers\(/);
  assert.match(result.text, /generate-diff-change-markers\.mjs/);
});

test("the committed artifact is the extraction of the upstream file", () => {
  const result = generateDiffChangeMarkers({ sourceText: upstreamSource });
  const outputFile = path.join(repoRoot, DIFF_CHANGE_MARKERS_OUTPUT);
  assert.equal(fs.readFileSync(outputFile, "utf8"), formatGeneratedText(outputFile, result.text));
});

test("--check fails when the upstream tables drift from the generated file", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "diff-change-markers-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const sourceFile = path.join(directory, "DiffPanelChangeMarkers.tsx");
  const outputFile = path.join(directory, "diffChangeMarkers.generated.ts");
  const silent = { log: () => {}, logError: () => {} };
  fs.writeFileSync(sourceFile, FIXTURE);
  assert.equal(runDiffChangeMarkersGenerator({ sourceFile, outputFile, ...silent }), 0);
  assert.equal(
    runDiffChangeMarkersGenerator({ check: true, sourceFile, outputFile, ...silent }),
    0,
  );
  fs.writeFileSync(sourceFile, FIXTURE.replace('modified: "Modified"', 'modified: "Changed"'));
  assert.equal(
    runDiffChangeMarkersGenerator({ check: true, sourceFile, outputFile, ...silent }),
    1,
  );
});

test("stops when a table is missing or is no longer a top-level const", () => {
  assert.throws(
    () =>
      generateDiffChangeMarkers({
        sourceText: FIXTURE.replace("CHANGE_MARKER_LABEL_BY_KIND:", "MARKER_LABELS:"),
      }),
    (error) =>
      error instanceof EventRouterGenerationError &&
      /const CHANGE_MARKER_LABEL_BY_KIND was not found/.test(error.message),
  );
  assert.throws(
    () =>
      generateDiffChangeMarkers({
        sourceText: FIXTURE.replace(
          "const CHANGE_MARKER_COLOR_BY_KIND",
          "let CHANGE_MARKER_COLOR_BY_KIND",
        ),
      }),
    (error) =>
      error instanceof EventRouterGenerationError &&
      /const CHANGE_MARKER_COLOR_BY_KIND was not found/.test(error.message),
  );
});

test("stops when a table starts to read a browser global", () => {
  assert.throws(
    () =>
      generateDiffChangeMarkers({
        sourceText: FIXTURE.replace('added: "Added"', "added: document.title"),
      }),
    (error) =>
      error instanceof EventRouterGenerationError &&
      /browser globals with no value on Lynx: document\.title/.test(error.message),
  );
});

test("a write failure leaves no generated file behind when the shape is wrong", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "diff-change-markers-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const sourceFile = path.join(directory, "DiffPanelChangeMarkers.tsx");
  const outputFile = path.join(directory, "diffChangeMarkers.generated.ts");
  fs.writeFileSync(sourceFile, "export const nothing = 1;\n");
  const errors = [];
  assert.equal(
    runDiffChangeMarkersGenerator({
      sourceFile,
      outputFile,
      log: () => {},
      logError: (message) => errors.push(message),
    }),
    1,
  );
  assert.equal(fs.existsSync(outputFile), false);
  assert.match(errors.join("\n"), /generate-diff-change-markers/);
});
