import { describe, expect, it, rs } from '@rstest/core';

import { createBrowserViewHost } from './browserViewProbe';

describe('macOS Browser view capability probe', () => {
  it('is a no-op outside macOS', () => {
    const requireNative = rs.fn();
    const probe = createBrowserViewHost({
      nativeViewHandle: Buffer.alloc(8),
      platform: 'linux',
      requireNative,
    });
    expect(probe.attach({ x: 0, y: 0, width: 10, height: 10 }, 'about:blank')).toBe(false);
    probe.dispose();
    expect(requireNative).not.toHaveBeenCalled();
  });

  it('attaches once with auditable right-panel bounds and disposes', async () => {
    const attach = rs.fn(() => true);
    const destroy = rs.fn();
    const setStateListener = rs.fn();
    const setCopyLinkListener = rs.fn();
    const setOpenWindowListener = rs.fn();
    const copyScreenshotToClipboard = rs.fn(async () => true);
    const newTab = rs.fn(() => true);
    const selectTab = rs.fn(() => true);
    const closeTab = rs.fn(() => true);
    const onStateChange = rs.fn();
    const handle = Buffer.alloc(8);
    const probe = createBrowserViewHost({
      nativeViewHandle: handle,
      platform: 'darwin',
      onStateChange,
      requireNative: () => ({
        attach, destroy, setBounds: rs.fn(), setVisible: rs.fn(), navigate: rs.fn(),
        newTab, selectTab, closeTab,
        goBack: rs.fn(), goForward: rs.fn(), reload: rs.fn(), getState: rs.fn(() => ({
          tabId: 'tab-1',
          supported: true, attached: true, canGoBack: false, canGoForward: false,
          isLoading: false, lastError: null, title: 'Example', faviconUrl: 'https://example.com/favicon.ico', url: 'https://example.com/',
          visible: true,
        })), copyScreenshotToClipboard, setStateListener, setCopyLinkListener,
        setOpenWindowListener,
      }),
    });
    const bounds = { x: 448, y: 92, width: 416, height: 960 };
    expect(probe.attach(bounds, 'tab-1', 'http://127.0.0.1:64812/')).toBe(true);
    expect(attach).toHaveBeenCalledWith(
      handle, 448, 92, 416, 960, 'tab-1', 'http://127.0.0.1:64812/'
    );
    expect(setStateListener).toHaveBeenCalledTimes(1);
    expect(setCopyLinkListener).toHaveBeenCalledTimes(1);
    expect(setOpenWindowListener).toHaveBeenCalledTimes(1);
    const listener = setStateListener.mock.calls[0]?.[0] as (() => void) | undefined;
    listener?.();
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ tabId: 'tab-1', title: 'Example', url: 'https://example.com/' })
    );
    await expect(probe.copyScreenshotToClipboard()).resolves.toBe(true);
    expect(probe.newTab('tab-2', 'about:blank')).toBe(true);
    expect(probe.selectTab('tab-1')).toBe(true);
    expect(probe.closeTab('tab-2')).toBe(true);
    probe.dispose();
    expect(setStateListener).toHaveBeenLastCalledWith(null);
    expect(setCopyLinkListener).toHaveBeenLastCalledWith(null);
    expect(setOpenWindowListener).toHaveBeenLastCalledWith(null);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
