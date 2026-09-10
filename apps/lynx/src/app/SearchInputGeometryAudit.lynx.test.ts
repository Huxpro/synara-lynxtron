import { describe, expect, it } from '@rstest/core';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = dirname(fileURLToPath(new URL('../', import.meta.url)));

function stylesheets(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return ['dist', 'generated', 'node_modules', 'output'].includes(entry.name)
        ? []
        : stylesheets(path);
    }
    return entry.isFile() && entry.name.endsWith('.css') ? [path] : [];
  });
}

describe('Native search input geometry', () => {
  it('routes every product search field through shared Input except the controlled browser address', () => {
    const cases = [
      ['../components/composer/ComposerModelControl.lynx.tsx', '<Input'],
      ['../adapters/ComposerProjectPickerCompositionElements.lynx.tsx', '<Input'],
      ['../adapters/KeyboardShortcutsSettingsCompositionElements.lynx.tsx', '<Input'],
      ['../adapters/PullRequestRouteControlsCompositionElements.lynx.tsx', '<Input'],
      ['./EditorProjectSwitchMenu.lynx.tsx', '<Input'],
      ['./DiffDock.lynx.tsx', '<Input'],
      ['./ExplorerDock.lynx.tsx', '<Input'],
      ['./PluginLibraryPage.lynx.tsx', '<Input'],
      ['../components/sidebar/SpaceProjectPickerDialog.lynx.tsx', '<Input'],
    ] as const;
    for (const [file, marker] of cases) {
      expect(readFileSync(new URL(file, import.meta.url), 'utf8'), file).toContain(marker);
    }
    const browser = readFileSync(new URL('./BrowserDockPane.lynx.tsx', import.meta.url), 'utf8');
    expect(browser).toContain('<textarea');
    expect(browser).toContain('className="BrowserDockAddress"');
    expect(browser).toContain('maxlines={1}');
  });

  it('does not attach consumer classes to the inner LxInput node', () => {
    for (const file of stylesheets(sourceRoot)) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/\.LxInput\.[A-Z][A-Za-z0-9_-]*/);
    }
  });

  it('gives the diff file filter an explicit centered 28px line box', () => {
    const source = readFileSync(new URL('./diff-dock.css', import.meta.url), 'utf8');
    expect(source).toMatch(
      /\.DiffDockReviewTreeSearchInput\s*\{[^}]*min-width:\s*0;[^}]*height:\s*28px;[^}]*flex:\s*1;[^}]*padding:\s*0;[^}]*border-width:\s*0;/s
    );
    expect(source).toMatch(
      /\.DiffDockReviewTreeSearchInput > \.LxInput\s*\{[^}]*height:\s*28px;[^}]*padding:\s*6px 0;[^}]*font-size:\s*var\(--app-font-size-ui-sm, 11px\);[^}]*line-height:\s*16px;/s
    );
  });

  it('keeps model and browser searches vertically symmetric', () => {
    const composer = readFileSync(new URL('../components/composer/composer.css', import.meta.url), 'utf8');
    const browser = readFileSync(new URL('./browser-dock-pane.css', import.meta.url), 'utf8');
    expect(composer).toMatch(
      /\.ComposerModelSearchInputLynx \.LxInput\s*\{[^}]*height:\s*28px;[^}]*padding:\s*5px 8px 5px 28px;[^}]*font-size:\s*11px;[^}]*line-height:\s*16px;/s
    );
    expect(browser).toMatch(
      /\.BrowserDockAddress\s*\{[^}]*height:\s*30px;[^}]*padding:\s*5px 9px;[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
  });

  it('keeps plugin and editor project searches on centered shared line boxes', () => {
    const plugin = readFileSync(new URL('./plugin-library-page.css', import.meta.url), 'utf8');
    const editor = readFileSync(new URL('./App.css', import.meta.url), 'utf8');
    const primitives = readFileSync(new URL('../components/ui/primitives.css', import.meta.url), 'utf8');
    expect(plugin).toMatch(
      /\.PluginLibrarySearch \.LxInputControl,[\s\S]*?\.PluginLibrarySearch \.LxInput\s*\{[^}]*height:\s*26px;/
    );
    expect(plugin).toMatch(
      /\.PluginLibrarySearch \.LxInput\s*\{[^}]*padding-top:\s*6px;[^}]*padding-bottom:\s*6px;[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(editor).toMatch(
      /\.ThreadEditorProjectSwitchSearchInput\s*\{[^}]*height:\s*28px;[^}]*padding:\s*0 8px;/s
    );
    expect(primitives).toMatch(
      /\.LxInputControl--sm > \.LxInput\s*\{[^}]*padding-top:\s*4px;[^}]*padding-bottom:\s*4px;[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s
    );
  });
});
