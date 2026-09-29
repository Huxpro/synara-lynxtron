#!/usr/bin/env node

import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildAppSnapHelper } from "../../desktop/scripts/build-appsnap-helper.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cachePath = path.join(appRoot, ".runtime", "appsnap", "synara-appsnap-helper");
const targetPath = path.join(appRoot, "dist", "desktop", "synara-appsnap-helper");

const helperPath = buildAppSnapHelper({
  arch: process.arch,
  outputPath: cachePath,
  quiet: true,
});
await mkdir(path.dirname(targetPath), { recursive: true });
await cp(helperPath, targetPath, { force: true });
console.log(`[stage-appsnap-helper] staged ${process.arch} helper`);
