// FILE: KanbanRouteHeaderComposition.tsx
// Purpose: Physical shared source for Kanban route header identity and actions.

import {
  KanbanRouteHeaderBackElement,
  KanbanRouteHeaderCountElement,
  KanbanRouteHeaderNavigationElement,
  KanbanRouteHeaderNewTaskElement,
  KanbanRouteHeaderRootElement,
  KanbanRouteHeaderRowElement,
  KanbanRouteHeaderSpacerElement,
  KanbanRouteHeaderTitleElement,
} from "~/components/kanban/KanbanRouteHeaderCompositionElements";

export function KanbanRouteHeaderComposition(props: {
  readonly title: string;
  readonly taskCount: number;
  readonly navigationAvailable?: boolean | undefined;
  readonly backAvailable: boolean;
  readonly onBack: () => void;
  readonly newTaskDisabled: boolean;
  readonly newTaskShortcutParts: readonly string[];
  readonly onNewTask: () => void;
  readonly hostClassName?: string | undefined;
}) {
  return (
    <KanbanRouteHeaderRootElement hostClassName={props.hostClassName}>
      <KanbanRouteHeaderRowElement>
        {props.navigationAvailable === false ? null : <KanbanRouteHeaderNavigationElement />}
        {props.backAvailable ? <KanbanRouteHeaderBackElement onActivate={props.onBack} /> : null}
        <KanbanRouteHeaderTitleElement>{props.title}</KanbanRouteHeaderTitleElement>
        <KanbanRouteHeaderCountElement>{props.taskCount} tasks</KanbanRouteHeaderCountElement>
        <KanbanRouteHeaderSpacerElement />
        <KanbanRouteHeaderNewTaskElement
          disabled={props.newTaskDisabled}
          shortcutParts={props.newTaskShortcutParts}
          onActivate={props.onNewTask}
        />
      </KanbanRouteHeaderRowElement>
    </KanbanRouteHeaderRootElement>
  );
}
