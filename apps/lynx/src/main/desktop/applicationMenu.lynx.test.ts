import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynxtron application menu', () => {
  it('uses fresh app relaunch accelerators instead of reusing a renderer', () => {
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
    expect(lynxSource).toContain('click: () => relaunchApp()');
    expect(lynxSource).toContain('spawn(process.execPath, args, {');
    expect(lynxSource).toContain('try {');
    expect(lynxSource).toContain('let replacement: ReturnType<typeof spawn>');
    expect(lynxSource).toContain('return;');
    expect(lynxSource).toContain('detached: true');
    expect(lynxSource).toContain("replacement.once('spawn'");
    expect(lynxSource).toContain("replacement.once('error'");
    expect(lynxSource).toContain('app.releaseSingleInstanceLock()');
    expect(lynxSource).toContain('app.quit()');
    expect(lynxSource).toContain('if (relaunchRequested) return;');
    expect(lynxSource).not.toContain('function reloadLynxWindow');
    expect(lynxSource).toContain(
      "w.loadURL('http://localhost:5971/main.lynx.bundle', loadOptions)"
    );
    expect(lynxSource).toContain('w.loadFile(LYNX_BUNDLE_PATH, loadOptions)');
    expect(lynxSource).toContain("name === 'shellReload'");
    expect(lynxSource).toContain('setTimeout(relaunchApp, 0)');
    expect(lynxSource).toContain("name === 'shellRouteChanged'");
    expect(lynxSource).toContain(
      "...(isDev ? [{ role: 'toggleDevTools' }] : [])"
    );
  });
});
