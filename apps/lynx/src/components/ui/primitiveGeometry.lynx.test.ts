import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('shared primitive geometry', () => {
  const css = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');

  it('keeps icon-only buttons square across the desktop size axis', () => {
    expect(css).toMatch(/\.LxButton--icon-chip,\s*\.LxButton--icon-xs\s*\{[^}]*width:\s*24px;[^}]*min-width:\s*24px;/s);
    expect(css).toMatch(/\.LxButton--icon-sm\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;/s);
    expect(css).toMatch(/\.LxButton--icon\s*\{[^}]*width:\s*32px;[^}]*min-width:\s*32px;/s);
    expect(css).toMatch(/\.LxButton--icon-lg\s*\{[^}]*width:\s*36px;[^}]*min-width:\s*36px;/s);
    expect(css).toMatch(/\.LxButton--icon-xl\s*\{[^}]*width:\s*40px;[^}]*min-width:\s*40px;/s);
  });

  it('matches the Electron radius tokens for generic menus and dialogs', () => {
    expect(css).toMatch(/\.LxMenuPopup\s*\{[^}]*border-radius:\s*18px;/s);
    expect(css).toMatch(/\.LxDialogPopup\s*\{[^}]*border-radius:\s*22px;/s);
  });

  it('maps the shared ScrollArea orientation to the native direction property', () => {
    const source = readFileSync(new URL('./scroll-area.lynx.tsx', import.meta.url), 'utf8');
    expect(source).toContain('scroll-orientation={orientation}');
  });
});
