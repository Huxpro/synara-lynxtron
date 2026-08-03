#!/usr/bin/env node

import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLIENTS = ["web", "lynx", "native"];
const EVIDENCE_STATUSES = new Set(["retained", "diagnostic", "pending", "not-applicable"]);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const DEFAULT_MANIFEST_PATH = path.join(REPO_ROOT, "shots/2026-08-03/p9-u5-composer/manifest.json");
const DEFAULT_OUTPUT_PATH = path.join(REPO_ROOT, "shots/2026-08-03/p9-u5-composer/manifest.js");
const COMPARISON_DIR = path.join(REPO_ROOT, "shots/2026-08-03/p8-q2");

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
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.length < 24) {
    throw new Error(`${filePath} is not a valid PNG file`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function resolveEvidencePath(manifestPath, evidencePath) {
  return path.resolve(path.dirname(manifestPath), evidencePath);
}

function comparisonRelativePath(manifestPath, evidencePath) {
  return path
    .relative(COMPARISON_DIR, resolveEvidencePath(manifestPath, evidencePath))
    .split(path.sep)
    .join("/");
}

function mergedState(manifest, state) {
  return {
    ...manifest.defaults,
    ...state.state,
    caret: {
      ...manifest.defaults.caret,
      ...(state.state.caret ?? {}),
    },
    skills: state.state.skills ?? manifest.defaults.skills,
    mentions: state.state.mentions ?? manifest.defaults.mentions,
  };
}

function expectedImageDimensions(manifest, client, evidence) {
  if (evidence.image) return evidence.image;
  if (client === "native") {
    return { width: 2560, height: 1576 };
  }
  return {
    width: manifest.defaults.viewport.width,
    height: manifest.defaults.viewport.height,
  };
}

function validateStateEcho(errors, prefix, evidence, resolvedState) {
  const echo = evidence.stateEcho ?? {};
  for (const key of ["interactionMode", "fastMode", "selectedProject", "tokenKind", "tokenState"]) {
    if (JSON.stringify(echo[key]) !== JSON.stringify(resolvedState[key])) {
      errors.push(
        `${prefix}: stateEcho.${key}=${JSON.stringify(echo[key])} does not match ${JSON.stringify(resolvedState[key])}`,
      );
    }
  }
}

function assertionText(manifestPath, evidence) {
  if (!evidence.assertions) return "";
  const assertionsPath = resolveEvidencePath(manifestPath, evidence.assertions);
  if (!fs.existsSync(assertionsPath)) return "";
  return fs.readFileSync(assertionsPath, "utf8");
}

function validateManifest(manifest, manifestPath) {
  const errors = [];
  const warnings = [];
  const incomplete = [];
  const ids = new Set();
  const requiredDefaultKeys = [
    "route",
    "theme",
    "viewport",
    "snapshotSha256",
    "selectedProject",
    "workspaceRoot",
    "interactionMode",
    "fastMode",
    "draft",
    "caret",
    "tokenKind",
    "tokenState",
    "skills",
    "mentions",
  ];

  if (manifest.version !== 1) errors.push("manifest.version must be 1");
  if (!Array.isArray(manifest.states) || manifest.states.length === 0) {
    errors.push("manifest.states must be a non-empty array");
    return { errors, incomplete, warnings };
  }
  for (const key of requiredDefaultKeys) {
    if (!(key in (manifest.defaults ?? {}))) {
      errors.push(`manifest.defaults.${key} is required`);
    }
  }

  for (const state of manifest.states) {
    const prefix = state.id || "<missing-state-id>";
    if (!state.id || typeof state.id !== "string") {
      errors.push("Every state requires a string id");
      continue;
    }
    if (ids.has(state.id)) errors.push(`${prefix}: duplicate state id`);
    ids.add(state.id);
    if (!state.label) errors.push(`${prefix}: label is required`);
    if (!Array.isArray(state.requiredClients)) {
      errors.push(`${prefix}: requiredClients must be an array`);
      continue;
    }
    const requiredClients = new Set(state.requiredClients);
    const optionalClients = new Set(state.optionalClients ?? []);
    for (const client of [...requiredClients, ...optionalClients]) {
      if (!CLIENTS.includes(client)) {
        errors.push(`${prefix}: unknown client ${client}`);
      }
    }

    const resolvedState = mergedState(manifest, state);
    for (const client of CLIENTS) {
      const evidence = state.evidence?.[client];
      if (!evidence) {
        errors.push(`${prefix}.${client}: evidence entry is required`);
        continue;
      }
      if (!EVIDENCE_STATUSES.has(evidence.status)) {
        errors.push(`${prefix}.${client}: invalid status ${String(evidence.status)}`);
        continue;
      }
      if (requiredClients.has(client) && evidence.status !== "retained") {
        incomplete.push(`${prefix}.${client}: required evidence is ${evidence.status}`);
      }
      if (
        (evidence.status === "pending" ||
          evidence.status === "diagnostic" ||
          evidence.status === "not-applicable") &&
        !evidence.reason
      ) {
        errors.push(`${prefix}.${client}: ${evidence.status} requires a reason`);
      }
      if (requiredClients.has(client) && evidence.status === "not-applicable") {
        errors.push(`${prefix}.${client}: required evidence cannot be not-applicable`);
      }
      if (evidence.status === "not-applicable" && evidence.path) {
        errors.push(`${prefix}.${client}: not-applicable evidence cannot reference a path`);
      }
      const focusedTestEvidence =
        evidence.status === "retained" && evidence.captureTier === "focused-test";
      if (
        (evidence.status === "retained" || evidence.status === "diagnostic") &&
        !evidence.path &&
        !focusedTestEvidence
      ) {
        errors.push(`${prefix}.${client}: ${evidence.status} requires a path`);
      }
      if (focusedTestEvidence) {
        for (const key of [
          "artifact",
          "artifactSha256",
          "buildSha256",
          "assertions",
          "stateEcho",
        ]) {
          if (!evidence[key]) {
            errors.push(`${prefix}.${client}: focused-test evidence requires ${key}`);
          }
        }
        if (evidence.path) {
          errors.push(
            `${prefix}.${client}: focused-test evidence cannot reference a screenshot path`,
          );
        }
        if (evidence.console) {
          errors.push(
            `${prefix}.${client}: focused-test evidence cannot reference a browser console`,
          );
        }
        if (
          evidence.assertions &&
          !fs.existsSync(resolveEvidencePath(manifestPath, evidence.assertions))
        ) {
          errors.push(`${prefix}.${client}: missing assertions file ${evidence.assertions}`);
        }
        if (evidence.artifact) {
          const artifactPath = resolveEvidencePath(manifestPath, evidence.artifact);
          if (!fs.existsSync(artifactPath)) {
            errors.push(`${prefix}.${client}: missing focused-test artifact ${evidence.artifact}`);
          } else {
            if (evidence.artifactSha256 && sha256(artifactPath) !== evidence.artifactSha256) {
              errors.push(`${prefix}.${client}: focused-test artifact hash does not match`);
            }
            try {
              const artifact = readJson(artifactPath);
              if (artifact.status !== "pass") {
                errors.push(`${prefix}.${client}: focused-test artifact status must be pass`);
              }
              if (artifact.stateId !== state.id) {
                errors.push(`${prefix}.${client}: focused-test artifact stateId does not match`);
              }
              if (!Array.isArray(artifact.clients) || !artifact.clients.includes(client)) {
                errors.push(`${prefix}.${client}: focused-test artifact does not cover client`);
              }
              if (!Array.isArray(artifact.assertions) || artifact.assertions.length === 0) {
                errors.push(`${prefix}.${client}: focused-test artifact requires assertions`);
              }
            } catch (error) {
              errors.push(`${prefix}.${client}: invalid focused-test artifact: ${error.message}`);
            }
          }
        }
        validateStateEcho(errors, `${prefix}.${client}`, evidence, resolvedState);
      }
      if (!evidence.path) continue;

      const absolutePath = resolveEvidencePath(manifestPath, evidence.path);
      if (!fs.existsSync(absolutePath)) {
        errors.push(`${prefix}.${client}: missing file ${evidence.path}`);
        continue;
      }
      try {
        const actual = pngDimensions(absolutePath);
        const expected = expectedImageDimensions(manifest, client, evidence);
        if (actual.width !== expected.width || actual.height !== expected.height) {
          errors.push(
            `${prefix}.${client}: PNG is ${actual.width}x${actual.height}, expected ${expected.width}x${expected.height}`,
          );
        }
      } catch (error) {
        errors.push(`${prefix}.${client}: ${error.message}`);
      }

      if (evidence.status !== "retained") continue;
      for (const key of [
        "captureTier",
        "buildSha256",
        "snapshotSha256",
        "assertions",
        "console",
        "stateEcho",
      ]) {
        if (!evidence[key]) {
          errors.push(`${prefix}.${client}: retained evidence requires ${key}`);
        }
      }
      if (evidence.snapshotSha256 && evidence.snapshotSha256 !== manifest.defaults.snapshotSha256) {
        errors.push(`${prefix}.${client}: snapshot hash does not match manifest`);
      }
      for (const linkedKey of ["assertions", "console"]) {
        if (
          evidence[linkedKey] &&
          !fs.existsSync(resolveEvidencePath(manifestPath, evidence[linkedKey]))
        ) {
          errors.push(`${prefix}.${client}: missing ${linkedKey} file ${evidence[linkedKey]}`);
        }
      }
      validateStateEcho(errors, `${prefix}.${client}`, evidence, resolvedState);
      const assertions = assertionText(manifestPath, evidence);
      if (resolvedState.tokenState === "selected") {
        for (const skill of resolvedState.skills) {
          if (!assertions.includes(skill.name)) {
            errors.push(`${prefix}.${client}: assertions do not name selected skill ${skill.name}`);
          }
        }
        for (const mention of resolvedState.mentions) {
          if (!assertions.includes(mention.name)) {
            errors.push(
              `${prefix}.${client}: assertions do not name selected mention ${mention.name}`,
            );
          }
        }
      }
    }
  }

  if (incomplete.length > 0) {
    warnings.push(`${incomplete.length} required client cells are not retained yet`);
  }
  return { errors, incomplete, warnings };
}

function toGalleryData(manifest, manifestPath) {
  const screens = manifest.states.map((state) => ({
    id: state.id,
    label: state.label,
    note: manifest.note,
  }));
  const cases = manifest.states.map((state) => {
    const resolvedState = mergedState(manifest, state);
    const evidence = state.evidence;
    const clientData = Object.fromEntries(
      CLIENTS.map((client) => {
        const entry = evidence[client];
        return [
          client,
          {
            status: entry.status,
            reason: entry.reason ?? null,
            artifact: entry.artifact ? comparisonRelativePath(manifestPath, entry.artifact) : null,
            path: entry.path ? comparisonRelativePath(manifestPath, entry.path) : null,
          },
        ];
      }),
    );
    return {
      id: state.id,
      label: state.label,
      note: comparisonRelativePath(manifestPath, manifest.note),
      theme: resolvedState.theme,
      size: String(resolvedState.viewport.width),
      browserSize: `${resolvedState.viewport.width} × ${resolvedState.viewport.height}`,
      nativeSize: clientData.native.path
        ? "2560 × 1576"
        : (clientData.native.reason ?? "Not retained"),
      key: `${state.id}-${resolvedState.theme}-${resolvedState.viewport.width}`,
      state: {
        route: resolvedState.route,
        project: resolvedState.selectedProject,
        workspaceRoot: resolvedState.workspaceRoot,
        interactionMode: resolvedState.interactionMode,
        fastMode: resolvedState.fastMode,
        draft: resolvedState.draft,
        caret: resolvedState.caret,
        tokenKind: resolvedState.tokenKind,
        tokenState: resolvedState.tokenState,
      },
      web: clientData.web.path,
      lynx: clientData.lynx.path,
      native: clientData.native.path,
      webStatus: clientData.web.status,
      lynxStatus: clientData.lynx.status,
      nativeStatus: clientData.native.status,
      webMissingReason: clientData.web.reason,
      lynxMissingReason: clientData.lynx.reason,
      nativeMissingReason: clientData.native.reason,
      lynxMetrics: clientData.lynx.artifact,
      webMetrics: clientData.web.artifact,
    };
  });
  return { cases, screens };
}

function writeGalleryData(outputPath, galleryData) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `globalThis.__SYNARA_COMPOSER_EVIDENCE__ = ${JSON.stringify(galleryData, null, 2)};\n`,
    "utf8",
  );
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const manifest = readJson(options.manifestPath);
  const result = validateManifest(manifest, options.manifestPath);
  for (const warning of result.warnings) console.warn(`warning: ${warning}`);
  for (const item of result.incomplete) console.warn(`incomplete: ${item}`);
  for (const error of result.errors) console.error(`error: ${error}`);
  if (result.errors.length > 0) process.exit(1);
  if (result.incomplete.length > 0 && !options.allowIncomplete) process.exit(2);
  if (options.write) {
    writeGalleryData(options.outputPath, toGalleryData(manifest, options.manifestPath));
    console.log(
      `wrote ${path.relative(REPO_ROOT, options.outputPath)} with ${manifest.states.length} Composer states`,
    );
  }
  console.log(
    `validated ${manifest.states.length} Composer states (${result.incomplete.length} incomplete required cells)`,
  );
}

main();
