import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynxtron application menu', () => {
  it('uses explicit Lynx bundle reload accelerators', () => {
    const lynxSource = readFileSync(
      new URL('./main.ts', import.meta.url),
      'utf8'
    );
    expect(lynxSource).not.toContain("{ role: 'reload' }");
    expect(lynxSource).not.toContain("{ role: 'forceReload' }");
    expect(lynxSource).toContain("id: 'reloadBundle'");
    expect(lynxSource).toContain("accelerator: 'CmdOrCtrl+R'");
    expect(lynxSource).toContain("id: 'forceReloadBundle'");
    expect(lynxSource).toContain("accelerator: 'CmdOrCtrl+Shift+R'");
    expect(lynxSource).toContain('click: () => reloadLynxWindow(w)');
    expect(lynxSource).toContain(
      "w.loadURL('http://localhost:5971/main.lynx.bundle', loadOptions)"
    );
    expect(lynxSource).toContain('w.loadFile(LYNX_BUNDLE_PATH, loadOptions)');
    expect(lynxSource).toContain("name === 'shellRouteChanged'");
    expect(lynxSource).toContain("name === 'shellReload'");
    expect(lynxSource).toContain(
      "...(isDev ? [{ role: 'toggleDevTools' }] : [])"
    );
  });
});
