// FILE: KanbanOverviewComposition.tsx
// Purpose: Physical shared source for the project overview's filtering, order,
// render cap, header/card anatomy, and empty-state copy.

import type { ProjectId } from "@synara/contracts";

import {
  KanbanOverviewCardItemElement,
  KanbanOverviewCardListElement,
  KanbanOverviewEmptyBodyElement,
  KanbanOverviewEmptyCopyElement,
  KanbanOverviewEmptyRootElement,
  KanbanOverviewEmptyTitleElement,
  KanbanOverviewNewTaskElement,
  KanbanOverviewProjectChevronElement,
  KanbanOverviewProjectColumnElement,
  KanbanOverviewProjectCountElement,
  KanbanOverviewProjectHeaderElement,
  KanbanOverviewProjectHeaderRootElement,
  KanbanOverviewProjectTitleElement,
  KanbanOverviewProjectsElement,
  KanbanOverviewShowMoreElement,
} from "~/components/kanban/KanbanOverviewCompositionElements";
import { KanbanCardView } from "./KanbanCardView";
import {
  flattenProjectBoardForOverview,
  type KanbanBoard,
  type KanbanCard,
  type KanbanProjectBoard,
} from "./kanban.logic";

const OVERVIEW_RENDER_CAP = 20;

function KanbanOverviewProjectComposition(props: {
  readonly projectBoard: KanbanProjectBoard;
  readonly onOpenProject: (projectId: ProjectId) => void;
  readonly onOpenCard: (card: KanbanCard) => void;
  readonly onCardContextMenu?: (card: KanbanCard, event: React.MouseEvent) => void;
  readonly onNewTask?: (projectId: ProjectId) => void;
  readonly nowMs?: number;
}) {
  const cards = flattenProjectBoardForOverview(props.projectBoard);
  const visibleCards =
    cards.length > OVERVIEW_RENDER_CAP ? cards.slice(0, OVERVIEW_RENDER_CAP) : cards;
  const hiddenCount = cards.length - visibleCards.length;

  return (
    <KanbanOverviewProjectColumnElement>
      <KanbanOverviewProjectHeaderRootElement>
        <KanbanOverviewProjectHeaderElement
          onActivate={() => props.onOpenProject(props.projectBoard.projectId)}
        >
          <KanbanOverviewProjectTitleElement>
            {props.projectBoard.projectName}
          </KanbanOverviewProjectTitleElement>
          <KanbanOverviewProjectCountElement>
            {props.projectBoard.totalCount}
          </KanbanOverviewProjectCountElement>
          <KanbanOverviewProjectChevronElement />
        </KanbanOverviewProjectHeaderElement>
        {props.onNewTask ? (
          <KanbanOverviewNewTaskElement
            label={`New task in ${props.projectBoard.projectName}`}
            onActivate={() => props.onNewTask?.(props.projectBoard.projectId)}
          />
        ) : null}
      </KanbanOverviewProjectHeaderRootElement>
      <KanbanOverviewCardListElement>
        {visibleCards.map((card) => (
          <KanbanOverviewCardItemElement key={card.cardId}>
            <KanbanCardView
              card={card}
              onOpen={props.onOpenCard}
              {...(props.onCardContextMenu ? { onContextMenu: props.onCardContextMenu } : {})}
              {...(props.nowMs !== undefined ? { nowMs: props.nowMs } : {})}
            />
          </KanbanOverviewCardItemElement>
        ))}
        {hiddenCount > 0 ? (
          <KanbanOverviewCardItemElement>
            <KanbanOverviewShowMoreElement
              label={`Show ${hiddenCount} more`}
              onActivate={() => props.onOpenProject(props.projectBoard.projectId)}
            />
          </KanbanOverviewCardItemElement>
        ) : null}
      </KanbanOverviewCardListElement>
    </KanbanOverviewProjectColumnElement>
  );
}

export function KanbanOverviewComposition(props: {
  readonly board: KanbanBoard;
  readonly onOpenProject: (projectId: ProjectId) => void;
  readonly onOpenCard: (card: KanbanCard) => void;
  readonly onCardContextMenu?: (card: KanbanCard, event: React.MouseEvent) => void;
  readonly onNewTask?: (projectId: ProjectId) => void;
  readonly nowMs?: number;
}) {
  const visibleProjects = props.board.projects.filter(
    (projectBoard) => projectBoard.totalCount > 0,
  );

  if (visibleProjects.length === 0) {
    return (
      <KanbanOverviewEmptyRootElement>
        <KanbanOverviewEmptyCopyElement>
          <KanbanOverviewEmptyTitleElement>
            Nothing on the board yet
          </KanbanOverviewEmptyTitleElement>
          <KanbanOverviewEmptyBodyElement>
            Drafted prompts, running turns, and completed chats will show up here automatically.
          </KanbanOverviewEmptyBodyElement>
        </KanbanOverviewEmptyCopyElement>
      </KanbanOverviewEmptyRootElement>
    );
  }

  return (
    <KanbanOverviewProjectsElement>
      {visibleProjects.map((projectBoard) => (
        <KanbanOverviewProjectComposition
          key={projectBoard.projectId}
          projectBoard={projectBoard}
          onOpenProject={props.onOpenProject}
          onOpenCard={props.onOpenCard}
          {...(props.onCardContextMenu ? { onCardContextMenu: props.onCardContextMenu } : {})}
          {...(props.onNewTask ? { onNewTask: props.onNewTask } : {})}
          {...(props.nowMs !== undefined ? { nowMs: props.nowMs } : {})}
        />
      ))}
    </KanbanOverviewProjectsElement>
  );
}
