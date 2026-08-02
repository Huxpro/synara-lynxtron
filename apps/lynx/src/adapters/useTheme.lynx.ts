import { useEffect, useState } from '@lynx-js/react';
import {
  DEFAULT_THEME_STATE,
  resolveThemePack,
  resolveThemeVariant,
  type ThemeState,
} from '@synara-web/theme/theme.logic';

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

export function useTheme() {
  const [themeState, setThemeState] = useState(currentThemeState);

  useEffect(() => {
    'background only';
    listeners.add(setThemeState);
    return () => listeners.delete(setThemeState);
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
    setTheme: () => {},
    setCodeThemeId: () => {},
  } as const;
}
