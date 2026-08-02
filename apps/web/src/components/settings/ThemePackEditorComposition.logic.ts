// FILE: ThemePackEditorComposition.logic.ts
// Purpose: Host-neutral theme-pack editor labels, context, and option projection.

import {
  CODE_THEME_OPTIONS,
  getAvailableCodeThemes,
  getCodeThemeSeed,
  type ThemeMode,
  type ThemePack,
  type ThemeVariant,
} from "../../theme/theme.logic";

export type ThemePackEditorModel = {
  readonly titleLabel: string;
  readonly contextLabel: string;
  readonly codeThemeLabel: string;
  readonly codeThemes: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly previewTheme: ThemePack["theme"];
  }>;
};

export function resolveThemePackEditorModel(input: {
  readonly variant: ThemeVariant;
  readonly isActive: boolean;
  readonly mode: ThemeMode;
  readonly pack: ThemePack;
}): ThemePackEditorModel {
  const { variant, isActive, mode, pack } = input;
  const titleLabel = variant === "dark" ? "Dark theme" : "Light theme";
  return {
    titleLabel,
    contextLabel: isActive
      ? mode === "system"
        ? `System is currently using this ${variant} slot.`
        : "This is the active theme right now."
      : mode === "system"
        ? `Used when your system switches to ${variant}.`
        : `Inactive while the app is locked to ${mode}.`,
    codeThemeLabel:
      CODE_THEME_OPTIONS.find((option) => option.id === pack.codeThemeId)?.label ??
      pack.codeThemeId,
    codeThemes: getAvailableCodeThemes(variant).map((option) => ({
      id: option.id,
      label: option.label,
      previewTheme: getCodeThemeSeed(option.id, variant),
    })),
  };
}
