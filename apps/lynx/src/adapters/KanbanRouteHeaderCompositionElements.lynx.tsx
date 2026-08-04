import type { ReactNode } from '@lynx-js/react';

import { PlusIcon } from '../lib/icons.lynx';
import './kanban-route-header-composition-elements.css';
import { useLynxInteractiveState } from './useLynxInteractiveState';

type ChildrenProps = { readonly children?: ReactNode };

export function KanbanRouteHeaderRootElement(props: ChildrenProps & {
  readonly hostClassName?: string | undefined;
}) {
  return <view className="SharedKanbanRouteHeader">{props.children}</view>;
}

export function KanbanRouteHeaderRowElement(props: ChildrenProps) {
  return <view className="SharedKanbanRouteHeaderRow">{props.children}</view>;
}

export function KanbanRouteHeaderNavigationElement() {
  return null;
}

export function KanbanRouteHeaderBackElement(props: {
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedKanbanRouteBack',
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label="Back to Kanban"
      {...interaction.eventProps}
    >
      <text className="SharedKanbanRouteBackGlyph">‹</text>
    </view>
  );
}

export function KanbanRouteHeaderTitleElement(props: ChildrenProps) {
  return (
    <text className="SharedKanbanRouteTitle" maxlines={1}>
      {props.children}
    </text>
  );
}

export function KanbanRouteHeaderCountElement(props: ChildrenProps) {
  return <text className="SharedKanbanRouteCount">{props.children}</text>;
}

export function KanbanRouteHeaderSpacerElement() {
  return <view className="SharedKanbanRouteSpacer" />;
}

export function KanbanRouteHeaderNewTaskElement(props: {
  readonly disabled: boolean;
  readonly shortcutParts: readonly string[];
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedKanbanRouteNewTask${
      props.disabled ? ' SharedKanbanRouteNewTask--disabled' : ''
    }`,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label="New task"
      {...interaction.eventProps}
    >
      <PlusIcon className="SharedKanbanRouteNewTaskIcon" size={14} />
      <text className="SharedKanbanRouteNewTaskText">New task</text>
    </view>
  );
}
