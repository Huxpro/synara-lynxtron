import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'composer-evidence.mjs'
);
const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory() {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'synara-composer-evidence-')
  );
  temporaryDirectories.push(directory);
  return directory;
}

function writePngHeader(filePath, width = 1, height = 1) {
  const buffer = Buffer.alloc(24);
  buffer.write('89504e470d0a1a0a', 0, 'hex');
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  fs.writeFileSync(filePath, buffer);
}

function retainedEvidence(client, overrides = {}) {
  return {
    status: 'retained',
    path: 'frame.png',
    captureTier: client === 'native' ? 'native' : 'browser',
    buildSha256: 'build',
    snapshotSha256: 'snapshot',
    image: { width: 1, height: 1 },
    assertions: 'assertions.json',
    console: 'console.txt',
    stateEcho: {
      interactionMode: 'default',
      fastMode: false,
      selectedProject: null,
      tokenKind: null,
      tokenState: 'none',
    },
    ...overrides,
  };
}

function writeFixture(overrides = {}) {
  const directory = makeDirectory();
  writePngHeader(path.join(directory, 'frame.png'));
  fs.writeFileSync(path.join(directory, 'assertions.json'), '{}\n');
  fs.writeFileSync(path.join(directory, 'console.txt'), '');
  const manifest = {
    version: 1,
    id: 'fixture',
    label: 'Fixture',
    note: 'notes.md',
    defaults: {
      route: '/',
      theme: 'light',
      viewport: { width: 1, height: 1, devicePixelRatio: 1 },
      snapshotSha256: 'snapshot',
      selectedProject: null,
      workspaceRoot: null,
      interactionMode: 'default',
      fastMode: false,
      draft: '',
      caret: { start: 0, end: 0 },
      tokenKind: null,
      tokenState: 'none',
      skills: [],
      mentions: [],
    },
    states: [
      {
        id: 'state-a',
        label: 'State A',
        requiredClients: ['web', 'lynx', 'native'],
        state: {},
        evidence: {
          web: retainedEvidence('web'),
          lynx: retainedEvidence('lynx'),
          native: retainedEvidence('native'),
        },
      },
    ],
    ...overrides,
  };
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  return {
    directory,
    manifestPath: path.join(directory, 'manifest.json'),
    outputPath: path.join(directory, 'manifest.js'),
  };
}

function run(fixture, ...arguments_) {
  return spawnSync(
    process.execPath,
    [
      SCRIPT_PATH,
      '--manifest',
      fixture.manifestPath,
      '--output',
      fixture.outputPath,
      ...arguments_,
    ],
    { encoding: 'utf8' }
  );
}

test('accepts a complete state and writes offline gallery data', () => {
  const fixture = writeFixture();
  const result = run(fixture, '--write');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validated 1 Composer states \(0 incomplete/);
  assert.match(
    fs.readFileSync(fixture.outputPath, 'utf8'),
    /__SYNARA_COMPOSER_EVIDENCE__/
  );
});

test('keeps required pending cells red in strict mode', () => {
  const fixture = writeFixture();
  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'));
  manifest.states[0].evidence.lynx = {
    status: 'pending',
    reason: 'Not captured yet.',
  };
  fs.writeFileSync(
    fixture.manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  const strict = run(fixture);
  assert.equal(strict.status, 2);
  assert.match(strict.stderr, /state-a\.lynx: required evidence is pending/);

  const diagnostic = run(fixture, '--allow-incomplete', '--write');
  assert.equal(diagnostic.status, 0, diagnostic.stderr);
  assert.ok(fs.existsSync(fixture.outputPath));
});

test('rejects retained evidence whose state echo does not match', () => {
  const fixture = writeFixture();
  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'));
  manifest.states[0].state = { interactionMode: 'plan' };
  fs.writeFileSync(
    fixture.manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  const result = run(fixture, '--allow-incomplete');
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /stateEcho\.interactionMode="default" does not match "plan"/
  );
});
