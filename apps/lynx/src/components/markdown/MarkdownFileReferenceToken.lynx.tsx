import type { ReactNode } from '@lynx-js/react';

import { useLynxInteractiveState } from '../ui/interactive-state.lynx';

export function MarkdownFileReferenceToken(props: {
  readonly children: ReactNode;
  readonly className: string;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly relativePath: string;
  readonly showGlyph?: boolean;
}) {
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
      {props.showGlyph ? <text className="MdInlineTokenGlyph">@</text> : null}
      {props.children}
    </text>
  );
}
