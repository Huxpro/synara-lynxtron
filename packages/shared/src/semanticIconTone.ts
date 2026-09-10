export const SEMANTIC_ICON_TONES = [
  'primary',
  'secondary',
  'tertiary',
  'accent',
  'inverse',
  'disabled',
] as const;

export type SemanticIconTone = (typeof SEMANTIC_ICON_TONES)[number];

export const SEMANTIC_ICON_TONE_CSS_VARIABLE: Record<SemanticIconTone, string> = {
  primary: '--color-icon-primary',
  secondary: '--color-icon-secondary',
  tertiary: '--color-icon-tertiary',
  accent: '--color-icon-accent',
  inverse: '--color-text-button-primary',
  disabled: '--color-token-disabled-foreground',
};

export function semanticIconToneColor(tone: SemanticIconTone): string {
  return `var(${SEMANTIC_ICON_TONE_CSS_VARIABLE[tone]})`;
}

export interface SemanticIconPalette {
  readonly accent: string;
  readonly disabled: string;
  readonly inverse: string;
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
}

export function resolveSemanticIconTone(
  tone: SemanticIconTone,
  palette: SemanticIconPalette,
): string {
  return palette[tone];
}
