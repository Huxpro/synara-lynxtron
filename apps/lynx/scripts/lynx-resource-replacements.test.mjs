import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const lynxRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webSourceRoot = path.resolve(lynxRoot, "../web/src");

// lynx.config.ts logs on import.
const log = console.log;
console.log = () => {};
const { default: config, lynxResourceReplacements } = await import("../lynx.config.ts");
console.log = log;

test("upstream's draft store resolves to the Lynx facade however it is imported", () => {
  // Two stores over one persisted key would let the unhydrated one overwrite
  // saved drafts; the alias covers `~/…`, the resource replacement every
  // relative import.
  const facade = path.join(lynxRoot, "src/adapters/composerDraftStore.lynx.ts");
  const replacement = lynxResourceReplacements.find(
    (entry) => entry.webSource === "composerDraftStore.ts",
  );
  assert.ok(replacement, "no resource replacement for composerDraftStore.ts");
  assert.equal(path.join(lynxRoot, replacement.lynxSource), facade);
  assert.equal(path.resolve(config.resolve.alias["~/composerDraftStore$"]), facade);
  assert.ok(existsSync(facade));
  assert.ok(existsSync(path.join(webSourceRoot, replacement.webSource)));
});
