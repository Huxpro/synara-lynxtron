export interface LynxSvgPalette {
  readonly foreground: string;
  readonly mutedForeground: string;
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
  return color;
}

export function colorizeLynxSvg(content: string, color: string): string {
  return content.replace(/currentColor/g, color);
}
