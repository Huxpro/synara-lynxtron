import { describe, expect, it } from '@rstest/core';

import {
  INITIAL_SHELL_ROUTE_DELIVERY_STATE,
  buildSearchNavigationMenuItems,
  dispatchRendererGlobalEvent,
  SEARCH_NAVIGATION_ACCELERATORS,
  parseSynaraDeepLink,
  parseSynaraDeepLinkInitData,
  parseViewportProbeSequence,
  parseWindowState,
  reduceShellRouteDelivery,
  resolveNativeRendererCommand,
  resolveRestoredBounds,
  resolveShellUserDataDir,
  resolveShellWindowPresentation,
  shouldAcquireShellSingleInstanceLock,
} from './shellRuntime';

describe('shellRuntime', () => {
  it('parses only explicit viewport probe sizes and honors desktop minima', () => {
    expect(parseViewportProbeSequence(undefined)).toEqual([]);
    expect(
      parseViewportProbeSequence('900x650, invalid, 1024x700,640x480')
    ).toEqual([
      { width: 900, height: 650 },
      { width: 1024, height: 700 },
      { width: 900, height: 650 },
    ]);
  });

  it('uses only an explicit absolute state-directory override', () => {
    expect(resolveShellUserDataDir('/default/user-data', undefined)).toBe(
      '/default/user-data'
    );
    expect(
      resolveShellUserDataDir('/default/user-data', '  /tmp/synara-owned  ')
    ).toBe('/tmp/synara-owned');
    expect(() =>
      resolveShellUserDataDir('/default/user-data', './relative')
    ).toThrow('SYNARA_LYNX_USER_DATA_DIR must be an absolute path.');
  });

  it('rejects malformed or undersized window state', () => {
    expect(parseWindowState('{}')).toBeNull();
    expect(
      parseWindowState(
        JSON.stringify({
          version: 1,
          bounds: { x: 0, y: 0, width: 200, height: 200 },
          maximized: false,
          fullscreen: false,
        })
      )
    ).toBeNull();
  });

  it('centers an off-screen window in the current work area', () => {
    expect(
      resolveRestoredBounds(
        { x: 9000, y: 9000, width: 1200, height: 800 },
        { x: 0, y: 0, width: 1600, height: 1000 }
      )
    ).toEqual({ x: 200, y: 100, width: 1200, height: 800 });
  });

  it('maps supported deep links to memory-history routes', () => {
    expect(parseSynaraDeepLink('synara://threads')).toBe('/');
    expect(parseSynaraDeepLink('synara://settings')).toBe('/settings');
    expect(parseSynaraDeepLink('synara://settings/appearance')).toBe(
      '/settings/appearance'
    );
    expect(parseSynaraDeepLink('synara://studio')).toBe('/studio');
    expect(parseSynaraDeepLink('synara://update')).toBe('/update');
    expect(parseSynaraDeepLink('synara://pull-requests')).toBe('/pull-requests');
    expect(parseSynaraDeepLink('synara://plugins')).toBe('/plugins');
    expect(parseSynaraDeepLink('synara://automations')).toBe('/automations');
    expect(
      parseSynaraDeepLink('synara://automations/automation%3Aone')
    ).toBe('/automations/automation%3Aone');
    expect(parseSynaraDeepLink('synara://kanban')).toBe('/kanban');
    expect(parseSynaraDeepLink('synara://kanban/project%20one')).toBe(
      '/kanban/project%20one'
    );
    expect(parseSynaraDeepLink('synara://workspace')).toBe('/workspace');
    expect(parseSynaraDeepLink('synara://workspace/workspace%20one')).toBe(
      '/workspace/workspace%20one'
    );
    expect(parseSynaraDeepLink('synara://new-thread/project%20one')).toBe(
      '/new-thread/project%20one'
    );
    expect(parseSynaraDeepLink('synara://new-thread')).toBeNull();
    expect(parseSynaraDeepLink('synara://thread/abc-123')).toBe('/thread/abc-123');
    expect(parseSynaraDeepLink('synara://fidelity-reference')).toBe('/');
    expect(parseSynaraDeepLink('https://example.com')).toBeNull();
  });

  it('preserves supported startup surface state from desktop deep links', () => {
    expect(
      parseSynaraDeepLinkInitData(
        'synara://thread/abc-123?environment=open&editor=open&editorMode=diff&editorChat=hidden&editorHistory=open&editorNew=open&editorNewChat=open&editorSearch=open&rename=open&terminal=open&workspaceSettings=open&workspaceVisible=open&explorer=open&explorerPath=reports%2Fpreview.pdf&explorerQuery=report&explorerCommentLine=7&explorerExpanded=reports&explorerExpanded=reports%2F2026&explorerWidth=520'
      )
    ).toEqual({
      initialEnvironmentOpen: true,
      initialEditorOpen: true,
      initialEditorCenterMode: 'diff',
      initialEditorChatOpen: false,
      initialEditorHistoryOpen: true,
      initialEditorNewOpen: true,
      initialEditorNewChatOpen: true,
      initialEditorSearchOpen: true,
      initialRenameOpen: true,
      initialTerminalOpen: true,
      initialWorkspaceSettingsOpen: true,
      initialWorkspaceVisible: true,
      initialExplorerOpen: true,
      initialExplorerCommentLine: 7,
      initialExplorerExpandedDirectories: ['reports', 'reports/2026'],
      initialExplorerPath: 'reports/preview.pdf',
      initialExplorerQuery: 'report',
      initialExplorerWidth: 520,
      initialRoute: '/thread/abc-123',
    });
    expect(
      parseSynaraDeepLinkInitData(
        'synara://workspace/workspace-one?workspaceSettings=open&workspaceVisible=open'
      )
    ).toMatchObject({
      initialRoute: '/workspace/workspace-one',
      initialWorkspaceSettingsOpen: true,
      initialWorkspaceVisible: true,
    });
    expect(
      parseSynaraDeepLinkInitData(
        'synara://thread/abc-123?explorerCommentLine=0&explorerWidth=invalid'
      )
    ).toMatchObject({
      initialExplorerCommentLine: null,
      initialExplorerWidth: null,
    });
  });

  it('queues the latest startup route until the renderer announces readiness', () => {
    const first = reduceShellRouteDelivery(
      INITIAL_SHELL_ROUTE_DELIVERY_STATE,
      { type: 'route-requested', route: '/kanban' }
    );
    expect(first.routeToDispatch).toBeNull();

    const latest = reduceShellRouteDelivery(first.state, {
      type: 'route-requested',
      route: '/settings',
    });
    expect(latest.routeToDispatch).toBeNull();

    const ready = reduceShellRouteDelivery(latest.state, {
      type: 'renderer-ready',
    });
    expect(ready.routeToDispatch).toBe('/settings');
    expect(ready.state).toEqual({ rendererReady: true, pendingRoute: null });

    const immediate = reduceShellRouteDelivery(ready.state, {
      type: 'route-requested',
      route: '/pull-requests',
    });
    expect(immediate.routeToDispatch).toBe('/pull-requests');
  });

  it('retains a pending route when the renderer resets before it is ready', () => {
    const queued = reduceShellRouteDelivery(
      INITIAL_SHELL_ROUTE_DELIVERY_STATE,
      { type: 'route-requested', route: '/settings' }
    );
    const reset = reduceShellRouteDelivery(queued.state, {
      type: 'renderer-reset',
    });
    expect(reset).toEqual({
      state: { rendererReady: false, pendingRoute: '/settings' },
      routeToDispatch: null,
    });
  });

  it('uses canonical keybinding command ids for every Native renderer shortcut', () => {
    expect(resolveNativeRendererCommand('chat.new')).toBe('chat.new');
    expect(resolveNativeRendererCommand('sidebar.toggle')).toBe(
      'sidebar.toggle'
    );
    expect(resolveNativeRendererCommand('sidebar.search')).toBe(
      'sidebar.search'
    );
    expect(resolveNativeRendererCommand('chat.visible.previous')).toBe(
      'chat.visible.previous'
    );
    expect(resolveNativeRendererCommand('chat.visible.next')).toBe(
      'chat.visible.next'
    );
    expect(resolveNativeRendererCommand('composer.focus.toggle')).toBe(
      'composer.focus.toggle'
    );
    expect(resolveNativeRendererCommand('terminal.toggle')).toBeNull();
  });

  it('delivers renderer events without activating the native window', () => {
    const calls: unknown[][] = [];
    const target = {
      sendGlobalEvent: (...args: unknown[]) => calls.push(args),
      show: () => {
        throw new Error('renderer event delivery must not show the window');
      },
      focus: () => {
        throw new Error('renderer event delivery must not focus the window');
      },
    };

    dispatchRendererGlobalEvent(target, 'shell:command', 'sidebar.search');

    expect(calls).toEqual([['shell:command', 'sidebar.search']]);
  });

  it('keeps background verification windows inactive while making them capturable', () => {
    expect(resolveShellWindowPresentation(true)).toEqual({
      showOnCreate: false,
      showAfterSetup: false,
      showInactiveAfterSetup: true,
    });
    expect(resolveShellWindowPresentation(false)).toEqual({
      showOnCreate: true,
      showAfterSetup: true,
      showInactiveAfterSetup: false,
    });
  });

  it('only bypasses the application lock for the explicit validation override', () => {
    expect(shouldAcquireShellSingleInstanceLock(undefined)).toBe(true);
    expect(shouldAcquireShellSingleInstanceLock('0')).toBe(true);
    expect(shouldAcquireShellSingleInstanceLock('1')).toBe(false);
  });

  it('maps the complete Search navigation set to native menu accelerators', () => {
    expect(SEARCH_NAVIGATION_ACCELERATORS).toEqual([
      { accelerator: 'Up', key: 'ArrowUp' },
      { accelerator: 'Down', key: 'ArrowDown' },
      { accelerator: 'Tab', key: 'Tab' },
      { accelerator: 'Shift+Tab', key: 'Tab', shiftKey: true },
      { accelerator: 'Esc', key: 'Escape' },
    ]);
  });

  it('registers hidden Search accelerators only while the palette is open', () => {
    expect(buildSearchNavigationMenuItems(false, () => {})).toEqual([]);
    const events: unknown[] = [];
    const items = buildSearchNavigationMenuItems(true, (event) =>
      events.push(event)
    );

    expect(items.map(({ accelerator }) => accelerator)).toEqual([
      'Up',
      'Down',
      'Tab',
      'Shift+Tab',
      'Esc',
    ]);
    expect(
      items.every(
        (item) =>
          item.visible === false &&
          item.acceleratorWorksWhenHidden === true &&
          item.registerAccelerator === true
      )
    ).toBe(true);
    items[3]?.click();
    expect(events).toEqual([{ key: 'Tab', shiftKey: true }]);
  });
});
