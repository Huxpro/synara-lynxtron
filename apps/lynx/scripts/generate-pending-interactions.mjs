#!/usr/bin/env node
// Reuse upstream interaction ownership verbatim, with one guarded type-only port.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractEventRouter, EVENT_ROUTER_GLOBAL_PORTS } from "./generate-event-router.mjs";
import { applyPendingInteractionRefTypePort } from "./event-router-patches.mjs";
import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";
export const SOURCE = "apps/web/src/components/chat/useChatPendingInteractions.ts";
export function generatePendingInteractions(sourceText) {
  const patch = applyPendingInteractionRefTypePort({ sourceText, sourcePath: SOURCE });
  return extractEventRouter({
    sourceText: patch.text,
    sourcePath: SOURCE,
    roots: ["useChatPendingInteractions"],
    globalPorts: { window: EVENT_ROUTER_GLOBAL_PORTS.window },
    appliedPatches: patch.applied,
    generatorScript: "generate-pending-interactions.mjs",
  });
}
export function runPendingInteractionsGenerator(check = false) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."),
    output = path.join(root, "apps/lynx/src/generated/pendingInteractions.generated.ts");
  const result = generatePendingInteractions(fs.readFileSync(path.join(root, SOURCE), "utf8"));
  if (check) {
    if (!generatedFileIsFresh(output, result.text)) {
      console.error("generate-pending-interactions: generated source is stale");
      process.exitCode = 1;
    } else console.log("generate-pending-interactions: up to date");
  } else {
    writeGeneratedFile(output, result.text);
    console.log(
      "generate-pending-interactions: wrote " + result.declarations.length + " declarations",
    );
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  runPendingInteractionsGenerator(process.argv.includes("--check"));
