import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateSpecimenManifest } from "./specimen-evidence.mjs";

const CONTROL_IDS = [
  "sidebar-row",
  "segmented-control",
  "icon-button",
  "disclosure-chevron",
  "composer-shell",
  "textarea",
  "project-picker-row",
  "command-menu-row",
  "switch",
  "checkbox-radio",
  "tooltip-popover",
  "chip-token",
  "status-row",
  "empty-state-header",
  "primary-secondary-button",
];
const TEMPORAL_IDS = [
  "disclosure-open-close",
  "popover-menu-open-close",
  "submenu-disclosure",
  "hover",
  "pressed",
  "selected-transition",
  "composer-height-content",
  "loading-to-content",
  "sidebar-expansion",
  "collapsed-work",
  "focus-ring",
  "reduced-motion",
];

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "p10-specimens-"));
  fs.writeFileSync(path.join(directory, "proof.json"), "{}\n");
  const retained = {
    status: "retained",
    buildSha256: "a".repeat(64),
    disposition: "Geometry and visual center converge.",
    evidence: [{ kind: "geometry", path: "proof.json" }],
  };
  return {
    directory,
    manifestPath: path.join(directory, "manifest.json"),
    manifest: {
      version: 1,
      controls: CONTROL_IDS.map((id) => ({
        id,
        requiredStates: ["default"],
        states: { default: retained },
      })),
      temporal: TEMPORAL_IDS.map((id) => ({
        id,
        requiredSamples: ["end"],
        samples: { end: retained },
      })),
    },
  };
}

test("accepts a complete specimen inventory", () => {
  const value = fixture();
  assert.deepEqual(
    validateSpecimenManifest(value.manifest, value.manifestPath),
    { errors: [], incomplete: [] },
  );
});

test("keeps a missing required state incomplete", () => {
  const value = fixture();
  value.manifest.controls[0].requiredStates.push("hover");
  const result = validateSpecimenManifest(value.manifest, value.manifestPath);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.incomplete, ["controls.sidebar-row.hover: missing"]);
});

test("keeps pending temporal proof incomplete", () => {
  const value = fixture();
  value.manifest.temporal[0].samples.end = { status: "pending" };
  const result = validateSpecimenManifest(value.manifest, value.manifestPath);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.incomplete, ["temporal.disclosure-open-close.end: pending"]);
});

test("rejects missing evidence files", () => {
  const value = fixture();
  value.manifest.controls[0].states.default.evidence = [
    { kind: "geometry", path: "missing.json" },
  ];
  const result = validateSpecimenManifest(value.manifest, value.manifestPath);
  assert.match(result.errors.join("\n"), /missing evidence missing\.json/);
});

test("requires a reason and owner for intentional deltas", () => {
  const value = fixture();
  value.manifest.temporal[0].samples.end = {
    status: "intentional-delta",
    evidence: [{ kind: "report", path: "proof.json" }],
  };
  const result = validateSpecimenManifest(value.manifest, value.manifestPath);
  assert.match(result.errors.join("\n"), /requires reason and owner/);
});

test("rejects an incomplete required inventory", () => {
  const value = fixture();
  value.manifest.controls.pop();
  const result = validateSpecimenManifest(value.manifest, value.manifestPath);
  assert.match(
    result.errors.join("\n"),
    /missing required primary-secondary-button/,
  );
});
