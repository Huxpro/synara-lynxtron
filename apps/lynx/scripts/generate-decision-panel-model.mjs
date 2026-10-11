#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractEventRouter } from "./generate-event-router.mjs";
import { generatedFileIsFresh, writeGeneratedFile } from "./format-generated.mjs";
export const SOURCE = "apps/web/src/components/chat/ComposerPendingApprovalPanel.tsx";
export function generateDecisionPanelModel(sourceText) {
  const shared = {
    sourceText,
    sourcePath: SOURCE,
    globalPorts: {},
    generatorScript: "generate-decision-panel-model.mjs",
  };
  const actions = extractEventRouter({
    ...shared,
    roots: ["APPROVAL_ACTIONS", "WITHOUT_SESSION_APPROVAL", "COMPUTER_SCOPES", "KIND_PROMPT"],
    rootKind: "const",
  });
  if (!actions.text.includes("components/chat/ComposerChoiceRow"))
    throw new Error("Approval tone import changed");
  actions.text = actions.text
    .replaceAll(
      '"@synara-web/components/chat/ComposerChoiceRow"',
      '"../components/composer/ComposerChoiceRow.lynx"',
    )
    .replaceAll(
      '"~/components/chat/ComposerChoiceRow"',
      '"../components/composer/ComposerChoiceRow.lynx"',
    );
  const parameters = extractEventRouter({ ...shared, roots: ["formatToolParameterValue"] });
  return { approvalActions: actions, approvalParameters: parameters };
}
export function runDecisionPanelGenerator(check = false) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const results = generateDecisionPanelModel(fs.readFileSync(path.join(root, SOURCE), "utf8"));
  for (const [name, result] of Object.entries(results)) {
    const output = path.join(root, `apps/lynx/src/generated/${name}.generated.ts`);
    if (check) {
      if (!generatedFileIsFresh(output, result.text)) throw new Error(`${name} is stale`);
    } else writeGeneratedFile(output, result.text);
  }
  console.log("generate-decision-panel-model: " + (check ? "up to date" : "wrote upstream model"));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  runDecisionPanelGenerator(process.argv.includes("--check"));
