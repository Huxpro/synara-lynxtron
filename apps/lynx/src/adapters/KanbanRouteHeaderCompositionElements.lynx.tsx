import type { ReactNode } from '@lynx-js/react';

import { ArrowLeftIcon, PlusIcon } from '../lib/icons.lynx';
import './kanban-route-header-composition-elements.css';
import { useTheme } from './useTheme.lynx';
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
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedKanbanRouteBack',
    accessibleLabel: 'Back to Kanban',
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label="Back to Kanban"
      {...interaction.eventProps}
    >
      <ArrowLeftIcon
        className="SharedKanbanRouteBackIcon"
        color={semanticIconColor('secondary')}
        size={14}
      />
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
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedKanbanRouteNewTask${
      props.disabled ? ' SharedKanbanRouteNewTask--disabled' : ''
    }`,
    accessibleLabel: 'New task',
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      aria-label="New task"
      {...interaction.eventProps}
    >
      <PlusIcon
        className="SharedKanbanRouteNewTaskIcon"
        color={semanticIconColor('secondary')}
        size={14}
      />
      <text className="SharedKanbanRouteNewTaskText">New task</text>
    </view>
  );
}
