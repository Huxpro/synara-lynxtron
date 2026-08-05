#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const DEFAULT_MANIFEST = path.join(
  REPO_ROOT,
  "shots/2026-08-05/settings-continuation-manifest.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readPossiblyEncodedJson(filePath) {
  const parsed = readJson(filePath);
  return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
}

export function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${filePath} is not a valid PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function validateHash(errors, prefix, value) {
  if (!/^[0-9a-f]{64}$/.test(String(value))) {
    errors.push(`${prefix}: invalid SHA-256`);
  }
}

function validatePng(errors, prefix, filePath, expected) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${prefix}: missing ${filePath}`);
    return;
  }
  try {
    const actual = pngDimensions(filePath);
    if (actual.width !== expected.width || actual.height !== expected.height) {
      errors.push(
        `${prefix}: PNG ${actual.width}x${actual.height}, expected ${expected.width}x${expected.height}`,
      );
    }
  } catch (error) {
    errors.push(`${prefix}: ${error.message}`);
  }
}

export function validateSettingsContinuation(manifestPath) {
  const manifest = readJson(manifestPath);
  const root = path.dirname(manifestPath);
  const errors = [];
  const seen = new Set();

  if (manifest.version !== 1) errors.push("manifest.version must be 1");
  if (!Array.isArray(manifest.states) || manifest.states.length !== 16) {
    errors.push("manifest must declare exactly 16 states");
  }

  for (const state of manifest.states ?? []) {
    const prefix = state.id;
    if (seen.has(state.id)) errors.push(`${prefix}: duplicate state id`);
    seen.add(state.id);
    const stateDir = path.resolve(root, state.directory);
    const expectedEcho = {
      semanticRoute: state.semanticRoute,
      theme: state.theme,
      density: state.density,
      interactionState: state.interactionState,
    };

    for (const client of ["web", "lynx", "native"]) {
      const clientDir = path.join(stateDir, client);
      const capturePath = path.join(clientDir, "capture.json");
      const geometryPath = path.join(clientDir, "geometry.json");
      const consolePath = path.join(clientDir, "console.txt");
      if (!fs.existsSync(capturePath)) {
        errors.push(`${prefix}.${client}: missing capture.json`);
        continue;
      }
      const capture = readJson(capturePath);
      if (capture.client !== client) errors.push(`${prefix}.${client}: client mismatch`);
      if (capture.stateId !== state.id) errors.push(`${prefix}.${client}: stateId mismatch`);
      validateHash(errors, `${prefix}.${client}.snapshot`, capture.snapshotSha256);
      if (JSON.stringify(capture.stateEcho) !== JSON.stringify(expectedEcho)) {
        errors.push(`${prefix}.${client}: stateEcho mismatch`);
      }
      if (client !== "web") {
        validateHash(errors, `${prefix}.${client}.build`, capture.buildSha256);
        if (capture.buildSha256 !== manifest.builds[client]) {
          errors.push(`${prefix}.${client}: build hash mismatch`);
        }
      }
      validatePng(
        errors,
        `${prefix}.${client}`,
        path.join(clientDir, "raw.png"),
        state.images[client],
      );
      if (!fs.existsSync(geometryPath)) {
        errors.push(`${prefix}.${client}: missing geometry.json`);
        continue;
      }
      const geometry = readPossiblyEncodedJson(geometryPath);
      if (client === "web") {
        const themeMatches =
          state.theme === "dark" ? geometry.dark === true : geometry.light !== false;
        if (!themeMatches) errors.push(`${prefix}.web: theme proof missing`);
      } else if (client === "lynx") {
        if (!String(geometry.href).includes("/lynx/index.html")) {
          errors.push(`${prefix}.lynx: host URL is not Lynx-for-Web`);
        }
        if (!geometry.target) errors.push(`${prefix}.lynx: target role is missing`);
        const themeMatches =
          state.theme === "dark" ? geometry.dark === true : geometry.light === true;
        if (!themeMatches) errors.push(`${prefix}.lynx: theme proof missing`);
      } else {
        const rootClass = geometry.roles?.root?.attributes?.class ?? "";
        if (!rootClass.includes(`SliceRoot--theme-${state.theme}`)) {
          errors.push(`${prefix}.native: root theme mismatch`);
        }
        if (!geometry.roles?.target?.box) errors.push(`${prefix}.native: target role missing`);
        if (capture.identity?.session?.url !== manifest.nativeBundlePath) {
          errors.push(`${prefix}.native: bundle identity mismatch`);
        }
      }
      if (!fs.existsSync(consolePath)) {
        errors.push(`${prefix}.${client}: missing console.txt`);
      } else if (client === "native" && fs.statSync(consolePath).size !== 0) {
        errors.push(`${prefix}.native: console is not empty`);
      }
    }
  }

  return { errors, stateCount: seen.size };
}

function parseManifest(argv) {
  const index = argv.indexOf("--manifest");
  return index >= 0 ? path.resolve(argv[index + 1] ?? "") : DEFAULT_MANIFEST;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateSettingsContinuation(parseManifest(process.argv.slice(2)));
  if (result.errors.length > 0) {
    process.stderr.write(`${result.errors.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `validated ${result.stateCount} Settings states / ${result.stateCount * 3} client cells\n`,
    );
  }
}
