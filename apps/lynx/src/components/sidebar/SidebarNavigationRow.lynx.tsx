import { getRectByRef } from "@lynx-js/lynx-ui";
import { useRef, useState, type ReactNode } from "@lynx-js/react";
import type { NodesRef } from "@lynx-js/types";

import { sleepOnHost } from "../../platform/timer";
import { focusLynxNode } from "../ui/focus.lynx";
import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from "../ui/interactive-state.lynx";
import { MenuOverlayPortal } from "../ui/menu.lynx";
import { resolveSecondaryPointerOffset } from "./threadContextActions.logic";

/**
 * One interactive sidebar row: activation, secondary-click context menu, the hover card
 * portal and the hover action slot. Classic and Activity rows both render through it.
 */
export function SidebarNavigationRow(props: {
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly className: string;
  readonly active?: boolean;
  readonly expanded?: boolean;
  readonly hoverCard?: ReactNode;
  readonly label: string;
  readonly projectId?: string;
  readonly threadId?: string;
  readonly onActivate: () => void;
  readonly onContextMenu?: (
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) => void;
}) {
  const rowRef = useRef<NodesRef>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [hoverCardPosition, setHoverCardPosition] = useState<{
    readonly left: number;
    readonly top: number;
  } | null>(null);
  const interaction = useLynxInteractiveState({
    baseClassName: props.className,
    accessibleLabel: props.label,
    accessibilityValue:
      props.expanded === undefined ? undefined : props.expanded ? "Expanded" : "Collapsed",
    onActivate: props.onActivate,
    onIntent: props.hoverCard
      ? () => {
          "background only";
          void getRectByRef(rowRef, true)
            .then((rect) =>
              setHoverCardPosition({
                left: rect.right + 8,
                top: rect.top,
              }),
            )
            .catch(() => setHoverCardPosition(null));
        }
      : undefined,
  });
  return (
    <>
      <view
        ref={rowRef}
        data-project-id={props.projectId}
        data-thread-id={props.threadId}
        data-active={props.active}
        className={interaction.className}
        aria-label={props.label}
        aria-expanded={props.expanded}
        {...interaction.eventProps}
        bindmouseenter={() => {
          interaction.eventProps.bindmouseenter?.();
          setPreviewVisible(true);
        }}
        bindmouseleave={() => {
          interaction.eventProps.bindmouseleave?.();
          setPreviewVisible(false);
        }}
        bindfocus={() => {
          interaction.eventProps.bindfocus?.();
          setPreviewVisible(true);
        }}
        bindblur={() => {
          interaction.eventProps.bindblur?.();
          setPreviewVisible(false);
        }}
        bindmousedown={(event: {
          readonly button?: number;
          readonly x?: number;
          readonly y?: number;
        }) => {
          interaction.eventProps.bindmousedown?.();
          const offset = resolveSecondaryPointerOffset(event);
          if (!offset || !props.onContextMenu) return;
          void getRectByRef(rowRef, true)
            .then(async (rect) => {
              // Let the triggering secondary-button release finish before
              // AppKit places the first native menu item under that pointer.
              await sleepOnHost(50);
              props.onContextMenu?.(
                {
                  x: rect.left + offset.x,
                  y: rect.top + offset.y,
                },
                () => focusLynxNode(rowRef),
              );
            })
            .catch(() => {
              // A context menu with invented coordinates is worse than no menu.
            });
        }}
      >
        {props.children}
        {props.actions ? <view className="AppSidebarRowHoverActions">{props.actions}</view> : null}
      </view>
      {props.hoverCard && previewVisible && hoverCardPosition ? (
        <MenuOverlayPortal>
          <view
            className="AppSidebarRowHoverCard"
            style={{
              left: `${hoverCardPosition.left}px`,
              top: `${hoverCardPosition.top}px`,
            }}
          >
            {props.hoverCard}
          </view>
        </MenuOverlayPortal>
      ) : null}
    </>
  );
}

export function SidebarHoverAction(props: {
  readonly label: string;
  readonly onActivate: () => void;
  readonly children: ReactNode;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "AppSidebarHoverAction",
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      {...lynxNestedInteractiveEventProps(interaction.eventProps)}
    >
      {props.children}
    </view>
  );
}
