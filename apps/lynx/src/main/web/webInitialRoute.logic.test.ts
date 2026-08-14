import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { resolveWebInitialRoute } from './webInitialRoute.logic';

describe('Lynx-for-Web initial route harness', () => {
  it('accepts only known internal product routes', () => {
    expect(resolveWebInitialRoute('?route=%2Fpull-requests')).toBe(
      '/pull-requests'
    );
    expect(resolveWebInitialRoute('?route=%2Fautomations')).toBe(
      '/automations'
    );
    expect(resolveWebInitialRoute('?route=%2Fplugins')).toBe('/plugins');
    expect(
      resolveWebInitialRoute('?route=%2Fautomations%2Fautomation%253A1')
    ).toBe('/automations/automation%3A1');
    expect(resolveWebInitialRoute('?route=%2Fsettings%2Fappearance')).toBe(
      '/settings/appearance'
    );
    expect(resolveWebInitialRoute('?route=%2Fthread%2Fthread-1')).toBe(
      '/thread/thread-1'
    );
    expect(resolveWebInitialRoute('?route=%2Fworkspace')).toBe('/workspace');
    expect(resolveWebInitialRoute('?route=%2Fworkspace%2Fworkspace-1')).toBe(
      '/workspace/workspace-1'
    );
    expect(resolveWebInitialRoute('?route=https%3A%2F%2Fexample.com')).toBeNull();
    expect(resolveWebInitialRoute('?route=%2Funknown')).toBeNull();
  });

  it('stays isolated to the Web host entry', () => {
    const hostSource = readFileSync(
      new URL('./web-host.ts', import.meta.url),
      'utf8'
    );
    const desktopSource = readFileSync(
      new URL('../desktop/main.ts', import.meta.url),
      'utf8'
    );

    expect(hostSource).toContain(
      "resolveWebInitialRoute(globalThis.location.search)"
    );
    expect(
      hostSource.indexOf(
        "pendingInitialRoute = resolveWebInitialRoute(globalThis.location.search)"
      )
    ).toBeLessThan(hostSource.indexOf('webDocument.body.innerHTML = `'));
    expect(hostSource).toContain("init-data='${JSON.stringify({");
    expect(hostSource).toContain('initialRoute: pendingInitialRoute,');
    expect(hostSource).toContain("get('temporary') === 'open'");
    expect(hostSource).toContain('initialTemporaryOpen,');
    expect(hostSource).toContain("get('editor') === 'open'");
    expect(hostSource).toContain('initialEditorOpen,');
    expect(hostSource).toContain("get('terminal') === 'open'");
    expect(hostSource).toContain('initialTerminalOpen,');
    expect(hostSource).toContain("if (method === 'shellRendererReady')");
    expect(hostSource).toContain('return { ok: true, route }');
    expect(hostSource).not.toContain(
      "lynxView.sendGlobalEvent?.('shell:navigate', [route])"
    );
    expect(hostSource).not.toContain(
      "lynxView.addEventListener('load', publishInitialRoute"
    );
    expect(desktopSource).not.toContain('resolveWebInitialRoute');
  });
});
