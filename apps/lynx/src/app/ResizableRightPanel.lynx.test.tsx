import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';
import { beforeEach, describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import { webStorage } from '../platform/storage';

describe('Lynx resizable right panels', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'NativeModules', {
      configurable: true,
      value: {
        bridge: {
          call: (
            method: string,
            _params: Record<string, unknown>,
            callback: (reply: string) => void
          ) =>
            callback(
              JSON.stringify(
                method === 'windowGetViewport'
                  ? { width: 1280, height: 820 }
                  : method === 'storageDump'
                    ? { entries: {} }
                    : { ok: true }
              )
            ),
        },
      },
    });
    webStorage.clear();
  });

  it('drags from the left edge and persists a consumer-owned width', async () => {
    render(
      <ResizableRightPanel
        availableWidth={1280}
        className="PanelProbe"
        defaultWidth={640}
        maxWidth={720}
        minimumMainWidth={320}
        minWidth={320}
        resizable
        storageKey="panel_probe_width"
      >
        <view className="PanelContent" />
      </ResizableRightPanel>
    );

    const panel = elementTree.root?.querySelector('.PanelProbe');
    const sash = elementTree.root?.querySelector('.RightPanelResizeSash');
    expect(panel?.getAttribute('style')).toContain('width: 640px');
    fireEvent(
      sash!,
      new CustomEvent('bindEvent:mousedown', {
        bubbles: true,
        detail: { button: 0, buttons: 1, clientX: 640 },
      })
    );
    const overlay = await waitFor(() => {
      const current = elementTree.root?.querySelector(
        '.RightPanelResizeOverlay'
      );
      expect(current).not.toBeNull();
      return current!;
    });
    fireEvent(
      overlay,
      new CustomEvent('bindEvent:mousemove', {
        bubbles: true,
        detail: { buttons: 1, clientX: 560 },
      })
    );
    await waitFor(() =>
      expect(panel?.getAttribute('style')).toContain('width: 720px')
    );
    fireEvent(
      overlay,
      new CustomEvent('bindEvent:mouseup', { bubbles: true })
    );
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector('.RightPanelResizeOverlay')
      ).toBeNull()
    );
    expect(webStorage.getItem('panel_probe_width')).toBe('720');
  });

  it('wires both right-panel consumers without overriding narrow master-detail', () => {
    const diffSource = readFileSync(
      new URL('./DiffDock.lynx.tsx', import.meta.url),
      'utf8'
    );
    const prSource = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');

    expect(diffSource).toContain('<ResizableRightPanel');
    expect(diffSource).toContain('maxWidth={720}');
    expect(diffSource).not.toContain(
      'storageKey="chat_right_panel_width:working-tree"'
    );
    expect(prSource).toContain('<ResizableRightPanel');
    expect(prSource).not.toContain(
      'storageKey="pull_requests_detail_panel_width"'
    );
    expect(prSource).toContain('minWidth={416}');
    expect(styles).toMatch(
      /\.SliceRoot--viewport-medium\s+\.SharedPrRouteBody--detail-open\s+\.SharedPrDetailDock\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s
    );
  });
});
