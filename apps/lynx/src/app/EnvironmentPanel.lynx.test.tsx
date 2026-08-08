import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Environment panel', () => {
  it('connects the real thread header toggle and mounted panel', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );
    const panelSource = readFileSync(
      new URL('./EnvironmentPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(routerSource).toContain('<EnvironmentToggle');
    expect(routerSource).toContain('<EnvironmentPanel');
    expect(routerSource).toContain('className="ThreadHeaderControls"');
    expect(routerSource).toContain('ThreadPage--environment-open');
    expect(panelSource).toContain('useLynxInteractiveState({');
    expect(panelSource).toContain('Toggle environment panel');
    expect(panelSource).toContain("import windowSvg from '@synara-central-icons/window.svg?raw'");
  });

  it('uses only sections backed by real current capabilities', () => {
    const panelSource = readFileSync(
      new URL('./EnvironmentPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(panelSource).toContain('fetchAllProviderUsage({})');
    expect(panelSource).toContain('fetchLocalServers()');
    expect(panelSource).toContain('stopLocalServer({');
    expect(panelSource).toContain('localServerPrimaryLabel(server)');
    expect(panelSource).toContain('localServerAddressLabel(server)');
    expect(panelSource).toContain("type: 'thread.meta.update'");
    expect(panelSource).toContain('THREAD_NOTES_MAX_CHARS');
    expect(panelSource).toContain('EnvironmentNotepadInput');
    expect(panelSource).not.toContain('Changes');
    expect(panelSource).not.toContain('GitHub');
    expect(panelSource).not.toContain('Open in editor');
  });

  it('matches the Web overlay footprint and row rhythm', () => {
    const styles = readFileSync(
      new URL('./environment-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.ThreadHeaderControls\s*\{[^}]*-x-app-region:\s*no-drag;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentToggle\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*height:\s*28px;[^}]*box-sizing:\s*border-box;[^}]*padding:\s*0;[^}]*-x-app-region:\s*no-drag;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentOverlay\s*\{[^}]*right:\s*0;[^}]*padding:\s*12px;[^}]*transition:[^}]*220ms ease-out/s
    );
    expect(styles).toMatch(
      /\.EnvironmentSurface\s*\{[^}]*width:\s*288px;[^}]*border-radius:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentContent\s*\{[^}]*gap:\s*2px;[^}]*padding:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentRow\s*\{[^}]*min-height:\s*26px;[^}]*padding:\s*4px 8px;[^}]*gap:\s*8px;/s
    );
    expect(styles).toContain('padding-right: 312px;');
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentLocalServersPopup\s*\{[^}]*width:\s*288px;[^}]*padding:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentLocalServerStop\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;[^}]*padding:\s*0;/s
    );
  });
});
