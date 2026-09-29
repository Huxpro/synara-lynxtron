import { useState, type ReactNode } from "@lynx-js/react";
import { resolveIndependentTabRowPresentation } from "@synara/shared/independentTabs";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { ChevronLeftIcon, ChevronRightIcon } from "../lib/icons.lynx";

import "./independent-tab-row.css";

function IndependentTabRowToggle(props: {
  readonly actionPlacement: "start" | "end";
  readonly collapsed: boolean;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "IndependentTabRowToggle",
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  const Icon =
    props.actionPlacement === "start"
      ? props.collapsed
        ? ChevronRightIcon
        : ChevronLeftIcon
      : props.collapsed
        ? ChevronLeftIcon
        : ChevronRightIcon;
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <Icon size={14} />
    </view>
  );
}

export function IndependentTabRow(props: {
  readonly actionPlacement?: "start" | "end";
  readonly actions: ReactNode;
  readonly className?: string;
  readonly defaultCollapsed?: boolean;
  readonly listClassName?: string;
  readonly owner?: "chat" | "terminal-pane" | "terminal-groups";
  readonly scrollerClassName?: string;
  readonly tabs: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(props.defaultCollapsed ?? false);
  const presentation = resolveIndependentTabRowPresentation(collapsed);
  const actionPlacement = props.actionPlacement ?? "end";
  const actionLane = presentation.showActions ? (
    <view className="IndependentTabRowActions">
      {props.actions}
      <IndependentTabRowToggle
        actionPlacement={actionPlacement}
        collapsed={false}
        label={presentation.toggleLabel}
        onActivate={() => setCollapsed(true)}
      />
    </view>
  ) : (
    <view className="IndependentTabRowActions IndependentTabRowActions--restore">
      <IndependentTabRowToggle
        actionPlacement={actionPlacement}
        collapsed
        label={presentation.toggleLabel}
        onActivate={() => setCollapsed(false)}
      />
    </view>
  );

  return (
    <view
      className={`IndependentTabRow IndependentTabRow--${presentation.mode} IndependentTabRow--owner-${
        props.owner ?? "unspecified"
      }${props.className ? ` ${props.className}` : ""}`}
    >
      {actionPlacement === "start" ? actionLane : null}
      <scroll-view
        className={`IndependentTabRowScroller${
          props.scrollerClassName ? ` ${props.scrollerClassName}` : ""
        }`}
        scroll-orientation="horizontal"
      >
        <view
          className={`IndependentTabRowList${props.listClassName ? ` ${props.listClassName}` : ""}`}
        >
          {props.tabs}
        </view>
      </scroll-view>
      {actionPlacement === "end" ? actionLane : null}
    </view>
  );
}
