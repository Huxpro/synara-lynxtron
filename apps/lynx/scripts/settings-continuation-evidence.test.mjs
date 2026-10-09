import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import {
  pngDimensions,
  stateSnapshotsMatch,
  validateSettingsContinuation,
} from "./settings-continuation-evidence.mjs";

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function writePng(filePath, width, height) {
  const buffer = Buffer.alloc(24);
  buffer.write("89504e470d0a1a0a", 0, "hex");
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  fs.writeFileSync(filePath, buffer);
}

test("reads PNG dimensions", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "settings-evidence-"));
  temporaryDirectories.push(directory);
  const filePath = path.join(directory, "frame.png");
  writePng(filePath, 1440, 900);
  assert.deepEqual(pngDimensions(filePath), { width: 1440, height: 900 });
});

test("requires every client in a state to use the same snapshot", () => {
  assert.equal(stateSnapshotsMatch(["a", "a", "a"]), true);
  assert.equal(stateSnapshotsMatch(["a", "b", "a"]), false);
});

const manifestPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../shots/2026-08-05/settings-continuation-manifest.json",
);

// The manifest is committed; the per-client `raw.png` captures it describes are
// local evidence that was never committed. On a checkout without any of them
// (CI, a fresh clone) there is nothing to validate. A partial set still runs,
// and fails as incomplete.
const RETAINED_CAPTURES_ABSENT = JSON.parse(fs.readFileSync(manifestPath, "utf8")).states.every(
  (state) =>
    Object.keys(state.images).every(
      (client) =>
        !fs.existsSync(path.join(path.dirname(manifestPath), state.directory, client, "raw.png")),
    ),
)
  ? "retained Settings captures are not in this checkout (local evidence, not committed)"
  : false;

test("the retained continuation manifest is complete", { skip: RETAINED_CAPTURES_ABSENT }, () => {
  const result = validateSettingsContinuation(manifestPath);
  assert.deepEqual(result.errors, []);
  assert.equal(result.stateCount, 16);
});
