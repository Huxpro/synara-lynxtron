#!/usr/bin/env node

// Generates `src/generated/diffChangeMarkers.generated.ts` from upstream's
// `apps/web/src/components/DiffPanelChangeMarkers.tsx`.
//
// Upstream's change-marker strip is a DOM component (ResizeObserver,
// `getBoundingClientRect`, shadow-DOM anchors), so Lynx renders its own strip
// (`src/app/DiffDockChangeMarkers.lynx.tsx`). The marker positions come from
// upstream's exported `resolveDiffChangeMarkers`, imported directly. What the
// component keeps to itself are the two tables that name and color a marker;
// they are extracted here verbatim, with the extractor and guards of
// `generate-event-router.mjs`, so a label upstream renames reaches Lynx on the
// next generation instead of drifting.
//
//   node scripts/generate-diff-change-markers.mjs          # rewrite the generated file
//   node scripts/generate-diff-change-markers.mjs --check  # exit 1 when it drifted
//
// The script fails (and writes nothing) when a table is missing or is no longer
// a top-level `const`, when it closes over something the extractor cannot
// re-emit, or when it starts to use a browser global.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";
import { EventRouterGenerationError, extractEventRouter } from "./generate-event-router.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const SCRIPT_NAME = "generate-diff-change-markers.mjs";

export const DIFF_CHANGE_MARKERS_SOURCE = "apps/web/src/components/DiffPanelChangeMarkers.tsx";
export const DIFF_CHANGE_MARKERS_OUTPUT = "apps/lynx/src/generated/diffChangeMarkers.generated.ts";
export const DIFF_CHANGE_MARKERS_ROOTS = Object.freeze([
  "CHANGE_MARKER_COLOR_BY_KIND",
  "CHANGE_MARKER_LABEL_BY_KIND",
]);

/** Pure extraction of the two tables from an upstream source text. */
export function generateDiffChangeMarkers({ sourceText, sourcePath = DIFF_CHANGE_MARKERS_SOURCE }) {
  return extractEventRouter({
    sourceText,
    sourcePath,
    roots: DIFF_CHANGE_MARKERS_ROOTS,
    rootKind: "const",
    // The tables are data; nothing they close over may reach a browser global.
    globalPorts: {},
    generatorScript: SCRIPT_NAME,
  });
}

/** Runs the generator against files on disk. Returns a process exit code. */
export function runDiffChangeMarkersGenerator({
  check = false,
  sourceFile = path.join(repoRoot, DIFF_CHANGE_MARKERS_SOURCE),
  outputFile = path.join(repoRoot, DIFF_CHANGE_MARKERS_OUTPUT),
  log = console.log,
  logError = console.error,
} = {}) {
  let result;
  try {
    result = generateDiffChangeMarkers({ sourceText: fs.readFileSync(sourceFile, "utf8") });
  } catch (error) {
    if (!(error instanceof EventRouterGenerationError)) throw error;
    logError(`generate-diff-change-markers: ${error.message}`);
    return 1;
  }
  const relativeOutput = path.relative(repoRoot, outputFile).split(path.sep).join("/");
  if (check) {
    if (!generatedFileIsFresh(outputFile, result.text)) {
      logError(
        `generate-diff-change-markers: ${relativeOutput} is stale; run \`node scripts/${SCRIPT_NAME}\` in apps/lynx`,
      );
      return 1;
    }
    log(
      `generate-diff-change-markers: ${relativeOutput} is up to date (${result.declarations.length} declarations)`,
    );
    return 0;
  }
  writeGeneratedFile(outputFile, result.text);
  log(
    JSON.stringify(
      {
        output: relativeOutput,
        mode: "write",
        declarations: result.declarations.map(
          ({ names, line, endLine }) => `${names.join(",")}:${line}-${endLine}`,
        ),
        imports: result.imports.length,
      },
      null,
      2,
    ),
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runDiffChangeMarkersGenerator({ check: process.argv.includes("--check") }));
}
