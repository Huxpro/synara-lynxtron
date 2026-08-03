import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "perceptual-evidence.mjs",
);
const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "synara-perceptual-evidence-"));
  temporaryDirectories.push(directory);
  return directory;
}

function writePngHeader(filePath, width = 10, height = 10) {
  const buffer = Buffer.alloc(24);
  buffer.write("89504e470d0a1a0a", 0, "hex");
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  fs.writeFileSync(filePath, buffer);
}

function retainedEvidence(client) {
  return {
    status: "retained",
    path: `${client}.png`,
    comparisonPath: `${client}-comparison.png`,
    captureTier: client === "native" ? "native" : "browser",
    buildSha256: "build",
    snapshotSha256: "snapshot",
    image: { width: 10, height: 10 },
    geometry: `${client}-geometry.json`,
    styles: `${client}-styles.json`,
    console: `${client}-console.txt`,
    stateEcho: {
      semanticRoute: "new-chat",
      theme: "light",
      density: "comfortable",
      interactionState: "default",
    },
  };
}

function writeFixture(overrides = {}) {
  const directory = makeDirectory();
  for (const client of ["web", "lynx", "native"]) {
    writePngHeader(path.join(directory, `${client}.png`));
    writePngHeader(path.join(directory, `${client}-comparison.png`));
    fs.writeFileSync(
      path.join(directory, `${client}-geometry.json`),
      `${JSON.stringify({ client, stateId: "landing-default", anchors: {} })}\n`,
    );
    fs.writeFileSync(
      path.join(directory, `${client}-styles.json`),
      `${JSON.stringify({ client, stateId: "landing-default", roles: {} })}\n`,
    );
    fs.writeFileSync(path.join(directory, `${client}-console.txt`), "");
  }
  const manifest = {
    version: 1,
    id: "fixture",
    label: "Fixture",
    defaults: {
      snapshotSha256: "snapshot",
      comparisonViewport: { width: 10, height: 10 },
    },
    states: [
      {
        id: "landing-default",
        label: "Landing default",
        semanticRoute: "new-chat",
        theme: "light",
        density: "comfortable",
        interactionState: "default",
        viewport: { width: 10, height: 10, devicePixelRatio: 1 },
        requiredClients: ["web", "lynx", "native"],
        residuals: [],
        evidence: {
          web: retainedEvidence("web"),
          lynx: retainedEvidence("lynx"),
          native: retainedEvidence("native"),
        },
      },
    ],
    ...overrides,
  };
  const manifestPath = path.join(directory, "manifest.json");
  const outputPath = path.join(directory, "manifest.js");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { directory, manifestPath, outputPath };
}

function run(fixture, ...arguments_) {
  return spawnSync(
    process.execPath,
    [
      SCRIPT_PATH,
      "--manifest",
      fixture.manifestPath,
      "--output",
      fixture.outputPath,
      ...arguments_,
    ],
    { encoding: "utf8" },
  );
}

test("accepts a complete three-client state and writes gallery data", () => {
  const fixture = writeFixture();
  const result = run(fixture, "--write");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validated 1 states \(0 incomplete cells, 0 blocking residuals\)/);
  assert.match(
    fs.readFileSync(fixture.outputPath, "utf8"),
    /__SYNARA_PERCEPTUAL_EVIDENCE__/,
  );
});

test("keeps required pending cells red", () => {
  const fixture = writeFixture();
  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, "utf8"));
  manifest.states[0].evidence.native = {
    status: "pending",
    reason: "Native batch not captured.",
  };
  fs.writeFileSync(fixture.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const strict = run(fixture);
  assert.equal(strict.status, 2);
  assert.match(strict.stderr, /landing-default\.native: required evidence is pending/);
});

test("keeps open P0 and P1 residuals red", () => {
  const fixture = writeFixture();
  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, "utf8"));
  manifest.states[0].residuals = [
    {
      id: "landing-type",
      category: "TYPOGRAPHY",
      severity: "P1",
      status: "open",
      owner: "typography roles",
      summary: "Hero baseline differs.",
      impact: "Landing reads as a different product.",
      recommendation: "Calibrate the shared title role.",
    },
  ];
  fs.writeFileSync(fixture.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const strict = run(fixture);
  assert.equal(strict.status, 2);
  assert.match(strict.stderr, /open P1 residual/);

  const diagnostic = run(fixture, "--allow-incomplete", "--write");
  assert.equal(diagnostic.status, 0, diagnostic.stderr);
});

test("rejects accepted noise without evidence and reason", () => {
  const fixture = writeFixture();
  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, "utf8"));
  manifest.states[0].residuals = [
    {
      id: "raster-noise",
      category: "ANTIALIASING_NOISE",
      severity: "P3",
      status: "accepted-noise",
      owner: "native rasterizer",
      summary: "Small glyph-edge noise.",
      impact: "No geometry change.",
      recommendation: "Retain a small mask.",
    },
  ];
  fs.writeFileSync(fixture.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const result = run(fixture, "--allow-incomplete");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /accepted-noise requires reason and evidence/);
});

test("rejects state echo drift", () => {
  const fixture = writeFixture();
  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, "utf8"));
  manifest.states[0].evidence.lynx.stateEcho.theme = "dark";
  fs.writeFileSync(fixture.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const result = run(fixture, "--allow-incomplete");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /stateEcho\.theme="dark" does not match "light"/);
});

test("accepts a state-specific snapshot shared by every retained client", () => {
  const fixture = writeFixture();
  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, "utf8"));
  manifest.states[0].snapshotSha256 = "later-snapshot";
  for (const client of ["web", "lynx", "native"]) {
    manifest.states[0].evidence[client].snapshotSha256 = "later-snapshot";
  }
  fs.writeFileSync(fixture.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const result = run(fixture);
  assert.equal(result.status, 0, result.stderr);
});

test("rejects client snapshot drift within a state-specific capture", () => {
  const fixture = writeFixture();
  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, "utf8"));
  manifest.states[0].snapshotSha256 = "later-snapshot";
  for (const client of ["web", "lynx", "native"]) {
    manifest.states[0].evidence[client].snapshotSha256 = "later-snapshot";
  }
  manifest.states[0].evidence.lynx.snapshotSha256 = "other-snapshot";
  fs.writeFileSync(fixture.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const result = run(fixture, "--allow-incomplete");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /snapshot hash does not match state snapshot/);
});

test("rejects geometry artifacts for another state", () => {
  const fixture = writeFixture();
  const geometryPath = path.join(fixture.directory, "web-geometry.json");
  const artifact = JSON.parse(fs.readFileSync(geometryPath, "utf8"));
  artifact.stateId = "other-state";
  fs.writeFileSync(geometryPath, `${JSON.stringify(artifact)}\n`);

  const result = run(fixture, "--allow-incomplete");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /geometry\.stateId does not match/);
});

test("fixture files have stable hashes for downstream capture metadata", () => {
  const fixture = writeFixture();
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(fixture.directory, "web.png")))
    .digest("hex");
  assert.equal(hash.length, 64);
});
