import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx thread terminal', () => {
  it('uses canonical PTY RPCs with snapshot refresh', () => {
    const terminalSource = readFileSync(
      new URL('./ThreadTerminal.lynx.tsx', import.meta.url),
      'utf8'
    );
    const terminalPortSource = readFileSync(
      new URL('../platform/terminal.ts', import.meta.url),
      'utf8'
    );
    const webHostSource = readFileSync(
      new URL('../main/web/web-host.ts', import.meta.url),
      'utf8'
    );
    const desktopHostSource = readFileSync(
      new URL('../main/desktop/main.ts', import.meta.url),
      'utf8'
    );
    expect(terminalSource).toContain('await platformTerminal.open({');
    expect(terminalSource).toContain('await platformTerminal.write({');
    expect(terminalSource).toContain('await closeLynxTerminalSession({');
    expect(terminalSource).toContain('close: platformTerminal.close');
    expect(terminalSource).toContain('writeExit: platformTerminal.write');
    expect(terminalSource).toContain('await refresh();');
    expect(terminalSource).toContain('await sleepOnHost(120)');
    expect(terminalSource).toContain('snapshot?.history');
    expect(terminalSource).toContain(
      'onOpenChange(false)'
    );
    expect(terminalSource).toContain(
      'autoOpenAttemptKeyRef.current = null;'
    );
    expect(
      terminalSource.match(/autoOpenAttemptKeyRef\.current = null;/g)
    ).toHaveLength(2);
    expect(terminalSource).toContain('<Input');
    expect(terminalSource).toContain('ref={commandInputRef}');
    expect(terminalSource).toContain('nativeInput');
    expect(terminalSource).toContain(
      'onInput={(value) => setCommand(value)}'
    );
    expect(terminalSource).toContain(
      "commandInputRef.current?.setValue('')"
    );
    expect(terminalSource).not.toContain('value={command}');
    expect(terminalSource).toContain('streamOutput: false');
    expect(terminalSource).toContain('readSettingsBehaviorProjection(');
    expect(terminalSource).toContain(
      'webStorage.getItem(APP_SETTINGS_STORAGE_KEY)'
    );
    expect(terminalSource).toContain("snapshot?.status === 'running'");
    expect(terminalSource).toContain('if (pending || confirmingClose) return;');
    expect(terminalSource).toContain('setConfirmingClose(true);');
    expect(terminalSource).toContain('setConfirmingClose(false);');
    expect(terminalSource).toContain('confirmTerminalTabClose({');
    expect(terminalSource).toContain('confirmationEnabled');
    expect(terminalSource).toContain('resolveLynxTerminalTypography({');
    expect(terminalSource).toContain(
      '<text className="ThreadTerminalOutput" style={typography}>'
    );
    expect(terminalSource).toContain('style={typography}');
    expect(terminalPortSource).toContain("'runtimeGetSynaraWsUrl'");
    expect(terminalPortSource).toContain(
      "bridgeCall('terminalOpen', await withTerminalRuntimeEndpoint(input))"
    );
    expect(terminalPortSource).toContain(
      "await withTerminalRuntimeEndpoint(input)"
    );
    expect(webHostSource).toContain("if (method === 'terminalOpen')");
    expect(webHostSource).toContain("'terminal.open'");
    expect(webHostSource).toContain("if (method === 'terminalWrite')");
    expect(webHostSource).toContain("'terminal.write'");
    expect(webHostSource).toContain("if (method === 'terminalClose')");
    expect(webHostSource).toContain("'terminal.close'");
    expect(desktopHostSource).toContain("name === 'terminalOpen'");
    expect(desktopHostSource).toContain("name === 'terminalWrite'");
    expect(desktopHostSource).toContain("name === 'terminalClose'");
  });

  it('is wired into the thread header and page body', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );
    expect(routerSource).toContain("import { ThreadTerminal }");
    expect(routerSource).toContain(
      'const [terminalOpen, setTerminalOpen] = useState(initialTerminalOpen)'
    );
    expect(routerSource).toContain('setTerminalOpen((open) => !open)');
    expect(routerSource).toContain('<ThreadTerminal\n          autoOpen');
    expect(routerSource).toContain(
      'fontFamily={appearance.terminalFontFamily}'
    );
    expect(routerSource).toContain(
      'fontSizePx={appearance.terminalFontSizePx}'
    );
    expect(routerSource).toContain('workspaceRoot={currentThread.workspaceRoot}');
  });

  it('applies the same appearance projection to workspace terminals', () => {
    const workspaceSource = readFileSync(
      new URL('./WorkspacePage.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(workspaceSource).toContain(
      'fontFamily={appearance.terminalFontFamily}'
    );
    expect(workspaceSource).toContain(
      'fontSizePx={appearance.terminalFontSizePx}'
    );
  });
});
