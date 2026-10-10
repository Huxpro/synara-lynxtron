import type { ReactNode } from "@lynx-js/react";

import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from "../adapters/useLynxInteractiveState";
import { XIcon } from "../lib/icons.lynx";
import { useTheme } from "../adapters/useTheme.lynx";

import "./editor-surface-tab.css";

/** The `--content` chip's shrink floor (upstream `min-w-[9em]` of its 12px font) and strip gap. */
const CONTENT_TAB_FLOOR_PX = 108;
const CONTENT_TAB_GAP_PX = 4;

/**
 * Sizes the row of `closePlacement="trailing"` tabs inside its horizontal scroll-view as
 * upstream's SurfaceContentTabs does: the row is as wide as the strip, so the tabs shrink
 * together from their 216px basis, and it stops narrowing at the tabs' floor, where the
 * strip scrolls instead. Without it the row takes its content width and no tab shrinks.
 */
export function contentTabListStyle(tabCount: number): {
  readonly width: string;
  readonly minWidth: string;
} {
  const count = Math.max(0, tabCount);
  return {
    width: "100%",
    minWidth: `${count * CONTENT_TAB_FLOOR_PX + Math.max(0, count - 1) * CONTENT_TAB_GAP_PX}px`,
  };
}

/**
 * Lynx counterpart of Web's SurfaceTabChip. Every closable editor/dock tab
 * goes through this primitive so its 16px icon slot, hover-to-close swap and
 * nested close semantics cannot drift between File, Diff, Chat and Terminal.
 */
export function EditorSurfaceTab(props: {
  readonly active?: boolean;
  readonly className?: string;
  /**
   * "trailing" is upstream's SurfaceContentTabs chip: the icon stays put and a 24px
   * close button sits at the tab's right edge. Default: the icon slot swaps to the close.
   */
  readonly closePlacement?: "icon" | "trailing";
  readonly closeLabel: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly labelClassName?: string;
  readonly leading?: ReactNode;
  readonly onClose: () => void;
  readonly onSelect?: () => void;
  readonly visualState?: "default" | "hover" | "focus" | "pressed";
}) {
  const { semanticIconColor } = useTheme();
  const tab = useLynxInteractiveState({
    baseClassName: `EditorSurfaceTab${
      props.active ? " EditorSurfaceTab--active" : ""
    }${props.className ? ` ${props.className}` : ""}`,
    accessibleLabel: props.onSelect ? props.label : undefined,
    accessibilityValue: props.active ? "Selected" : undefined,
    onActivate: props.onSelect,
  });
  const close = useLynxInteractiveState({
    baseClassName: "EditorSurfaceTabClose",
    accessibleLabel: props.closeLabel,
    onActivate: props.onClose,
  });

  const deterministicState =
    props.visualState && props.visualState !== "default" ? ` ui-${props.visualState}` : "";
  const closeGlyph = (
    <XIcon className="EditorSurfaceTabCloseIcon" color={semanticIconColor("secondary")} size={14} />
  );
  const label = (
    <text
      className={`EditorSurfaceTabLabel${props.labelClassName ? ` ${props.labelClassName}` : ""}`}
    >
      {props.label}
    </text>
  );
  if (props.closePlacement === "trailing") {
    return (
      <view
        className={`${tab.className} EditorSurfaceTab--content${deterministicState}`}
        {...tab.eventProps}
      >
        <view className="EditorSurfaceTabIconSlot">{props.icon}</view>
        {label}
        <view
          className={`${close.className} EditorSurfaceTabTrailingClose`}
          {...lynxNestedInteractiveEventProps(close.eventProps)}
        >
          {closeGlyph}
        </view>
      </view>
    );
  }
  return (
    <view className={`${tab.className}${deterministicState}`} {...tab.eventProps}>
      {props.leading ? <view className="EditorSurfaceTabLeading">{props.leading}</view> : null}
      <view
        className={`${close.className} EditorSurfaceTabIconSlot`}
        {...lynxNestedInteractiveEventProps(close.eventProps)}
      >
        <view className="EditorSurfaceTabRestingIcon">{props.icon}</view>
        <view className="EditorSurfaceTabCloseGlyph">{closeGlyph}</view>
      </view>
      {label}
    </view>
  );
}
