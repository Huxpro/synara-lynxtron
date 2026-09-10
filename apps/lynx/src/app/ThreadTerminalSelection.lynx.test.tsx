import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('ThreadTerminal native selection action', () => {
  it('uses Lynx native selection APIs and the shared terminal menu', () => {
    const source = readFileSync(
      new URL('./ThreadTerminal.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain("method: 'getSelectedText'");
    expect(source).toContain("method: 'getTextBoundingRect'");
    expect(source).toContain('buildTerminalSelectionContextMenuItems()');
    expect(source).toContain('normalizeTerminalContextText(text)');
    expect(source).toContain('selectedTerminalTextRef.current = normalizedText');
    expect(source).toContain('if (selectionMenuOpenRef.current) return');
    expect(source).toContain('enabled: text.length > 0');
    expect(source).toContain('if (text.length === 0 && selectedTerminalTextRef.current)');
    expect(source).toContain('if (requestId !== selectionRequestIdRef.current) return');
    expect(source).toContain(
      '() => restoreTerminalInputFocusAfterSelectionMenu()'
    );
    expect(source).toContain('clearTerminalSelectionOwner();');
    expect(source).toContain('selectionMenuOpenRef.current = true');
    expect(source).toContain('selectionMenuOpenRef.current = false');
    expect(source).toContain('if (selectedTerminalTextRef.current)');
    expect(source).not.toContain(').finally(() => {\n            selectionMenuOpenRef.current = false');
    expect(source).toContain("action !== 'add-to-chat'");
    expect(source).toContain('bindselectionchange={');
    expect(source).toContain('custom-context-menu={onAddTerminalContext !== undefined}');
    expect(source).toContain("onGlobalEvent('terminal:copy-selection'");
    expect(source).toContain('normalizeTerminalClipboardText(text)');
    expect(source).toContain('clipboard.writeText(clipboardText)');
    expect(source).toContain('text: normalizeTerminalClipboardText(normalizedText)');
    expect(source).toContain('restoreTerminalInputFocusAfterSelectionMenu');
    expect(source).toContain('const focusTerminalInput = () =>');
    expect(source).toContain("bridgeCall('shellSetTerminalSelectionEnabled'");
  });
});
