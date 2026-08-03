#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLIENTS = ["web", "lynx", "native"];
const EVIDENCE_STATUSES = new Set(["retained", "diagnostic", "pending", "not-applicable"]);
const RESIDUAL_CATEGORIES = new Set([
  "TYPOGRAPHY",
  "GEOMETRY",
  "MATERIAL",
  "ICON",
  "MOTION",
  "INTERACTION",
  "CONTENT",
  "ENGINE_CORRECTION",
  "INTENTIONAL_PLATFORM_DELTA",
  "ANTIALIASING_NOISE",
]);
const RESIDUAL_SEVERITIES = new Set(["P0", "P1", "P2", "P3"]);
const RESIDUAL_STATUSES = new Set(["open", "fixed", "intentional-delta", "accepted-noise"]);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const DEFAULT_ROOT = path.join(REPO_ROOT, "shots/2026-08-04/p10-perceptual-fidelity");
const DEFAULT_MANIFEST_PATH = path.join(DEFAULT_ROOT, "manifest.json");
const DEFAULT_OUTPUT_PATH = path.join(DEFAULT_ROOT, "manifest.js");

function parseArguments(argv) {
  const options = {
    allowIncomplete: false,
    manifestPath: DEFAULT_MANIFEST_PATH,
    outputPath: DEFAULT_OUTPUT_PATH,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--allow-incomplete") {
      options.allowIncomplete = true;
      continue;
    }
    if (argument === "--write") {
      options.write = true;
      continue;
    }
    if (argument === "--manifest") {
      options.manifestPath = path.resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (argument === "--output") {
      options.outputPath = path.resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${filePath} is not a valid PNG file`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function resolveArtifact(manifestPath, artifactPath) {
  return path.resolve(path.dirname(manifestPath), artifactPath);
}

function relativeToGallery(manifestPath, artifactPath) {
  return path
    .relative(path.dirname(manifestPath), resolveArtifact(manifestPath, artifactPath))
    .split(path.sep)
    .join("/");
}

function validateLinkedFile(errors, prefix, manifestPath, artifactPath, label) {
  if (!artifactPath) {
    errors.push(`${prefix}: ${label} is required`);
    return null;
  }
  const absolutePath = resolveArtifact(manifestPath, artifactPath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`${prefix}: missing ${label} ${artifactPath}`);
    return null;
  }
  return absolutePath;
}

function validateEvidence(errors, incomplete, manifest, manifestPath, state, client) {
  const prefix = `${state.id}.${client}`;
  const evidence = state.evidence?.[client];
  const required = state.requiredClients.includes(client);
  if (!evidence) {
    errors.push(`${prefix}: evidence entry is required`);
    return;
  }
  if (!EVIDENCE_STATUSES.has(evidence.status)) {
    errors.push(`${prefix}: invalid status ${String(evidence.status)}`);
    return;
  }
  if (required && evidence.status !== "retained") {
    incomplete.push(`${prefix}: required evidence is ${evidence.status}`);
  }
  if (
    ["diagnostic", "pending", "not-applicable"].includes(evidence.status) &&
    !evidence.reason
  ) {
    errors.push(`${prefix}: ${evidence.status} requires a reason`);
  }
  if (required && evidence.status === "not-applicable") {
    errors.push(`${prefix}: required evidence cannot be not-applicable`);
  }
  if (evidence.status !== "retained") return;

  for (const key of [
    "path",
    "captureTier",
    "buildSha256",
    "snapshotSha256",
    "geometry",
    "styles",
    "console",
    "stateEcho",
  ]) {
    if (!evidence[key]) errors.push(`${prefix}: retained evidence requires ${key}`);
  }
  if (evidence.snapshotSha256 !== manifest.defaults.snapshotSha256) {
    errors.push(`${prefix}: snapshot hash does not match manifest defaults`);
  }

  const imagePath = validateLinkedFile(errors, prefix, manifestPath, evidence.path, "image");
  if (imagePath) {
    try {
      const actual = pngDimensions(imagePath);
      const expected = evidence.image;
      if (!expected || actual.width !== expected.width || actual.height !== expected.height) {
        errors.push(
          `${prefix}: PNG is ${actual.width}x${actual.height}, expected ${expected?.width}x${expected?.height}`,
        );
      }
    } catch (error) {
      errors.push(`${prefix}: ${error.message}`);
    }
  }

  const comparisonPath = validateLinkedFile(
    errors,
    prefix,
    manifestPath,
    evidence.comparisonPath,
    "comparison image",
  );
  if (comparisonPath) {
    try {
      const actual = pngDimensions(comparisonPath);
      const expected = state.comparisonViewport ?? manifest.defaults.comparisonViewport;
      if (actual.width !== expected.width || actual.height !== expected.height) {
        errors.push(
          `${prefix}: comparison PNG is ${actual.width}x${actual.height}, expected ${expected.width}x${expected.height}`,
        );
      }
    } catch (error) {
      errors.push(`${prefix}: ${error.message}`);
    }
  }

  for (const linkedKey of ["geometry", "styles", "console"]) {
    const linkedPath = validateLinkedFile(
      errors,
      prefix,
      manifestPath,
      evidence[linkedKey],
      linkedKey,
    );
    if (linkedPath && linkedKey !== "console") {
      try {
        const artifact = readJson(linkedPath);
        if (artifact.client !== client) {
          errors.push(`${prefix}: ${linkedKey}.client does not match`);
        }
        if (artifact.stateId !== state.id) {
          errors.push(`${prefix}: ${linkedKey}.stateId does not match`);
        }
      } catch (error) {
        errors.push(`${prefix}: invalid ${linkedKey}: ${error.message}`);
      }
    }
  }

  const expectedState = {
    semanticRoute: state.semanticRoute,
    theme: state.theme,
    density: state.density,
    interactionState: state.interactionState,
  };
  for (const [key, expected] of Object.entries(expectedState)) {
    if (JSON.stringify(evidence.stateEcho?.[key]) !== JSON.stringify(expected)) {
      errors.push(
        `${prefix}: stateEcho.${key}=${JSON.stringify(evidence.stateEcho?.[key])} does not match ${JSON.stringify(expected)}`,
      );
    }
  }
}

function validateResidual(errors, blocking, state, residual, residualIds) {
  const prefix = `${state.id}.${residual.id ?? "<missing-residual-id>"}`;
  if (!residual.id || typeof residual.id !== "string") {
    errors.push(`${state.id}: every residual requires a string id`);
    return;
  }
  if (residualIds.has(residual.id)) errors.push(`${prefix}: duplicate residual id`);
  residualIds.add(residual.id);
  if (!RESIDUAL_CATEGORIES.has(residual.category)) {
    errors.push(`${prefix}: invalid category ${String(residual.category)}`);
  }
  if (!RESIDUAL_SEVERITIES.has(residual.severity)) {
    errors.push(`${prefix}: invalid severity ${String(residual.severity)}`);
  }
  if (!RESIDUAL_STATUSES.has(residual.status)) {
    errors.push(`${prefix}: invalid status ${String(residual.status)}`);
  }
  for (const key of ["owner", "summary", "impact", "recommendation"]) {
    if (!residual[key]) errors.push(`${prefix}: ${key} is required`);
  }
  if (
    ["intentional-delta", "accepted-noise"].includes(residual.status) &&
    (!residual.reason || !residual.evidence)
  ) {
    errors.push(`${prefix}: ${residual.status} requires reason and evidence`);
  }
  if (["P0", "P1"].includes(residual.severity) && residual.status === "open") {
    blocking.push(`${prefix}: open ${residual.severity} residual`);
  }
}

export function validateManifest(manifest, manifestPath) {
  const errors = [];
  const incomplete = [];
  const blocking = [];
  const stateIds = new Set();
  const residualIds = new Set();

  if (manifest.version !== 1) errors.push("manifest.version must be 1");
  if (!manifest.defaults?.snapshotSha256) {
    errors.push("manifest.defaults.snapshotSha256 is required");
  }
  if (!manifest.defaults?.comparisonViewport) {
    errors.push("manifest.defaults.comparisonViewport is required");
  }
  if (!Array.isArray(manifest.states) || manifest.states.length === 0) {
    errors.push("manifest.states must be a non-empty array");
    return { blocking, errors, incomplete };
  }

  for (const state of manifest.states) {
    if (!state.id || typeof state.id !== "string") {
      errors.push("Every state requires a string id");
      continue;
    }
    if (stateIds.has(state.id)) errors.push(`${state.id}: duplicate state id`);
    stateIds.add(state.id);
    for (const key of [
      "label",
      "semanticRoute",
      "theme",
      "density",
      "interactionState",
      "viewport",
    ]) {
      if (state[key] === undefined || state[key] === "") {
        errors.push(`${state.id}: ${key} is required`);
      }
    }
    if (!Array.isArray(state.requiredClients) || state.requiredClients.length === 0) {
      errors.push(`${state.id}: requiredClients must be a non-empty array`);
      continue;
    }
    for (const client of state.requiredClients) {
      if (!CLIENTS.includes(client)) errors.push(`${state.id}: unknown client ${client}`);
    }
    for (const client of CLIENTS) {
      validateEvidence(errors, incomplete, manifest, manifestPath, state, client);
    }
    if (!Array.isArray(state.residuals)) {
      errors.push(`${state.id}: residuals must be an array`);
      continue;
    }
    for (const residual of state.residuals) {
      validateResidual(errors, blocking, state, residual, residualIds);
    }
  }
  return { blocking, errors, incomplete };
}

function toGalleryData(manifest, manifestPath) {
  const embeddedJson = (artifactPath) => {
    if (!artifactPath) return null;
    const absolutePath = resolveArtifact(manifestPath, artifactPath);
    if (!fs.existsSync(absolutePath)) return null;
    return readJson(absolutePath);
  };
  return {
    id: manifest.id,
    label: manifest.label,
    defaults: manifest.defaults,
    states: manifest.states.map((state) => ({
      id: state.id,
      label: state.label,
      semanticRoute: state.semanticRoute,
      theme: state.theme,
      density: state.density,
      interactionState: state.interactionState,
      viewport: state.viewport,
      comparisonViewport: state.comparisonViewport ?? manifest.defaults.comparisonViewport,
      residuals: state.residuals,
      evidence: Object.fromEntries(
        CLIENTS.map((client) => {
          const evidence = state.evidence[client];
          return [
            client,
            {
              status: evidence.status,
              reason: evidence.reason ?? null,
              path: evidence.path ? relativeToGallery(manifestPath, evidence.path) : null,
              comparisonPath: evidence.comparisonPath
                ? relativeToGallery(manifestPath, evidence.comparisonPath)
                : null,
              geometry: evidence.geometry
                ? relativeToGallery(manifestPath, evidence.geometry)
                : null,
              geometryData: embeddedJson(evidence.geometry),
              styles: evidence.styles ? relativeToGallery(manifestPath, evidence.styles) : null,
              stylesData: embeddedJson(evidence.styles),
              console: evidence.console ? relativeToGallery(manifestPath, evidence.console) : null,
              alignment: evidence.alignment ?? { x: 0, y: 0, scale: 1 },
            },
          ];
        }),
      ),
    })),
  };
}

function writeGalleryData(outputPath, data) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `globalThis.__SYNARA_PERCEPTUAL_EVIDENCE__ = ${JSON.stringify(data, null, 2)};\n`,
    "utf8",
  );
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const manifest = readJson(options.manifestPath);
  const result = validateManifest(manifest, options.manifestPath);
  for (const error of result.errors) console.error(`error: ${error}`);
  for (const item of result.incomplete) console.warn(`incomplete: ${item}`);
  for (const item of result.blocking) console.warn(`blocking: ${item}`);
  if (result.errors.length > 0) process.exit(1);
  if (
    !options.allowIncomplete &&
    (result.incomplete.length > 0 || result.blocking.length > 0)
  ) {
    process.exit(2);
  }
  if (options.write) {
    writeGalleryData(options.outputPath, toGalleryData(manifest, options.manifestPath));
    console.log(
      `wrote ${path.relative(REPO_ROOT, options.outputPath)} with ${manifest.states.length} perceptual states`,
    );
  }
  console.log(
    `validated ${manifest.states.length} states (${result.incomplete.length} incomplete cells, ${result.blocking.length} blocking residuals)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
