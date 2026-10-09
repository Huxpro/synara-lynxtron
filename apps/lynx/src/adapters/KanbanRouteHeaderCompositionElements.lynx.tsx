import { createContext, useContext, type ReactNode } from "@lynx-js/react";

import { ArrowLeftIcon, PlusIcon } from "../lib/icons.lynx";
import "./kanban-route-header-composition-elements.css";
import { useTheme } from "./useTheme.lynx";
import { useLynxInteractiveState } from "./useLynxInteractiveState";

type ChildrenProps = { readonly children?: ReactNode };

export function KanbanRouteHeaderRootElement(
  props: ChildrenProps & {
    readonly hostClassName?: string | undefined;
  },
) {
  return <view className="SharedKanbanRouteHeader chat-surface-divider">{props.children}</view>;
}

export function KanbanRouteHeaderRowElement(props: ChildrenProps) {
  return <view className="SharedKanbanRouteHeaderRow">{props.children}</view>;
}

export function KanbanRouteHeaderNavigationElement() {
  return null;
}

export function KanbanRouteHeaderBackElement(props: { readonly onActivate: () => void }) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedKanbanRouteBack",
    accessibleLabel: "Back to Kanban",
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} aria-label="Back to Kanban" {...interaction.eventProps}>
      <ArrowLeftIcon
        className="SharedKanbanRouteBackIcon"
        color={semanticIconColor("secondary")}
        size={14}
      />
    </view>
  );
}

export function KanbanRouteHeaderTitleElement(props: ChildrenProps) {
  return (
    <text className="SharedKanbanRouteTitle" text-maxline="1">
      {props.children}
    </text>
  );
}

export function KanbanRouteHeaderCountElement(props: ChildrenProps) {
  return <text className="SharedKanbanRouteCount">{props.children}</text>;
}

/**
 * True under the Kanban overview header. Upstream's overview is the Kanban view of the
 * Tasks surface, whose header carries the View (List / Kanban) and Board view
 * (Attention / Classic) switches; a project board has neither.
 */
export const KanbanOverviewHeaderContext = createContext(false);

function ViewSegment(props: {
  readonly label: string;
  readonly selected: boolean;
  /** Set for a view the Native app does not have yet. */
  readonly unavailable?: boolean;
}) {
  const accessibleLabel = props.unavailable
    ? `${props.label} is not available in the Native app yet`
    : props.label;
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedKanbanRouteViewSegment${
      props.selected ? " SharedKanbanRouteViewSegment--selected" : ""
    }`,
    accessibleLabel,
    accessibilityValue: props.selected ? "Selected" : undefined,
    disabled: props.unavailable,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SharedKanbanRouteViewSegmentText">{props.label}</text>
    </view>
  );
}

function ViewSwitch(props: { readonly label: string; readonly children?: ReactNode }) {
  return (
    <view
      className="SharedKanbanRouteViewSwitch"
      accessibility-element={true}
      accessibility-label={props.label}
      accessibility-trait="none"
    >
      {props.children}
    </view>
  );
}

export function KanbanRouteHeaderSpacerElement() {
  const overview = useContext(KanbanOverviewHeaderContext);
  return (
    <>
      {overview ? (
        <>
          <ViewSwitch label="View">
            <ViewSegment label="List" selected={false} unavailable />
            <ViewSegment label="Kanban" selected />
          </ViewSwitch>
          <ViewSwitch label="Board view">
            <ViewSegment label="Attention" selected />
            <ViewSegment label="Classic" selected={false} unavailable />
          </ViewSwitch>
        </>
      ) : null}
      <view className="SharedKanbanRouteSpacer" />
    </>
  );
}

/**
 * Upstream's "Needs review" board filter row above the columns. The filter is not ported:
 * the row keeps the board where upstream puts it and says so.
 */
export function KanbanOverviewFilterRow() {
  return (
    <view
      className="SharedKanbanOverviewFilterRow"
      accessibility-element={true}
      accessibility-label="Needs review filter is not available in the Native app yet"
      accessibility-trait="none"
    >
      <view className="SharedKanbanOverviewFilterBox" />
      <text className="SharedKanbanOverviewFilterText">Needs review</text>
    </view>
  );
}

export function KanbanRouteHeaderNewTaskElement(props: {
  readonly disabled: boolean;
  readonly shortcutParts: readonly string[];
  readonly onActivate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedKanbanRouteNewTask${
      props.disabled ? " SharedKanbanRouteNewTask--disabled" : ""
    }`,
    accessibleLabel: "New task",
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} aria-label="New task" {...interaction.eventProps}>
      <PlusIcon
        className="SharedKanbanRouteNewTaskIcon"
        color={semanticIconColor("secondary")}
        size={14}
      />
      <text className="SharedKanbanRouteNewTaskText">New task</text>
    </view>
  );
}
