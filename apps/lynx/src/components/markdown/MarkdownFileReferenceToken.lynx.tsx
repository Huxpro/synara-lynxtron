import type { ReactNode } from "@lynx-js/react";

import { FileEntryIcon } from "../FileEntryIcon.lynx";
import { useLynxInteractiveState } from "../ui/interactive-state.lynx";

export function MarkdownFileReferenceToken(props: {
  readonly children: ReactNode;
  readonly className: string;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly relativePath: string;
  readonly showGlyph?: boolean;
}) {
  const activate = props.onOpenFileReference
    ? () => {
        "background only";
        props.onOpenFileReference?.(props.relativePath);
      }
    : undefined;
  const interaction = useLynxInteractiveState({
    baseClassName: props.className,
    disabled: !activate,
    focusable: Boolean(activate),
    onActivate: activate,
    accessibilityTraits: activate ? "link" : "text",
    accessibleLabel: `Open ${props.relativePath}`,
  });
  return (
    <text className={interaction.className} {...interaction.eventProps}>
      {/* Upstream's `OpenableFileChip` is the mention chip: the file-type icon and the name. */}
      {props.showGlyph ? (
        <FileEntryIcon className="MdInlineTokenIcon" pathValue={props.relativePath} />
      ) : null}
      {props.children}
    </text>
  );
}
