import type { ReactNode } from '@lynx-js/react';
import fileTextSvg from '@synara-central-icons/file-text.svg?raw';

import { useLynxInteractiveState } from '../ui/interactive-state.lynx';
import { useTheme } from '../../adapters/useTheme.lynx';
import { colorizeLynxSvg } from '../../lib/themedSvg.lynx';

export function MarkdownFileReferenceToken(props: {
  readonly children: ReactNode;
  readonly className: string;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly relativePath: string;
  readonly showGlyph?: boolean;
}) {
  const { svgColors } = useTheme();
  const activate = props.onOpenFileReference
    ? () => {
        'background only';
        props.onOpenFileReference?.(props.relativePath);
      }
    : undefined;
  const interaction = useLynxInteractiveState({
    baseClassName: props.className,
    disabled: !activate,
    focusable: Boolean(activate),
    onActivate: activate,
    accessibilityTraits: activate ? 'link' : 'text',
    accessibleLabel: `Open ${props.relativePath}`,
  });
  return (
    <text className={interaction.className} {...interaction.eventProps}>
      {props.showGlyph ? (
        <svg
          className="MdInlineTokenFileIcon"
          content={colorizeLynxSvg(fileTextSvg, svgColors.iconSecondary)}
        />
      ) : null}
      {props.children}
    </text>
  );
}
