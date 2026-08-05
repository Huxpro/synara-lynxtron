import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  pngDimensions,
  validateProvidersEvidence,
  validateProvidersEvidenceManifest,
} from "./providers-evidence.mjs";

const MANIFEST_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../shots/2026-08-06/providers-evidence-manifest.json",
);

test("reads retained Providers PNG dimensions", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const first = manifest.states[0];
  assert.deepEqual(
    pngDimensions(path.resolve(path.dirname(MANIFEST_PATH), first.image)),
    first.dimensions,
  );
});

test("the retained Providers manifest is complete", () => {
  const result = validateProvidersEvidence(MANIFEST_PATH);
  assert.deepEqual(result.errors, []);
  assert.equal(result.stateCount, 19);
});

test("rejects Native build and interaction paint drift", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const mutated = structuredClone(manifest);
  mutated.states.find((state) => state.id === "providers-native-light-open").expect[
    "roles.tool.box.height"
  ] = 999;
  mutated.states.find((state) => state.id === "settings-row-native-pressed").expectStyles[
    "roles.pressed.paint.opacity"
  ] = "0.5";
  mutated.states.find((state) => state.id === "providers-opencode-native-open").expectDom[2]
    .attributes.readonly = "true";
  mutated.builds.nativeOnline = "0".repeat(64);
  const result = validateProvidersEvidenceManifest(
    mutated,
    path.dirname(MANIFEST_PATH),
  );
  assert(result.errors.includes("providers-native-light-open: roles.tool.box.height mismatch"));
  assert(result.errors.includes("settings-row-native-pressed: Native build mismatch"));
  assert(
    result.errors.includes(
      "settings-row-native-pressed: styles.roles.pressed.paint.opacity mismatch",
    ),
  );
  assert(
    result.errors.includes("providers-opencode-native-open: Native DOM expectation missing"),
  );
});
