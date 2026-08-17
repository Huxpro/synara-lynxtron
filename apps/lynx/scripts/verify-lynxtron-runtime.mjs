#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const requireFromApp = createRequire(import.meta.url);

export function resolveLynxtronRuntimePaths(
  packageJsonPath,
  platform = process.platform
) {
  const pathApi = platform === 'win32' ? path.win32 : path;
  const packageRoot = pathApi.dirname(packageJsonPath);
  const distRoot = pathApi.join(packageRoot, 'dist');
  if (platform === 'darwin') {
    const appRoot = pathApi.join(distRoot, 'lynxtron.app');
    return {
      executable: pathApi.join(appRoot, 'Contents', 'MacOS', 'lynxtron'),
      inspectorResources: pathApi.join(
        appRoot,
        'Contents',
        'Resources',
        'LynxDebugResources.bundle'
      ),
    };
  }
  if (platform === 'win32') {
    return {
      executable: pathApi.join(distRoot, 'lynxtron.exe'),
      inspectorResources: pathApi.join(distRoot, 'resources', 'logbox'),
    };
  }
  return {
    executable: pathApi.join(distRoot, 'lynxtron'),
    inspectorResources: pathApi.join(distRoot, 'resources', 'logbox'),
  };
}

export function verifyLynxtronRuntime(paths, exists = existsSync) {
  const missing = Object.entries(paths)
    .filter(([, filePath]) => !exists(filePath))
    .map(([name, filePath]) => `${name}: ${filePath}`);
  if (missing.length > 0) {
    throw new Error(
      [
        'Lynxtron runtime installation is incomplete.',
        ...missing,
        'Run `bun install` from the repository root so trusted postinstall scripts execute.',
      ].join('\n')
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const packageJsonPath = requireFromApp.resolve(
    '@lynx-js/lynxtron/package.json'
  );
  const paths = resolveLynxtronRuntimePaths(packageJsonPath);
  verifyLynxtronRuntime(paths);
  console.log(
    `[verify-lynxtron-runtime] inspector-capable runtime ready: ${paths.executable}`
  );
}
