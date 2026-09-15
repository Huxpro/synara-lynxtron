import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('ThreadTerminalSearchBar', () => {
  it('keeps the production search control reusable and vertically centered', () => {
    const source = readFileSync(new URL('./ThreadTerminal.lynx.tsx', import.meta.url), 'utf8');
    const styles = readFileSync(new URL('./thread-terminal.css', import.meta.url), 'utf8');
    const lab = readFileSync(new URL('./ComponentsLabStoryRenderer.lynx.tsx', import.meta.url), 'utf8');

    expect(source).toContain('export function ThreadTerminalSearchBar');
    expect(source).toContain('placeholder="Find"');
    expect(source).toContain('label="Previous match (Shift+Enter)"');
    expect(source).toContain('label="Next match (Enter)"');
    expect(source).toContain('label="Close search (Esc)"');
    expect(source).toContain('<ChevronDownIcon');
    expect(source).toContain('<XIcon');
    expect(source).toContain("semanticIconColor('secondary')");
    expect(source).not.toContain('text="↑"');
    expect(source).not.toContain('text="↓"');
    expect(source).not.toContain('text="×"');
    expect(styles).toContain('.ThreadTerminalSearchButtonIcon--previous');
    expect(styles).toMatch(
      /\.ThreadTerminalSearchButtonIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s
    );
    expect(styles).toMatch(
      /\.ThreadTerminalSearchButtonIcon--previous\s*\{[^}]*transform:\s*rotate\(180deg\);/s
    );
    expect(styles).toMatch(
      /\.ThreadTerminalSearch\s*\{[^}]*align-items:\s*center;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--color-border-light\);[^}]*border-right-color:\s*var\(--color-border-light\);[^}]*border-top-color:\s*var\(--color-border-light\);[^}]*border-bottom-color:\s*var\(--color-border-light\);/s
    );
    expect(styles).toMatch(/\.ThreadTerminalSearchInput\s*\{[^}]*height:\s*24px;[^}]*line-height:\s*24px;/s);
    expect(lab).toContain('<ThreadTerminalSearchBar');
  });
});
