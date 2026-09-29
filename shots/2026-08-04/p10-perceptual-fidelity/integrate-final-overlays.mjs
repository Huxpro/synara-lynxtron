#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(ROOT, "manifest.json");
const OVERLAY_ROOT = path.join(ROOT, "final-overlays");
const CLIENTS = ["web", "lynx", "native"];
const BUILD_SHA256 = {
  web: "2f1081bdc01d666bc11d6203274b54a3d54906eead14e064bfeda9d058ea4a9d",
  lynx: "9ff47872420c1af0c991a6864e2d91eb0e7f526b42bc1e950c382621cce76aaf",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${filePath} is not a PNG`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function interactionState(stateId) {
  if (stateId.startsWith("project-picker")) return "project-picker-open";
  if (stateId.startsWith("extras")) return "extras-open";
  if (stateId.startsWith("command-k")) return "command-k-open";
  if (stateId.startsWith("skill")) return "skill-filtered-review-agent";
  if (stateId.startsWith("mention")) return "mention-filtered-progress";
  throw new Error(`Unknown overlay state ${stateId}`);
}

function evidenceFor({ stateId, client, capture, snapshotSha256, theme }) {
  const relativeRoot = `final-overlays/${stateId}/${client}`;
  return {
    status: "retained",
    path: `${relativeRoot}/raw.png`,
    comparisonPath: `${relativeRoot}/comparison.png`,
    captureTier: client === "native" ? "native" : "browser",
    buildSha256: client === "native" ? capture.buildSha256 : BUILD_SHA256[client],
    snapshotSha256,
    image: pngDimensions(path.join(OVERLAY_ROOT, stateId, client, "raw.png")),
    geometry: `${relativeRoot}/geometry.json`,
    styles: `${relativeRoot}/styles.json`,
    console: `${relativeRoot}/console.txt`,
    stateEcho: {
      semanticRoute: "new-chat",
      theme,
      density: "comfortable",
      interactionState: interactionState(stateId),
    },
    alignment: {
      x: 0,
      y: 0,
      scale: client === "native" ? 0.5 : 1,
    },
  };
}

function residualsFor(stateId) {
  if (!stateId.startsWith("project-picker")) return [];
  return [
    {
      id: `${stateId}-host-folder-capability`,
      category: "INTENTIONAL_PLATFORM_DELTA",
      severity: "P3",
      status: "intentional-delta",
      owner: "Project Picker host filesystem capability boundary",
      summary:
        "Web lists server projects while Lynx-for-Web and Native also expose host-local folders.",
      impact:
        "The retained popup row count differs after the shared selected project row, while popup geometry and the canonical project action remain comparable.",
      recommendation:
        "Keep the capability delta explicit and compare only shared project-picker anatomy and the selected spike-workspace row.",
      evidence: `final-overlays/${stateId}/native/geometry.json`,
      reason:
        "Host-local folder discovery is unavailable to Web original and is intentionally retained on Lynx host clients.",
    },
  ];
}

function stateFor(stateId) {
  const width = stateId.endsWith("1440") ? 1440 : 1280;
  const height = width === 1440 ? 900 : 820;
  const theme = stateId.includes("-dark-") ? "dark" : "light";
  const capture = readJson(path.join(OVERLAY_ROOT, stateId, "native", "capture.json"));
  const snapshotSha256 = capture.snapshotSha256;
  return {
    id: stateId,
    label: `${stateId.replaceAll("-", " ")} · retained overlay`,
    semanticRoute: "new-chat",
    theme,
    density: "comfortable",
    interactionState: interactionState(stateId),
    snapshotSha256,
    viewport: {
      width,
      height,
      devicePixelRatio: 1,
    },
    comparisonViewport: {
      width,
      height: height - 32,
    },
    requiredClients: CLIENTS,
    residuals: residualsFor(stateId),
    evidence: Object.fromEntries(
      CLIENTS.map((client) => [
        client,
        evidenceFor({
          stateId,
          client,
          capture,
          snapshotSha256,
          theme,
        }),
      ]),
    ),
  };
}

const stateIds = fs
  .readdirSync(OVERLAY_ROOT)
  .filter((entry) => fs.statSync(path.join(OVERLAY_ROOT, entry)).isDirectory())
  .sort();

if (stateIds.length !== 18) {
  throw new Error(`Expected 18 final overlay directories, found ${stateIds.length}`);
}

const manifest = readJson(MANIFEST_PATH);
const overlayStateIds = new Set(stateIds);
manifest.states = [
  ...manifest.states.filter((state) => !overlayStateIds.has(state.id)),
  ...stateIds.map(stateFor),
];

fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  JSON.stringify({
    overlayStates: stateIds.length,
    manifestStates: manifest.states.length,
  }),
);
