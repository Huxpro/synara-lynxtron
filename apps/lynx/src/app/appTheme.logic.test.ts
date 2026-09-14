import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';
import { DEFAULT_THEME_STATE } from '@synara-web/theme/theme.logic';

import {
  resolveSliceCodeFontFamily,
  resolveSliceUiFontFamily,
  resolveSliceThemeVariables,
  resolveSliceThemeVariant,
  sliceThemeClassName,
} from './appTheme.logic';

describe('slice root theme projection', () => {
  it('preserves explicit canonical light and dark modes', () => {
    expect(resolveSliceThemeVariant({ mode: 'light' })).toBe('light');
    expect(resolveSliceThemeVariant({ mode: 'dark' })).toBe('dark');
    expect(sliceThemeClassName({ mode: 'dark' })).toBe(
      'SliceRoot--theme-dark'
    );
  });

  it('uses the host appearance signal for system mode', () => {
    expect(resolveSliceThemeVariant({ mode: 'system' })).toBe('light');
    expect(resolveSliceThemeVariant({ mode: 'system' }, true)).toBe('dark');
    expect(sliceThemeClassName({ mode: 'system' })).toBe(
      'SliceRoot--theme-light'
    );
    expect(sliceThemeClassName({ mode: 'system' }, true)).toBe(
      'SliceRoot--theme-dark'
    );
  });

  it('uses the system stack when requested and the active theme font otherwise', () => {
    expect(resolveSliceUiFontFamily(DEFAULT_THEME_STATE)).toBe('system-ui');

    const customState = {
      ...DEFAULT_THEME_STATE,
      systemUiFont: false,
      chromeThemes: {
        ...DEFAULT_THEME_STATE.chromeThemes,
        light: {
          ...DEFAULT_THEME_STATE.chromeThemes.light,
          fonts: {
            ...DEFAULT_THEME_STATE.chromeThemes.light.fonts,
            ui: 'IBM Plex Sans',
          },
        },
        dark: {
          ...DEFAULT_THEME_STATE.chromeThemes.dark,
          fonts: {
            ...DEFAULT_THEME_STATE.chromeThemes.dark.fonts,
            ui: 'Inter',
          },
        },
      },
    };

    expect(resolveSliceUiFontFamily(customState, false)).toBe(
      '"IBM Plex Sans"'
    );
    expect(resolveSliceUiFontFamily(customState, true)).toBe('Inter');
    expect(
      resolveSliceUiFontFamily({
        ...customState,
        chromeThemes: {
          ...customState.chromeThemes,
          light: {
            ...customState.chromeThemes.light,
            fonts: { ...customState.chromeThemes.light.fonts, ui: null },
          },
        },
      })
    ).toBe('system-ui');
  });

  it('projects a concrete monospace stack instead of a nested CSS variable', () => {
    expect(resolveSliceCodeFontFamily(DEFAULT_THEME_STATE)).toContain(
      '"JetBrains Mono Variable"'
    );
    const variables = resolveSliceThemeVariables(DEFAULT_THEME_STATE);
    expect(variables['--font-chat-code-family']).toBe(
      variables['--font-mono-family']
    );
    expect(variables['--font-chat-code-family']).toContain('monospace');
    expect(variables['--font-chat-code-family']).not.toContain('var(');

    const customState = {
      ...DEFAULT_THEME_STATE,
      chromeThemes: {
        ...DEFAULT_THEME_STATE.chromeThemes,
        light: {
          ...DEFAULT_THEME_STATE.chromeThemes.light,
          fonts: {
            ...DEFAULT_THEME_STATE.chromeThemes.light.fonts,
            code: 'Fira Code',
          },
        },
      },
    };
    expect(resolveSliceCodeFontFamily(customState)).toMatch(
      /^"Fira Code", /
    );
  });

  it('registers the bundled Native code face with supported descriptors only', () => {
    const fontStyles = readFileSync(
      new URL('./native-fonts.css', import.meta.url),
      'utf8'
    );

    expect(fontStyles).toContain('font-family: "JetBrains Mono Variable"');
    expect(fontStyles).toContain(
      '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'
    );
    expect(fontStyles).not.toContain('font-weight:');
    expect(fontStyles).not.toContain('font-style:');
    expect(fontStyles).not.toContain('unicode-range:');
  });

  it('does not use the Web-only undefined font-mono alias in Native styles', () => {
    const environmentStyles = readFileSync(
      new URL('./environment-panel.css', import.meta.url),
      'utf8'
    );
    const integrationStyles = readFileSync(
      new URL('./settings-integrations-panel.css', import.meta.url),
      'utf8'
    );

    expect(environmentStyles).not.toContain('var(--font-mono)');
    expect(integrationStyles).not.toContain('var(--font-mono)');
    expect(environmentStyles).toContain('var(--font-mono-family)');
    expect(integrationStyles).toContain('var(--font-mono-family)');
  });

  it('projects the active theme pack into root color tokens', () => {
    const appStyles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');
    const customState = {
      ...DEFAULT_THEME_STATE,
      mode: 'light' as const,
      chromeThemes: {
        ...DEFAULT_THEME_STATE.chromeThemes,
        light: {
          ...DEFAULT_THEME_STATE.chromeThemes.light,
          accent: '#ff3366',
          ink: '#112233',
          surface: '#fefefe',
        },
      },
    };
    const variables = resolveSliceThemeVariables(customState);

    expect(variables['--codex-base-accent']).toBe('#ff3366');
    expect(variables['--codex-base-ink']).toBe('#112233');
    expect(variables['--codex-base-surface']).toBe('#fefefe');
    expect(variables['--app-sidebar-surface']).toBe(
      customState.chromeThemes.light.card
    );
    expect(variables['--foreground']).not.toBe(
      DEFAULT_THEME_STATE.chromeThemes.light.ink
    );
    expect(variables['--primary-hover-fill']).toBe(
      '#293847'
    );
    expect(variables['--destructive-hover-fill']).toBe(
      '#e3433f'
    );
    expect(variables['--primary-outline-state-surface']).toBe(
      'rgba(17, 34, 51, 0.04)'
    );
    expect(variables['--primary-outline-state-border']).toBe(
      'rgba(17, 34, 51, 0.32)'
    );
    expect(variables['--destructive-outline-state-surface']).toBe(
      'rgba(224, 46, 42, 0.04)'
    );
    expect(variables['--destructive-outline-state-border']).toBe(
      'rgba(224, 46, 42, 0.32)'
    );
    expect(appStyles).toContain('--primary-hover-fill: #252525;');
    expect(appStyles).toContain('--primary-hover-fill: #e5e5e5;');
    expect(appStyles).toContain('--destructive-hover-fill: #e33531;');
    expect(appStyles).toContain('--destructive-hover-fill: #cc2b28;');
  });

  it('memoizes the root token map outside unrelated App rerenders', () => {
    const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
    expect(appSource).toContain(
      'const themeVariables = useMemo(\n    () => resolveSliceThemeVariables(themeState, systemDark),'
    );
    expect(appSource).toContain('style={themeVariables}');
    expect(appSource).not.toContain(
      'style={resolveSliceThemeVariables(themeState, systemDark)}'
    );
  });

  it('keeps Settings on the root-resolved system appearance', () => {
    const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain(
      "readonly resolvedTheme: 'dark' | 'light';"
    );
    expect(settingsSource).not.toContain(
      'resolveSliceThemeVariant(themeState)'
    );
    expect(routerSource).toContain('resolvedTheme={resolvedTheme}');
    expect(appSource).toContain(
      'const dispose = onGlobalEvent(SYSTEM_APPEARANCE_EVENT, (value: unknown) =>'
    );
    expect(appSource).toContain(
      "void bridgeCall('runtimeGetSystemAppearance')"
    );
    expect(appSource).toContain(
      'const next = readSystemAppearanceResponse(value);'
    );
    expect(appSource).toContain('!receivedTransition && next !== null');
  });
});
