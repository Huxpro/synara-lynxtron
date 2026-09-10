export interface LynxSvgPalette {
  readonly foreground: string;
  readonly mutedForeground: string;
  readonly iconAccent?: string;
  readonly iconPrimary?: string;
  readonly iconSecondary?: string;
  readonly iconTertiary?: string;
  readonly inverse?: string;
  readonly disabled?: string;
}

export function resolveLynxSvgColor(
  color: string,
  palette: LynxSvgPalette
): string {
  if (color === 'currentColor' || color === 'var(--foreground)') {
    return palette.foreground;
  }
  if (color === 'var(--muted-foreground)') {
    return palette.mutedForeground;
  }
  if (color === 'var(--color-icon-accent)') return palette.iconAccent ?? color;
  if (color === 'var(--color-icon-primary)') return palette.iconPrimary ?? color;
  if (color === 'var(--color-icon-secondary)') return palette.iconSecondary ?? color;
  if (color === 'var(--color-icon-tertiary)') return palette.iconTertiary ?? color;
  if (color === 'var(--color-text-button-primary)') return palette.inverse ?? color;
  if (color === 'var(--color-token-disabled-foreground)') return palette.disabled ?? color;
  return color;
}

export function colorizeLynxSvg(content: string, color: string): string {
  return content.replace(/currentColor/g, color);
}
