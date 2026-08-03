import { useEffect, useState } from '@lynx-js/react';
import {
  DEFAULT_THEME_STATE,
  resolveThemePack,
  resolveThemeVariant,
  serializeThemeState,
  setThemeCodeThemeId,
  type ThemeMode,
  type ThemeState,
  type ThemeVariant,
} from '@synara-web/theme/theme.logic';
import { THEME_STORAGE_KEY } from '@synara-web/appSettingsStorageProjection.logic';

let currentThemeState = DEFAULT_THEME_STATE;
const listeners = new Set<(state: ThemeState) => void>();

function withOpacity(color: string, opacity: number): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (!match) return color;
  return `rgba(${Number.parseInt(match[1], 16)}, ${Number.parseInt(
    match[2],
    16
  )}, ${Number.parseInt(match[3], 16)}, ${opacity})`;
}

export function setLynxThemeState(state: ThemeState): void {
  currentThemeState = state;
  for (const listener of listeners) listener(state);
}

export function subscribeLynxThemeState(
  listener: (state: ThemeState) => void
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateLynxThemeState(
  update: (state: ThemeState) => ThemeState
): void {
  const next = update(currentThemeState);
  setLynxThemeState(next);
  void import(/* webpackMode: "eager" */ '../platform/storage')
    .then(({ setPersistedStorageItem }) =>
      setPersistedStorageItem(THEME_STORAGE_KEY, serializeThemeState(next))
    )
    .catch(() => {
      // The live theme remains applied. Settings hydration exposes storage
      // failures through its own retry surface.
    });
}

export function useTheme() {
  const [themeState, setThemeState] = useState(currentThemeState);

  useEffect(() => {
    'background only';
    return subscribeLynxThemeState(setThemeState);
  }, []);

  const resolvedTheme = resolveThemeVariant(themeState.mode, false);
  const activeTheme = resolveThemePack(themeState, resolvedTheme);
  return {
    activeTheme,
    resolvedTheme,
    svgColors: {
      foreground: activeTheme.theme.ink,
      mutedForeground: withOpacity(activeTheme.theme.ink, 0.6),
    },
    theme: themeState.mode,
    setTheme: (mode: ThemeMode) =>
      updateLynxThemeState((state) => ({ ...state, mode })),
    setCodeThemeId: (variant: ThemeVariant, codeThemeId: string) =>
      updateLynxThemeState((state) =>
        setThemeCodeThemeId(state, variant, codeThemeId)
      ),
  } as const;
}
