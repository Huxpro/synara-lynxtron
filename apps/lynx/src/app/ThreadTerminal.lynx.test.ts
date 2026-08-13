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
    expect(terminalSource).toContain('await platformTerminal.close({');
    expect(terminalSource).toContain('await refresh();');
    expect(terminalSource).toContain('await sleepOnHost(120)');
    expect(terminalSource).toContain('snapshot?.history');
    expect(terminalSource).toContain(
      'onOpenChange(false)'
    );
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
    expect(terminalPortSource).toContain("bridgeCall('terminalOpen', input)");
    expect(terminalPortSource).toContain("bridgeCall('terminalWrite', input)");
    expect(terminalPortSource).toContain("bridgeCall('terminalClose', input)");
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
    expect(routerSource).toContain('<ThreadTerminal');
    expect(routerSource).toContain('workspaceRoot={currentThread.workspaceRoot}');
  });
});
