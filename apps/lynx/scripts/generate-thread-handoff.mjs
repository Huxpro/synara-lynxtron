#!/usr/bin/env node

// Generates `src/generated/threadHandoff.generated.ts` from upstream's
// `apps/web/src/hooks/useThreadHandoff.ts`.
//
// Upstream keeps both ways of handing a thread to another provider inside that
// hook: `continueThreadHandoff` (same thread: `thread.meta.update` with
// `providerHandoff`, then wait for the server's outcome row) and
// `createThreadHandoff` (new thread: `thread.handoff.create` with the imported
// transcript), on top of one shared precondition check. The hook is DOM-free,
// but it cannot be imported on Lynx as it stands: `useProviderStatusesForLocalConfig`
// reaches upstream's `useAppSettings`, which Lynx does not run, and both it and
// `useProviderStatusRefresh` are imported by relative paths no alias sees. So the hook is
// extracted verbatim, with the extractor and guards of `generate-event-router.mjs`,
// and its imports resolve as every `~/…` specifier does on Lynx:
//   - `~/hooks/useProviderStatusesForLocalConfig` and `~/hooks/useProviderStatusRefresh`
//     are replaced by the adapters of the same name in `src/adapters` (lynx.config.ts);
//     the second one imports the DOM toast by a relative path upstream;
//   - `~/composerDraftStore` is the Lynx draft facade;
//   - `@tanstack/react-router` is the memory-history adapter;
//   - `window.setTimeout` / `window.clearTimeout` come from `platform/windowTimers`.
//
//   node scripts/generate-thread-handoff.mjs          # rewrite the generated file
//   node scripts/generate-thread-handoff.mjs --check  # exit 1 when it drifted
//
// The script fails (and writes nothing) when the hook is missing or is no longer
// a top-level function, when it closes over something the extractor cannot
// re-emit, when it starts to use a browser global other than the window timers,
// or when it stops importing a module the Lynx side replaces (the replacement
// would then be dead and the hook would be reading something else).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";
import {
  EVENT_ROUTER_GLOBAL_PORTS,
  EventRouterGenerationError,
  extractEventRouter,
} from "./generate-event-router.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const SCRIPT_NAME = "generate-thread-handoff.mjs";

export const THREAD_HANDOFF_SOURCE = "apps/web/src/hooks/useThreadHandoff.ts";
export const THREAD_HANDOFF_OUTPUT = "apps/lynx/src/generated/threadHandoff.generated.ts";
export const THREAD_HANDOFF_ROOTS = Object.freeze(["useThreadHandoff"]);

/**
 * Specifiers the extracted hook must keep importing, because the Lynx build
 * answers each with its own module (lynx.config.ts `resolve.alias`).
 */
export const THREAD_HANDOFF_REPLACED_IMPORTS = Object.freeze([
  "~/hooks/useProviderStatusesForLocalConfig",
  "~/hooks/useProviderStatusRefresh",
  "~/composerDraftStore",
  "@tanstack/react-router",
]);

/** Pure extraction of the hook from an upstream source text. */
export function generateThreadHandoff({ sourceText, sourcePath = THREAD_HANDOFF_SOURCE }) {
  const result = extractEventRouter({
    sourceText,
    sourcePath,
    roots: THREAD_HANDOFF_ROOTS,
    rootKind: "function",
    // The outcome wait uses `window` timers; nothing else may reach a browser global.
    globalPorts: { window: EVENT_ROUTER_GLOBAL_PORTS.window },
    generatorScript: SCRIPT_NAME,
  });
  for (const specifier of THREAD_HANDOFF_REPLACED_IMPORTS) {
    if (!result.imports.some((line) => line.endsWith(` from ${JSON.stringify(specifier)};`))) {
      throw new EventRouterGenerationError(
        `useThreadHandoff no longer imports "${specifier}", which Lynx replaces; ` +
          `review the hook's new dependencies before regenerating`,
      );
    }
  }
  return result;
}

/** Runs the generator against files on disk. Returns a process exit code. */
export function runThreadHandoffGenerator({
  check = false,
  sourceFile = path.join(repoRoot, THREAD_HANDOFF_SOURCE),
  outputFile = path.join(repoRoot, THREAD_HANDOFF_OUTPUT),
  log = console.log,
  logError = console.error,
} = {}) {
  let result;
  try {
    result = generateThreadHandoff({ sourceText: fs.readFileSync(sourceFile, "utf8") });
  } catch (error) {
    if (!(error instanceof EventRouterGenerationError)) throw error;
    logError(`generate-thread-handoff: ${error.message}`);
    return 1;
  }
  const relativeOutput = path.relative(repoRoot, outputFile).split(path.sep).join("/");
  if (check) {
    if (!generatedFileIsFresh(outputFile, result.text)) {
      logError(
        `generate-thread-handoff: ${relativeOutput} is stale; run \`node scripts/${SCRIPT_NAME}\` in apps/lynx`,
      );
      return 1;
    }
    log(
      `generate-thread-handoff: ${relativeOutput} is up to date (${result.declarations.length} declarations)`,
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
  process.exit(runThreadHandoffGenerator({ check: process.argv.includes("--check") }));
}
