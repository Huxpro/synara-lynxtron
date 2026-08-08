import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';
import { beforeEach, describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { SidebarDisclosure } from './SidebarDisclosure.lynx';
import { webStorage } from '../platform/storage';

describe('Lynx sidebar disclosure', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'NativeModules', {
      configurable: true,
      value: {
        bridge: {
          call: (
            method: string,
            _params: Record<string, unknown>,
            callback: (reply: string) => void
          ) => {
            callback(
              JSON.stringify(
                method === 'windowGetViewport'
                  ? { width: 1280, height: 820 }
                  : method === 'storageDump'
                    ? { entries: {} }
                    : { ok: true }
              )
            );
          },
        },
      },
    });
    webStorage.clear();
  });

  it('publishes an interactive open shell with the shared sidebar width', () => {
    render(
      <SidebarDisclosure open>
        <view className="SidebarContent" />
      </SidebarDisclosure>
    );

    const shell = elementTree.root?.querySelector('.SidebarDisclosure');
    expect(shell?.getAttribute('class')).toContain('SidebarDisclosure--open');
    expect(shell?.getAttribute('aria-hidden')).toBe('false');
    expect(shell?.getAttribute('accessibility-elements-hidden')).toBe('false');
  });

  it('uses the shared 220ms disclosure duration, resize seam, and reduced-motion fallback', () => {
    const styles = readFileSync(
      new URL('./sidebar-disclosure.css', import.meta.url),
      'utf8'
    );
    const source = readFileSync(
      new URL('./SidebarDisclosure.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('useLynxDisclosurePresence(props.open)');
    expect(source).toContain(
      '<LynxInteractionScope disabled={!interactive}>'
    );
    expect(source).toContain(
      'accessibility-elements-hidden={!interactive}'
    );
    expect(source).toContain('THREAD_SIDEBAR_WIDTH_STORAGE_KEY');
    expect(source).toContain('className="SidebarResizeOverlay"');
    expect(source).toContain('accessibility-label="Resize Sidebar"');
    expect(styles).toMatch(
      /\.SidebarDisclosure\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*visible;[^}]*transition-duration:\s*220ms;/s
    );
    expect(styles).toMatch(
      /\.SidebarDisclosureInner\s*\{[^}]*overflow:\s*hidden;/s
    );
    expect(styles).toMatch(
      /\.SidebarDisclosure--closed\s*\{[^}]*width:\s*0;[^}]*pointer-events:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SidebarDisclosure--closed \.SidebarDisclosureInner\s*\{[^}]*transform:\s*translateX\(-100%\);/s
    );
    expect(styles).toMatch(
      /\.SidebarResizeSash\s*\{[^}]*right:\s*-3px;[^}]*width:\s*10px;[^}]*background-color:\s*rgba\(128,\s*128,\s*128,\s*0\.02\);[^}]*cursor:\s*col-resize;/s
    );
    expect(styles).toMatch(
      /\.SidebarResizeSashLine\s*\{[^}]*left:\s*3px;[^}]*width:\s*1px;[^}]*height:\s*100%;[^}]*background-color:\s*transparent;/s
    );
    expect(styles).toMatch(
      /\.SidebarResizeOverlay\s*\{[^}]*position:\s*fixed;[^}]*width:\s*100vw;[^}]*height:\s*100vh;[^}]*cursor:\s*col-resize;/s
    );
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*transition-duration:\s*0\.01ms;/s
    );
  });

  it('resizes through the rendered sash and persists the shared width', async () => {
    const { rerender } = render(
      <SidebarDisclosure open>
        <view className="SidebarContent" />
      </SidebarDisclosure>
    );
    const shell = elementTree.root?.querySelector('.SidebarDisclosure');
    const sash = elementTree.root?.querySelector('.SidebarResizeSash');
    expect(shell?.getAttribute('style')).toContain('width: 256px');
    expect(sash).not.toBeNull();

    fireEvent(
      sash!,
      new CustomEvent('bindEvent:mousedown', {
        bubbles: true,
        detail: { button: 0, buttons: 1, clientX: 256 },
      })
    );
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector('.SidebarResizeOverlay')
      ).not.toBeNull()
    );
    const overlay = elementTree.root?.querySelector('.SidebarResizeOverlay');
    fireEvent(
      overlay!,
      new CustomEvent('bindEvent:mousemove', {
        bubbles: true,
        detail: { buttons: 1, clientX: 320 },
      })
    );
    await waitFor(() =>
      expect(shell?.getAttribute('style')).toContain('width: 320px')
    );
    fireEvent(
      overlay!,
      new CustomEvent('bindEvent:mouseup', { bubbles: true })
    );
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector('.SidebarResizeOverlay')
      ).toBeNull()
    );
    expect(webStorage.getItem('chat_thread_sidebar_width')).toBe('320');

    rerender(
      <SidebarDisclosure open={false}>
        <view className="SidebarContent" />
      </SidebarDisclosure>
    );
    await waitFor(() =>
      expect(shell?.getAttribute('class')).toContain(
        'SidebarDisclosure--closed'
      )
    );
    rerender(
      <SidebarDisclosure open>
        <view className="SidebarContent" />
      </SidebarDisclosure>
    );
    await waitFor(() => {
      expect(shell?.getAttribute('class')).toContain(
        'SidebarDisclosure--open'
      );
      expect(shell?.getAttribute('style')).toContain('width: 320px');
    });
  });

  it('is the single owner for ordinary and Settings sidebars', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const sidebarStyles = readFileSync(
      new URL('../components/sidebar/sidebar.css', import.meta.url),
      'utf8'
    );
    const appStyles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );

    expect(routerSource).toContain('<SidebarDisclosure open={sidebarOpen}>');
    expect(settingsSource).toContain('<SidebarDisclosure open={sidebarOpen}>');
    expect(sidebarStyles).toMatch(/\.AppSidebar\s*\{[^}]*width:\s*100%;/s);
    expect(appStyles).toMatch(/\.SettingsSidebar\s*\{[^}]*width:\s*100%;/s);
  });
});
