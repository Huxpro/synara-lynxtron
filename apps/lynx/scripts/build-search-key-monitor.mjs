import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') {
  console.log('[build-search-key-monitor] skipped outside macOS');
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'dist', 'desktop', 'native');
mkdirSync(outputDir, { recursive: true });
const nodeIncludeCandidates = [
  process.config.variables.node_prefix
    ? path.resolve(process.config.variables.node_prefix, 'include', 'node')
    : null,
  path.resolve(path.dirname(process.execPath), '..', 'include', 'node'),
].filter((candidate) => candidate !== null);
const nodeInclude = nodeIncludeCandidates.find((candidate) =>
  existsSync(path.join(candidate, 'node_api.h'))
);
if (!nodeInclude) {
  throw new Error(
    `Unable to locate Node headers. Checked: ${nodeIncludeCandidates.join(', ')}`
  );
}
execFileSync('clang++', [
  '-std=c++17',
  '-fobjc-arc',
  '-bundle',
  '-undefined',
  'dynamic_lookup',
  '-framework',
  'AppKit',
  `-I${nodeInclude}`,
  path.join(root, 'native', 'search-key-monitor.mm'),
  '-o',
  path.join(outputDir, 'search-key-monitor.node'),
], { stdio: 'inherit' });
execFileSync('clang++', [
  '-std=c++17',
  '-fobjc-arc',
  '-bundle',
  '-undefined',
  'dynamic_lookup',
  '-framework',
  'AppKit',
  '-framework',
  'WebKit',
  `-I${nodeInclude}`,
  path.join(root, 'native', 'browser-view-probe.mm'),
  '-o',
  path.join(outputDir, 'browser-view-probe.node'),
], { stdio: 'inherit' });
execFileSync('clang++', [
  '-std=c++17', '-fobjc-arc', '-bundle', '-undefined', 'dynamic_lookup',
  '-framework', 'AVFoundation', '-framework', 'CoreMedia',
  `-I${nodeInclude}`, path.join(root, 'native', 'voice-recorder.mm'),
  '-o', path.join(outputDir, 'voice-recorder.node'),
], { stdio: 'inherit' });
console.log('[build-search-key-monitor] staged native host addons');
