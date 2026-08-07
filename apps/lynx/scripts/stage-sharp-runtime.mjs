#!/usr/bin/env node

import { cp, mkdir, readFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharpRoot = await realpath(path.join(appRoot, 'node_modules', 'sharp'));
const sourceNodeModules = path.dirname(sharpRoot);
const targetNodeModules = path.join(appRoot, 'dist', 'desktop', 'node_modules');

const platformPackages = {
  'darwin-arm64': [
    '@img/sharp-darwin-arm64',
    '@img/sharp-libvips-darwin-arm64',
  ],
  'darwin-x64': [
    '@img/sharp-darwin-x64',
    '@img/sharp-libvips-darwin-x64',
  ],
  'linux-arm64': [
    '@img/sharp-linux-arm64',
    '@img/sharp-libvips-linux-arm64',
  ],
  'linux-x64': [
    '@img/sharp-linux-x64',
    '@img/sharp-libvips-linux-x64',
  ],
  'win32-arm64': ['@img/sharp-win32-arm64'],
  'win32-x64': ['@img/sharp-win32-x64'],
};

const platformKey = `${process.platform}-${process.arch}`;
const packages = [
  'sharp',
  '@img/colour',
  'detect-libc',
  'semver',
  ...(platformPackages[platformKey] ?? []),
];

if (!platformPackages[platformKey]) {
  throw new Error(`Unsupported Sharp runtime target: ${platformKey}`);
}

await rm(targetNodeModules, { recursive: true, force: true });

for (const packageName of packages) {
  const source = await realpath(path.join(sourceNodeModules, packageName));
  const target = path.join(targetNodeModules, packageName);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, {
    recursive: true,
    dereference: true,
    force: true,
  });
}

const packageJsonPath = path.join(targetNodeModules, 'sharp', 'package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
if (packageJson.version !== '0.34.5') {
  throw new Error(`Unexpected staged Sharp version: ${packageJson.version}`);
}

console.log(
  `[stage-sharp-runtime] staged ${packages.length} packages for ${platformKey}`
);
