import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynxtron application menu', () => {
  it('matches Electron reload and force-reload View actions', () => {
    const lynxSource = readFileSync(
      new URL('./main.ts', import.meta.url),
      'utf8'
    );
    const electronSource = readFileSync(
      new URL('../../../../desktop/src/main.ts', import.meta.url),
      'utf8'
    );

    const lynxReload = lynxSource.indexOf("{ role: 'reload' }");
    const lynxForceReload = lynxSource.indexOf("{ role: 'forceReload' }");
    expect(lynxReload).toBeGreaterThan(-1);
    expect(lynxForceReload).toBeGreaterThan(lynxReload);
    expect(electronSource).toContain('{ role: "reload" }');
    expect(electronSource).toContain('{ role: "forceReload" }');
    expect(lynxSource).toContain(
      "...(isDev ? [{ role: 'toggleDevTools' }] : [])"
    );
  });
});
