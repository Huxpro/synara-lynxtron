import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import {
  pngDimensions,
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

test("the retained continuation manifest is complete", () => {
  const manifestPath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "../../../shots/2026-08-05/settings-continuation-manifest.json",
  );
  const result = validateSettingsContinuation(manifestPath);
  assert.deepEqual(result.errors, []);
  assert.equal(result.stateCount, 16);
});
