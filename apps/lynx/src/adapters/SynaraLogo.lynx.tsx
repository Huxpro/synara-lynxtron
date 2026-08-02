import type { CSSProperties } from '@lynx-js/types';

import { SYNARA_LOGO_PATHS } from '@synara-web/assets/synaraLogoPath';

import { useTheme } from './useTheme.lynx';

function synaraLogoContent(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 504" fill="none">${SYNARA_LOGO_PATHS.map(
    (path) => `<path d="${path}" fill="${color}" />`
  ).join('')}</svg>`;
}

export function SynaraLogo({
  className,
  style,
  'aria-label': ariaLabel,
}: {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly 'aria-label'?: string;
}) {
  const { svgColors } = useTheme();
  return (
    <svg
      className={className}
      content={synaraLogoContent(svgColors.foreground)}
      accessibility-label={ariaLabel}
      style={style}
    />
  );
}
