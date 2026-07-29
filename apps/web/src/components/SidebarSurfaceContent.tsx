// FILE: SidebarSurfaceContent.tsx
// Purpose: Shared sidebar content frame and surface ordering
// (prelude → picker → keyed surface transition wrapping navigation + body → trailing).

import type { ReactNode } from "react";

import {
  SidebarContentFrameElement,
  SidebarSurfaceTransitionElement,
} from "~/components/SidebarSurfaceContentElements";

export function SidebarSurfaceContent(props: {
  readonly prelude?: ReactNode;
  /**
   * When present the settings navigation replaces the surface itself: no segment
   * picker, no primary navigation and no surface body are rendered. Prelude and
   * trailing stay mounted so their own visibility rules keep deciding.
   */
  readonly settingsNavigation?: ReactNode;
  readonly picker?: ReactNode;
  readonly surfaceKey: string;
  readonly navigation?: ReactNode;
  readonly body?: ReactNode;
  readonly trailing?: ReactNode;
}) {
  return (
    <SidebarContentFrameElement>
      {props.prelude}
      {props.settingsNavigation ? (
        props.settingsNavigation
      ) : (
        <>
          {props.picker}
          {/*
            Keyed per segment so switching surfaces remounts the content with a
            short enter animation instead of a hard cut. The picker stays outside
            the key so its thumb can glide across the switch.
          */}
          <SidebarSurfaceTransitionElement key={props.surfaceKey}>
            {props.navigation}
            {props.body}
          </SidebarSurfaceTransitionElement>
        </>
      )}
      {props.trailing}
    </SidebarContentFrameElement>
  );
}
