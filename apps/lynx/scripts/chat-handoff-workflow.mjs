// Adapt a catalog label only, keeping J7 on the same explicitly required model.
// Usage: node apps/lynx/scripts/chat-handoff-workflow.mjs J7 --renderer both --out report.json
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { openBackend, readCertifiedRun } from "../../../scripts/comparison-workflow.mjs";

const expectedModel = "claude-sonnet-5-5";
const target =
  'const HANDOFF_TARGET = { provider: "claudeAgent", label: "Claude", modelText: "Claude Sonnet 5.5" };';
export function adaptHandoffCatalogLabel(source, models) {
  if (source.split(target).length !== 2)
    throw Error("J7 target seam changed; inspect upstream first");
  const matches = models.filter(
    (model) =>
      (model.resolvedModel ?? model.slug) === expectedModel &&
      ["Sonnet", "Sonnet 5.5", "Claude Sonnet 5.5"].includes(model.name),
  );
  if (matches.length !== 1)
    throw Error("J7 requires one catalog entry resolving to " + expectedModel);
  const name = matches[0].name;
  const shown = name.startsWith("Claude ") ? name : "Claude " + name;
  const seams = [
    [
      "const shown = normalize(provider.modelText);",
      `const shown = normalize(provider.provider === "claudeAgent" ? ${JSON.stringify(shown)} : provider.modelText);`,
    ],
    [
      "async function pickComposerModel(driver, provider) {",
      `async function pickComposerModel(driver, provider) {
  if (driver.kind === "electron" && provider.provider === "claudeAgent") provider = { ...provider, modelText: ${JSON.stringify(shown)} };`,
    ],
  ];
  for (const [before, after] of seams) {
    if (source.split(before).length !== 2)
      throw Error("J7 label seam changed; inspect upstream first");
    source = source.replace(before, after);
  }
  return source;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (process.argv[2] !== "J7") throw Error("This adapter only runs J7");
  const backend = await openBackend(readCertifiedRun());
  let models;
  try {
    models = (await backend.request("provider.listModels", { provider: "claudeAgent" })).models;
  } finally {
    backend.close();
  }
  const workflowUrl = new URL("../../../scripts/comparison-workflows.mjs", import.meta.url).href;
  registerHooks({
    load(url, context, nextLoad) {
      const loaded = nextLoad(url, context);
      return url === workflowUrl
        ? { ...loaded, source: adaptHandoffCatalogLabel(String(loaded.source), models) }
        : loaded;
    },
  });
  console.log("[J7] catalog label adapted; required resolved model remains " + expectedModel);
  await import("../../../scripts/comparison-workflow-run.mjs");
}
