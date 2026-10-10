import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { formatGeneratedText } from "./format-generated.mjs";
import {
  AUTOMATIONS_STATE_OUTPUT,
  AUTOMATIONS_STATE_SOURCE,
  generateAutomationsState,
  runAutomationsStateGenerator,
} from "./generate-automations-state.mjs";
import { EventRouterGenerationError } from "./generate-event-router.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const upstreamSource = fs.readFileSync(path.join(repoRoot, AUTOMATIONS_STATE_SOURCE), "utf8");

const FIXTURE = `
import type { AutomationListResult, AutomationStreamEvent } from "@synara/contracts";
import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { ensureNativeApi } from "~/nativeApi";

export const automationQueryKey = ["automations"] as const;
const UNRELATED = 3;

export function applyAutomationEvent(
  prev: AutomationListResult | undefined,
  event: AutomationStreamEvent,
): AutomationListResult | undefined {
  return event ? prev : undefined;
}

export function useAutomations() {
  return useQuery({
    queryKey: automationQueryKey,
    queryFn: () => ensureNativeApi().automation.list({}),
  });
}

export function AutomationDialog() {
  return <Button>{UNRELATED}</Button>;
}
`;

test("extracts the state layer and leaves the DOM surface behind", () => {
  const result = generateAutomationsState({ sourceText: FIXTURE });
  assert.deepEqual(
    result.declarations.map((declaration) => declaration.names),
    [["automationQueryKey"], ["applyAutomationEvent"], ["useAutomations"]],
  );
  assert.match(result.text, /queryFn: \(\) => ensureNativeApi\(\)\.automation\.list\(\{\}\)/);
  assert.doesNotMatch(result.text, /UNRELATED|AutomationDialog|components\/ui\/button/);
  assert.match(result.text, /generate-automations-state\.mjs/);
});

test("the committed artifact is the extraction of the upstream file", () => {
  const result = generateAutomationsState({ sourceText: upstreamSource });
  const outputFile = path.join(repoRoot, AUTOMATIONS_STATE_OUTPUT);
  assert.equal(fs.readFileSync(outputFile, "utf8"), formatGeneratedText(outputFile, result.text));
  // The DOM dialog and pickers of the route module stay out of the Lynx graph.
  assert.doesNotMatch(result.text, /components\/ui\/(dialog|menu|button)|ProviderModelPicker/);
});

test("--check fails when upstream's state layer drifts from the generated file", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "automations-state-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const sourceFile = path.join(directory, "-automations.shared.tsx");
  const outputFile = path.join(directory, "automationsState.generated.ts");
  const silent = { log: () => {}, logError: () => {} };
  fs.writeFileSync(sourceFile, FIXTURE);
  assert.equal(runAutomationsStateGenerator({ sourceFile, outputFile, ...silent }), 0);
  assert.equal(runAutomationsStateGenerator({ check: true, sourceFile, outputFile, ...silent }), 0);
  fs.writeFileSync(sourceFile, FIXTURE.replace('["automations"]', '["automation-list"]'));
  assert.equal(runAutomationsStateGenerator({ check: true, sourceFile, outputFile, ...silent }), 1);
});

test("stops when a root is missing or starts to read a browser global", () => {
  assert.throws(
    () =>
      generateAutomationsState({
        sourceText: FIXTURE.replace("function useAutomations", "function useAutomationList"),
      }),
    (error) =>
      error instanceof EventRouterGenerationError &&
      /function useAutomations was not found/.test(error.message),
  );
  assert.throws(
    () =>
      generateAutomationsState({
        sourceText: FIXTURE.replace("return event ? prev", "return document.title ? prev"),
      }),
    (error) =>
      error instanceof EventRouterGenerationError &&
      /browser globals with no value on Lynx: document\.title/.test(error.message),
  );
});
