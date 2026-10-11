import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adaptHandoffCatalogLabel } from "./chat-handoff-workflow.mjs";
const source = readFileSync(
  new URL("../../../scripts/comparison-workflows.mjs", import.meta.url),
  "utf8",
);
test("adapts only the Sonnet display name while preserving every J7 step", () => {
  const patched = adaptHandoffCatalogLabel(source, [
    { name: "Sonnet", slug: "sonnet", resolvedModel: "claude-sonnet-5-5" },
  ]);
  assert.ok(
    patched.includes(
      'const HANDOFF_TARGET = { provider: "claudeAgent", label: "Claude", modelText: "Claude Sonnet 5.5" };',
    ),
  );
  assert.ok(patched.includes('driver.kind === "electron" && provider.provider === "claudeAgent"'));
  assert.ok(patched.includes('modelText: "Claude Sonnet"'));
  const before = source.slice(source.indexOf("export async function workflowJ7"));
  assert.equal(patched.slice(patched.indexOf("export async function workflowJ7")), before);
});
test("refuses a different resolved model or ambiguous catalog", () => {
  assert.throws(() =>
    adaptHandoffCatalogLabel(source, [{ name: "Sonnet", resolvedModel: "claude-sonnet-other" }]),
  );
  const item = { name: "Sonnet", resolvedModel: "claude-sonnet-5-5" };
  assert.throws(() => adaptHandoffCatalogLabel(source, [item, item]));
});
test("refuses an upstream seam change", () => {
  assert.throws(() =>
    adaptHandoffCatalogLabel(source.replace("const HANDOFF_TARGET", "const NEW_TARGET"), [
      { name: "Sonnet", resolvedModel: "claude-sonnet-5-5" },
    ]),
  );
});
