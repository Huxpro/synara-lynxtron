import type { ReactNode } from "@lynx-js/react";

import type { KanbanColumnKey } from "@synara-web/components/kanban/kanban.logic";

import { PlusIcon } from "../lib/icons.lynx";
import { KanbanStatusIcon } from "./KanbanStatusIcon.lynx";
import "./kanban-column-composition-elements.css";
import { useTheme } from "./useTheme.lynx";
import { useLynxInteractiveState } from "./useLynxInteractiveState";

type ChildrenProps = { readonly children?: ReactNode };

export function KanbanColumnRootElement(props: ChildrenProps) {
  return <view className="SharedKanbanColumnRoot">{props.children}</view>;
}

export function KanbanColumnHeaderElement(props: ChildrenProps) {
  return <view className="SharedKanbanColumnHeader">{props.children}</view>;
}

export function KanbanColumnTitleElement(props: ChildrenProps) {
  return <text className="SharedKanbanColumnTitle">{props.children}</text>;
}

export function KanbanColumnCountElement(props: ChildrenProps) {
  return <text className="SharedKanbanColumnCount">{props.children}</text>;
}

export function KanbanColumnHeaderActionsElement(props: ChildrenProps) {
  return <view className="SharedKanbanColumnHeaderActions">{props.children}</view>;
}

export function KanbanColumnDispatchTargetElement(props: ChildrenProps) {
  return <text className="SharedKanbanColumnDispatchTarget">{props.children}</text>;
}

export function KanbanColumnNewCardElement(props: {
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedKanbanColumnNewCard",
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} aria-label={props.label} {...interaction.eventProps}>
      <PlusIcon
        className="SharedKanbanColumnNewCardIcon"
        color={semanticIconColor("secondary")}
        size={14}
      />
    </view>
  );
}

export function KanbanColumnStatusElement(props: { readonly column: KanbanColumnKey }) {
  return <KanbanStatusIcon column={props.column} />;
}

export function KanbanColumnCardListElement(props: ChildrenProps) {
  return (
    <scroll-view className="SharedKanbanColumnScroller" scroll-orientation="vertical">
      <view className="SharedKanbanColumnCardList">{props.children}</view>
    </scroll-view>
  );
}

export function KanbanColumnCardItemElement(props: ChildrenProps) {
  return <view className="SharedKanbanColumnCardItem">{props.children}</view>;
}

export function KanbanColumnEmptyElement(props: ChildrenProps) {
  return (
    <view className="SharedKanbanColumnEmpty">
      <text className="SharedKanbanColumnEmptyText">{props.children}</text>
    </view>
  );
}

export function KanbanColumnShowMoreElement(props: {
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedKanbanColumnShowMore",
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SharedKanbanColumnShowMoreLabel">{props.label}</text>
    </view>
  );
}
