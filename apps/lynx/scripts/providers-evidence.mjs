#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const DEFAULT_MANIFEST = path.join(
  REPO_ROOT,
  "shots/2026-08-06/providers-evidence-manifest.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readPossiblyEncodedJson(filePath) {
  const parsed = readJson(filePath);
  return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
}

function valueAt(input, dottedPath) {
  return dottedPath.split(".").reduce((value, key) => value?.[key], input);
}

export function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (
    buffer.length < 24 ||
    buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
  ) {
    throw new Error(`${filePath} is not a valid PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function validateHash(errors, prefix, value) {
  if (!/^[0-9a-f]{64}$/.test(String(value))) {
    errors.push(`${prefix}: invalid SHA-256`);
  }
}

function validateImage(errors, root, state) {
  const filePath = path.resolve(root, state.image);
  if (!fs.existsSync(filePath)) {
    errors.push(`${state.id}: missing image`);
    return;
  }
  try {
    const dimensions = pngDimensions(filePath);
    if (
      dimensions.width !== state.dimensions.width ||
      dimensions.height !== state.dimensions.height
    ) {
      errors.push(
        `${state.id}: image ${dimensions.width}x${dimensions.height}, expected ${state.dimensions.width}x${state.dimensions.height}`,
      );
    }
    if (state.imageSha256 && sha256(filePath) !== state.imageSha256) {
      errors.push(`${state.id}: image hash mismatch`);
    }
  } catch (error) {
    errors.push(`${state.id}: ${error.message}`);
  }
}

function consoleHasRuntimeError(contents) {
  return /(?:^|\n)\[(?:error|pageerror)(?:[^\]]*)\]/i.test(contents);
}

function validateBrowserState(errors, manifest, root, state) {
  validateImage(errors, root, state);
  const geometryPath = path.resolve(root, state.geometry);
  const errorsPath = path.resolve(root, state.errors);
  const consolePath = path.resolve(root, state.console);
  if (!fs.existsSync(geometryPath)) {
    errors.push(`${state.id}: missing geometry`);
    return;
  }
  const geometry = readPossiblyEncodedJson(geometryPath);
  for (const [key, expected] of Object.entries(state.expect ?? {})) {
    if (JSON.stringify(valueAt(geometry, key)) !== JSON.stringify(expected)) {
      errors.push(`${state.id}: ${key} mismatch`);
    }
  }
  if (!fs.existsSync(errorsPath) || fs.statSync(errorsPath).size !== 0) {
    errors.push(`${state.id}: browser errors are not empty`);
  }
  if (!fs.existsSync(consolePath)) {
    errors.push(`${state.id}: missing console`);
  } else if (consoleHasRuntimeError(fs.readFileSync(consolePath, "utf8"))) {
    errors.push(`${state.id}: console contains runtime errors`);
  }
  if (state.client === "lynx" && manifest.builds.lynxWeb !== state.buildSha256) {
    errors.push(`${state.id}: Lynx-for-Web build mismatch`);
  }
}

function validateNativeState(errors, manifest, root, state) {
  const directory = path.resolve(root, state.directory);
  const capturePath = path.join(directory, "capture.json");
  const geometryPath = path.join(directory, "geometry.json");
  const stylesPath = path.join(directory, "styles.json");
  const consolePath = path.join(directory, "console.txt");
  if (!fs.existsSync(capturePath) || !fs.existsSync(geometryPath)) {
    errors.push(`${state.id}: missing Native capture or geometry`);
    return;
  }
  validateImage(errors, root, {
    ...state,
    image: path.join(state.directory, "raw.png"),
  });
  const capture = readJson(capturePath);
  const geometry = readJson(geometryPath);
  if (capture.stateId !== (state.captureStateId ?? state.id)) {
    errors.push(`${state.id}: stateId mismatch`);
  }
  if (capture.buildSha256 !== manifest.builds.nativeOnline) {
    errors.push(`${state.id}: Native build mismatch`);
  }
  if (capture.snapshotSha256 !== manifest.snapshotSha256) {
    errors.push(`${state.id}: snapshot mismatch`);
  }
  if (capture.identity?.session?.url !== manifest.nativeBundlePath) {
    errors.push(`${state.id}: Native bundle identity mismatch`);
  }
  const clientId = capture.identity?.client?.id;
  const ownedPorts = capture.identity?.ownedPorts ?? [];
  if (!ownedPorts.some((port) => clientId === `localhost:${port}`)) {
    errors.push(`${state.id}: client is not PID-port owned`);
  }
  if (capture.consoleMessages?.length !== 0) {
    errors.push(`${state.id}: capture console is not empty`);
  }
  if (!fs.existsSync(consolePath) || fs.statSync(consolePath).size !== 0) {
    errors.push(`${state.id}: Native console file is not empty`);
  }
  for (const [key, expected] of Object.entries(state.expect ?? {})) {
    if (JSON.stringify(valueAt(geometry, key)) !== JSON.stringify(expected)) {
      errors.push(`${state.id}: ${key} mismatch`);
    }
  }
  if (state.expectStyles) {
    if (!fs.existsSync(stylesPath)) {
      errors.push(`${state.id}: missing Native styles`);
    } else {
      const styles = readJson(stylesPath);
      for (const [key, expected] of Object.entries(state.expectStyles)) {
        if (JSON.stringify(valueAt(styles, key)) !== JSON.stringify(expected)) {
          errors.push(`${state.id}: styles.${key} mismatch`);
        }
      }
    }
  }
}

function validateStaticImageState(errors, manifest, root, state) {
  validateImage(errors, root, state);
  const notes = fs.readFileSync(path.resolve(root, state.notes), "utf8");
  if (!notes.includes(manifest.builds.lynxWeb)) {
    errors.push(`${state.id}: notes do not bind the current Lynx-for-Web build`);
  }
  if (!notes.includes(manifest.snapshotSha256)) {
    errors.push(`${state.id}: notes do not bind the current snapshot`);
  }
}

export function validateProvidersEvidenceManifest(manifest, root) {
  const errors = [];
  const seen = new Set();
  if (manifest.version !== 1) errors.push("manifest.version must be 1");
  validateHash(errors, "snapshot", manifest.snapshotSha256);
  for (const [name, value] of Object.entries(manifest.builds ?? {})) {
    validateHash(errors, `builds.${name}`, value);
  }
  if (!Array.isArray(manifest.states) || manifest.states.length !== 13) {
    errors.push("manifest must declare exactly 13 states");
  }
  for (const state of manifest.states ?? []) {
    if (seen.has(state.id)) errors.push(`${state.id}: duplicate state id`);
    seen.add(state.id);
    if (state.kind === "browser") {
      validateBrowserState(errors, manifest, root, state);
    } else if (state.kind === "native") {
      validateNativeState(errors, manifest, root, state);
    } else if (state.kind === "static-image") {
      validateStaticImageState(errors, manifest, root, state);
    } else {
      errors.push(`${state.id}: unknown kind ${String(state.kind)}`);
    }
  }
  return { errors, stateCount: seen.size };
}

export function validateProvidersEvidence(manifestPath = DEFAULT_MANIFEST) {
  return validateProvidersEvidenceManifest(
    readJson(manifestPath),
    path.dirname(manifestPath),
  );
}

function parseManifest(argv) {
  const index = argv.indexOf("--manifest");
  return index >= 0 ? path.resolve(argv[index + 1] ?? "") : DEFAULT_MANIFEST;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateProvidersEvidence(parseManifest(process.argv.slice(2)));
  if (result.errors.length > 0) {
    process.stderr.write(`${result.errors.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`validated ${result.stateCount} Providers evidence states\n`);
  }
}
