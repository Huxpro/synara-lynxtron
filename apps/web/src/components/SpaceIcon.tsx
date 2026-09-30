// FILE: SpaceIcon.tsx
// Purpose: Renders built-in and custom Space icons through Synara's Central asset renderer.

import { SPACE_ICON_OPTIONS as SHARED_SPACE_ICON_OPTIONS } from "@synara/shared/spacePresentation";

import { CentralIcon } from "~/lib/central-icons";
import { DEFAULT_VOID_SPACE_ICON, type VoidSpaceIconName } from "~/lib/spaceGrouping";
import { cn } from "~/lib/utils";

export type SpaceIconValue = VoidSpaceIconName;

export interface SpaceIconOption {
  readonly name: SpaceIconValue;
  readonly label: string;
}

/** Icon options in the order the picker offers them; the spoken labels live in the shared module. */
export const SPACE_ICON_OPTIONS: ReadonlyArray<SpaceIconOption> = SHARED_SPACE_ICON_OPTIONS;

/**
 * Void's own glyph, offered only when editing Void: it is the one icon that means "nothing
 * is filed here", so a stored Space wearing it would be lying about itself.
 */
export const VOID_SPACE_ICON_OPTIONS: ReadonlyArray<SpaceIconOption> = [
  { name: DEFAULT_VOID_SPACE_ICON, label: "Black hole" },
  ...SPACE_ICON_OPTIONS,
];

export function SpaceIcon(props: {
  icon: SpaceIconValue;
  className?: string | undefined;
  label?: string;
}) {
  return (
    <CentralIcon name={props.icon} label={props.label} className={cn("size-4", props.className)} />
  );
}
