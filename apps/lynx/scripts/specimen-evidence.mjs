#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const DEFAULT_MANIFEST = path.join(
  REPO_ROOT,
  "shots/2026-08-04/p10-perceptual-fidelity/specimens/manifest.json",
);
const STATUSES = new Set(["retained", "pending", "intentional-delta", "not-applicable"]);
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

function parseArguments(argv) {
  let manifestPath = DEFAULT_MANIFEST;
  let allowIncomplete = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--allow-incomplete") {
      allowIncomplete = true;
      continue;
    }
    if (argument === "--manifest") {
      manifestPath = path.resolve(argv[++index] ?? "");
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return { allowIncomplete, manifestPath };
}

function validateEvidenceFiles(errors, prefix, manifestPath, evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    errors.push(`${prefix}: retained evidence must be a non-empty array`);
    return;
  }
  for (const artifact of evidence) {
    if (!artifact.path || !artifact.kind) {
      errors.push(`${prefix}: every evidence item requires path and kind`);
      continue;
    }
    const absolutePath = path.resolve(path.dirname(manifestPath), artifact.path);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`${prefix}: missing evidence ${artifact.path}`);
    }
  }
}

function validateDisposition(errors, incomplete, prefix, item, manifestPath) {
  if (!STATUSES.has(item.status)) {
    errors.push(`${prefix}: invalid status ${String(item.status)}`);
    return;
  }
  if (item.status === "pending") {
    incomplete.push(`${prefix}: pending`);
    return;
  }
  if (item.status === "intentional-delta") {
    if (!item.reason || !item.owner) {
      errors.push(`${prefix}: intentional-delta requires reason and owner`);
    }
    validateEvidenceFiles(errors, prefix, manifestPath, item.evidence);
    return;
  }
  if (item.status === "not-applicable") {
    if (!item.reason) errors.push(`${prefix}: not-applicable requires reason`);
    return;
  }
  if (!item.buildSha256 || !item.disposition) {
    errors.push(`${prefix}: retained state requires buildSha256 and disposition`);
  }
  validateEvidenceFiles(errors, prefix, manifestPath, item.evidence);
}

function validateRequiredIds(errors, actual, required, label) {
  const ids = actual.map((item) => item.id);
  for (const id of required) {
    if (!ids.includes(id)) errors.push(`${label}: missing required ${id}`);
  }
  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) {
      errors.push(`${label}: duplicate ${id}`);
    }
  }
}

export function validateSpecimenManifest(manifest, manifestPath) {
  const errors = [];
  const incomplete = [];
  if (manifest.version !== 1) errors.push("manifest.version must be 1");
  if (!Array.isArray(manifest.controls)) errors.push("manifest.controls must be an array");
  if (!Array.isArray(manifest.temporal)) errors.push("manifest.temporal must be an array");
  if (errors.length > 0) return { errors, incomplete };

  validateRequiredIds(errors, manifest.controls, CONTROL_IDS, "controls");
  validateRequiredIds(errors, manifest.temporal, TEMPORAL_IDS, "temporal");

  for (const control of manifest.controls) {
    const prefix = `controls.${control.id}`;
    if (!Array.isArray(control.requiredStates) || control.requiredStates.length === 0) {
      errors.push(`${prefix}: requiredStates must be non-empty`);
      continue;
    }
    if (!control.states || typeof control.states !== "object") {
      errors.push(`${prefix}: states are required`);
      continue;
    }
    for (const state of control.requiredStates) {
      const item = control.states[state];
      if (!item) {
        incomplete.push(`${prefix}.${state}: missing`);
        continue;
      }
      validateDisposition(errors, incomplete, `${prefix}.${state}`, item, manifestPath);
    }
  }

  for (const surface of manifest.temporal) {
    const prefix = `temporal.${surface.id}`;
    if (!Array.isArray(surface.requiredSamples) || surface.requiredSamples.length === 0) {
      errors.push(`${prefix}: requiredSamples must be non-empty`);
      continue;
    }
    if (!surface.samples || typeof surface.samples !== "object") {
      errors.push(`${prefix}: samples are required`);
      continue;
    }
    for (const sample of surface.requiredSamples) {
      const item = surface.samples[sample];
      if (!item) {
        incomplete.push(`${prefix}.${sample}: missing`);
        continue;
      }
      validateDisposition(errors, incomplete, `${prefix}.${sample}`, item, manifestPath);
    }
  }
  return { errors, incomplete };
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const manifest = JSON.parse(fs.readFileSync(options.manifestPath, "utf8"));
  const result = validateSpecimenManifest(manifest, options.manifestPath);
  for (const error of result.errors) console.error(`error: ${error}`);
  for (const item of result.incomplete) console.warn(`incomplete: ${item}`);
  if (result.errors.length > 0) process.exit(1);
  if (!options.allowIncomplete && result.incomplete.length > 0) process.exit(2);
  console.log(
    `validated ${manifest.controls.length} controls and ${manifest.temporal.length} temporal surfaces (${result.incomplete.length} incomplete specimens)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
