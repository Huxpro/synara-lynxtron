import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveLynxtronRuntimePaths,
  verifyLynxtronRuntime,
} from './verify-lynxtron-runtime.mjs';

test('resolves the executable and inspector resources from the package root', () => {
  assert.deepEqual(
    resolveLynxtronRuntimePaths(
      '/repo/node_modules/@lynx-js/lynxtron/package.json',
      'darwin'
    ),
    {
      executable:
        '/repo/node_modules/@lynx-js/lynxtron/dist/lynxtron.app/Contents/MacOS/lynxtron',
      inspectorResourceCandidates: [
        '/repo/node_modules/@lynx-js/lynxtron/dist/lynxtron.app/Contents/Resources/LynxDebugResources.bundle',
        '/repo/node_modules/@lynx-js/lynxtron/dist/lynxtron.app/Contents/Resources/LynxResources.bundle',
      ],
    }
  );
});
test('prefers the versioned devtool runtime layout used by current releases', () => {
  assert.deepEqual(
    resolveLynxtronRuntimePaths(
      '/repo/node_modules/@lynx-js/lynxtron/package.json',
      'darwin',
      (filePath) => filePath.includes('/dist/devtool/Lynxtron.app/')
    ),
    {
      executable:
        '/repo/node_modules/@lynx-js/lynxtron/dist/devtool/Lynxtron.app/Contents/MacOS/lynxtron',
      inspectorResourceCandidates: [
        '/repo/node_modules/@lynx-js/lynxtron/dist/devtool/Lynxtron.app/Contents/Resources/LynxDebugResources.bundle',
        '/repo/node_modules/@lynx-js/lynxtron/dist/devtool/Lynxtron.app/Contents/Resources/LynxResources.bundle',
      ],
    }
  );
});
test('resolves Windows runtime and devtool resource paths', () => {
  assert.deepEqual(
    resolveLynxtronRuntimePaths(
      'C:\\repo\\node_modules\\@lynx-js\\lynxtron\\package.json',
      'win32'
    ),
    {
      executable:
        'C:\\repo\\node_modules\\@lynx-js\\lynxtron\\dist\\lynxtron.exe',
      inspectorResourceCandidates: [
        'C:\\repo\\node_modules\\@lynx-js\\lynxtron\\dist\\resources\\logbox',
      ],
    }
  );
});
test('fails with an actionable root-install message when inspector assets are missing', () => {
  assert.throws(
    () =>
      verifyLynxtronRuntime(
        {
          executable: '/runtime/lynxtron',
          inspectorResourceCandidates: ['/runtime/LynxDebugResources.bundle'],
        },
        (filePath) => filePath.endsWith('/lynxtron')
      ),
    /Run `bun install` from the repository root/
  );
});
test('accepts an inspector-capable legacy runtime', () => {
  assert.doesNotThrow(() =>
    verifyLynxtronRuntime(
      {
        executable: '/runtime/lynxtron',
        inspectorResourceCandidates: ['/runtime/LynxDebugResources.bundle'],
      },
      () => true
    )
  );
});

test('accepts the consolidated resource bundle used by current macOS releases', () => {
  assert.doesNotThrow(() =>
    verifyLynxtronRuntime(
      {
        executable: '/runtime/lynxtron',
        inspectorResourceCandidates: [
          '/runtime/LynxDebugResources.bundle',
          '/runtime/LynxResources.bundle',
        ],
      },
      (filePath) =>
        filePath.endsWith('/lynxtron') ||
        filePath.endsWith('/LynxResources.bundle')
    )
  );
});
