import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(import.meta.dirname, '..');

test('stages a self-contained Sharp runtime for the desktop bundle', async () => {
  execFileSync(process.execPath, ['scripts/stage-sharp-runtime.mjs'], {
    cwd: appRoot,
    stdio: 'pipe',
  });
  const requireFromDist = createRequire(
    path.join(appRoot, 'dist', 'desktop', 'package.json')
  );
  assert.match(
    requireFromDist.resolve('sharp'),
    /dist\/desktop\/node_modules\/sharp\/lib\/index\.js$/
  );
  const sharp = requireFromDist('sharp');
  const png = await sharp(
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>'
    )
  )
    .png()
    .toBuffer();
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});
