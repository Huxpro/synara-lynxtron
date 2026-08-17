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
      inspectorResources:
        '/repo/node_modules/@lynx-js/lynxtron/dist/lynxtron.app/Contents/Resources/LynxDebugResources.bundle',
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
      inspectorResources:
        'C:\\repo\\node_modules\\@lynx-js\\lynxtron\\dist\\resources\\logbox',
    }
  );
});

test('fails with an actionable root-install message when inspector assets are missing', () => {
  assert.throws(
    () =>
      verifyLynxtronRuntime(
        {
          executable: '/runtime/lynxtron',
          inspectorResources: '/runtime/LynxDebugResources.bundle',
        },
        (filePath) => filePath.endsWith('/lynxtron')
      ),
    /Run `bun install` from the repository root/
  );
});

test('accepts an inspector-capable runtime', () => {
  assert.doesNotThrow(() =>
    verifyLynxtronRuntime(
      {
        executable: '/runtime/lynxtron',
        inspectorResources: '/runtime/LynxDebugResources.bundle',
      },
      () => true
    )
  );
});
