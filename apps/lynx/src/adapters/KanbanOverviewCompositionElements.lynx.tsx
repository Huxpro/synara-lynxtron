import type { ReactNode } from '@lynx-js/react';

import './kanban-overview-composition-elements.css';
import { useLynxInteractiveState } from './useLynxInteractiveState';

type ChildrenProps = { readonly children?: ReactNode };

export function KanbanOverviewEmptyRootElement(props: ChildrenProps) {
  return <view className="SharedKanbanOverviewEmptyRoot">{props.children}</view>;
}

export function KanbanOverviewEmptyCopyElement(props: ChildrenProps) {
  return <view className="SharedKanbanOverviewEmptyCopy">{props.children}</view>;
}

export function KanbanOverviewEmptyTitleElement(props: ChildrenProps) {
  return <text className="SharedKanbanOverviewEmptyTitle">{props.children}</text>;
}

export function KanbanOverviewEmptyBodyElement(props: ChildrenProps) {
  return <text className="SharedKanbanOverviewEmptyBody">{props.children}</text>;
}

export function KanbanOverviewProjectsElement(props: ChildrenProps) {
  return (
    <scroll-view
      className="SharedKanbanOverviewScroller"
      scroll-orientation="horizontal"
    >
      <view className="SharedKanbanOverviewProjects">{props.children}</view>
    </scroll-view>
  );
}

export function KanbanOverviewProjectColumnElement(props: ChildrenProps) {
  return <view className="SharedKanbanOverviewProjectColumn">{props.children}</view>;
}

export function KanbanOverviewProjectHeaderRootElement(props: ChildrenProps) {
  return <view className="SharedKanbanOverviewProjectHeaderRoot">{props.children}</view>;
}

export function KanbanOverviewProjectHeaderElement(props: ChildrenProps & {
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedKanbanOverviewProjectHeader',
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
    >
      {props.children}
    </view>
  );
}

export function KanbanOverviewProjectTitleElement(props: ChildrenProps) {
  return (
    <text className="SharedKanbanOverviewProjectTitle" maxlines={1}>
      {props.children}
    </text>
  );
}

export function KanbanOverviewProjectCountElement(props: ChildrenProps) {
  return <text className="SharedKanbanOverviewProjectCount">{props.children}</text>;
}

export function KanbanOverviewProjectChevronElement() {
  return <text className="SharedKanbanOverviewProjectChevron">›</text>;
}

export function KanbanOverviewNewTaskElement(props: {
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedKanbanOverviewNewTask',
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.label}
      {...interaction.eventProps}
    >
      <text className="SharedKanbanOverviewNewTaskLabel">＋</text>
    </view>
  );
}

export function KanbanOverviewCardListElement(props: ChildrenProps) {
  return (
    <scroll-view
      className="SharedKanbanOverviewCardScroller"
      scroll-orientation="vertical"
    >
      <view className="SharedKanbanOverviewCardList">{props.children}</view>
    </scroll-view>
  );
}

export function KanbanOverviewCardItemElement(props: ChildrenProps) {
  return <view className="SharedKanbanOverviewCardItem">{props.children}</view>;
}

export function KanbanOverviewShowMoreElement(props: {
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedKanbanOverviewShowMore',
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
    >
      <text className="SharedKanbanOverviewShowMoreLabel">{props.label}</text>
    </view>
  );
}
