#!/usr/bin/env node

// Generates `src/generated/automationsState.generated.ts` from upstream's
// `apps/web/src/routes/-automations.shared.tsx`.
//
// Upstream keeps the Automations state layer in that route module, next to the
// DOM dialog and pickers: the list query (`useAutomations`, key
// `automationQueryKey`), its mutations with the optimistic definition patch and
// rollback, and `applyAutomationEvent`, which folds the server's automation
// stream into the query cache. There are no query options to import and the
// module cannot be imported on Lynx (it pulls in the DOM UI), so the state
// layer is extracted verbatim, with the extractor and guards of
// `generate-event-router.mjs`. Lynx renders its own page on top of it.
//
//   node scripts/generate-automations-state.mjs          # rewrite the generated file
//   node scripts/generate-automations-state.mjs --check  # exit 1 when it drifted
//
// The script fails (and writes nothing) when a root is missing or is no longer
// a top-level function, when it closes over something the extractor cannot
// re-emit, or when it starts to use a browser global.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";
import { EventRouterGenerationError, extractEventRouter } from "./generate-event-router.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const SCRIPT_NAME = "generate-automations-state.mjs";

export const AUTOMATIONS_STATE_SOURCE = "apps/web/src/routes/-automations.shared.tsx";
export const AUTOMATIONS_STATE_OUTPUT = "apps/lynx/src/generated/automationsState.generated.ts";
export const AUTOMATIONS_STATE_ROOTS = Object.freeze(["useAutomations", "applyAutomationEvent"]);

/** Pure extraction of the state layer from an upstream source text. */
export function generateAutomationsState({ sourceText, sourcePath = AUTOMATIONS_STATE_SOURCE }) {
  return extractEventRouter({
    sourceText,
    sourcePath,
    roots: AUTOMATIONS_STATE_ROOTS,
    rootKind: "function",
    // Queries, mutations and pure reducers; none of it may reach a browser global.
    globalPorts: {},
    generatorScript: SCRIPT_NAME,
  });
}

/** Runs the generator against files on disk. Returns a process exit code. */
export function runAutomationsStateGenerator({
  check = false,
  sourceFile = path.join(repoRoot, AUTOMATIONS_STATE_SOURCE),
  outputFile = path.join(repoRoot, AUTOMATIONS_STATE_OUTPUT),
  log = console.log,
  logError = console.error,
} = {}) {
  let result;
  try {
    result = generateAutomationsState({ sourceText: fs.readFileSync(sourceFile, "utf8") });
  } catch (error) {
    if (!(error instanceof EventRouterGenerationError)) throw error;
    logError(`generate-automations-state: ${error.message}`);
    return 1;
  }
  const relativeOutput = path.relative(repoRoot, outputFile).split(path.sep).join("/");
  if (check) {
    if (!generatedFileIsFresh(outputFile, result.text)) {
      logError(
        `generate-automations-state: ${relativeOutput} is stale; run \`node scripts/${SCRIPT_NAME}\` in apps/lynx`,
      );
      return 1;
    }
    log(
      `generate-automations-state: ${relativeOutput} is up to date (${result.declarations.length} declarations)`,
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
  process.exit(runAutomationsStateGenerator({ check: process.argv.includes("--check") }));
}
