// FILE: SpaceIcon.tsx
// Purpose: Renders built-in and custom Space icons through Synara's Central asset renderer.

import type { SpaceIconName } from "@synara/contracts";
import { SPACE_ICON_OPTIONS } from "@synara/shared/spacePresentation";

import { CentralIcon } from "~/lib/central-icons";
import { VOID_SPACE_ICON } from "~/lib/spaceGrouping";
import { cn } from "~/lib/utils";

export type SpaceIconValue = SpaceIconName | typeof VOID_SPACE_ICON;

/**
 * Spoken names for the curated icon set. The asset basenames leak numbering and
 * compound words ("chart-2", "camera-1", "gamecontroller") that read badly to a
 * screen reader and in the picker, so every icon gets a human label here.
 */
export { SPACE_ICON_OPTIONS };

export function SpaceIcon(props: {
  icon: SpaceIconValue;
  className?: string | undefined;
  label?: string;
}) {
  return (
    <CentralIcon name={props.icon} label={props.label} className={cn("size-4", props.className)} />
  );
}
