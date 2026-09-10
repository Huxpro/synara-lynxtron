import { describe, expect, it, rs } from '@rstest/core';

import {
  createSearchKeyMonitor,
  terminalInputDataForSearchKeyEvent,
} from './searchKeyMonitor';
import { readFileSync } from 'node:fs';

describe('macOS search key monitor lifecycle', () => {
  it('owns one native monitor only while search navigation is enabled', () => {
    const start = rs.fn();
    const stop = rs.fn();
    const setComposerBounds = rs.fn();
    const requireNative = rs.fn(() => ({ start, stop, setComposerBounds }));
    const handle = Buffer.alloc(8);
    const onKey = rs.fn();
    const monitor = createSearchKeyMonitor({
      nativeViewHandle: handle,
      onKey,
      platform: 'darwin',
      requireNative,
    });

    monitor.setMode('search');
    monitor.setMode('search');
    expect(requireNative).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith(handle, onKey, false);
    monitor.setComposerBounds({ x: 1, y: 2, width: 3, height: 4 });
    expect(setComposerBounds).toHaveBeenCalledWith(1, 2, 3, 4);

    monitor.setMode('disabled');
    monitor.setMode('disabled');
    expect(stop).toHaveBeenCalledTimes(1);

    monitor.setMode('terminal');
    expect(start).toHaveBeenLastCalledWith(handle, onKey, true);
    monitor.dispose();
    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it('does not load a macOS binding on other platforms', () => {
    const requireNative = rs.fn();
    const monitor = createSearchKeyMonitor({
      nativeViewHandle: Buffer.alloc(8),
      onKey: () => {},
      platform: 'linux',
      requireNative,
    });

    monitor.setMode('search');
    monitor.dispose();
    expect(requireNative).not.toHaveBeenCalled();
  });

  it('replaces the active native monitor when its mode changes', () => {
    const start = rs.fn();
    const stop = rs.fn();
    const monitor = createSearchKeyMonitor({
      nativeViewHandle: Buffer.alloc(8),
      onKey: () => {},
      platform: 'darwin',
      requireNative: () => ({ start, stop, setComposerBounds() {} }),
    });

    monitor.setMode('search');
    monitor.setMode('terminal');

    expect(stop).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenNthCalledWith(1, expect.any(Buffer), expect.any(Function), false);
    expect(start).toHaveBeenNthCalledWith(2, expect.any(Buffer), expect.any(Function), true);
  });

  it('maps every terminal monitor key to its exact PTY bytes', () => {
    const bytes = (key: Parameters<typeof terminalInputDataForSearchKeyEvent>[0]['key']) =>
      terminalInputDataForSearchKeyEvent({ key, shiftKey: false });

    expect(bytes('Enter')).toBe('\r');
    expect(bytes('ArrowUp')).toBe('\u001b[A');
    expect(bytes('ArrowDown')).toBe('\u001b[B');
    expect(bytes('ArrowLeft')).toBe('\u001b[D');
    expect(bytes('ArrowRight')).toBe('\u001b[C');
    expect(bytes('Tab')).toBe('\t');
    expect(bytes('Escape')).toBe('\u001b');
    expect(bytes('ControlC')).toBe('\u0003');
    expect(bytes('ControlL')).toBe('\u000c');
    expect(bytes('a')).toBe('a');
    expect(bytes('中')).toBe('中');
  });

  it('leaves printable text and IME ownership with the focused Native textarea', () => {
    const nativeSource = readFileSync(
      new URL('../../../native/search-key-monitor.mm', import.meta.url),
      'utf8'
    );

    expect(nativeSource).not.toContain(
      'terminal_mode && !control && !command &&'
    );
    expect(nativeSource).toContain(
      'terminal_mode && command && event.keyCode == 3'
    );
    expect(nativeSource).toContain('terminal_mode && command && event.keyCode == 15');
    expect(nativeSource).toContain('? "ForceReload"');
    expect(nativeSource).toContain(': "Reload"');
    expect(nativeSource).not.toContain('NSString* characters = event.characters;');
    expect(nativeSource).toContain('CGRectContainsPoint(g_composer_bounds');
    expect(nativeSource).toContain('KeyEventPayload{"FocusComposer", false}');
    expect(nativeSource).toContain(
      'Consume only clicks inside the reported Composer editor'
    );
    expect(nativeSource).toContain('return nil;');
  });
});
