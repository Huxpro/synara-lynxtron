// FILE: KanbanProjectBoardView.tsx
// Purpose: Full 3-column board for one project — drag a Draft card onto In Progress to
//          dispatch its prompt, or reorder drafts; other moves are derived-only.
// Layer: UI component (owns the board DndContext)
// Exports: KanbanProjectBoardView

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRef, useState } from "react";

import { toastManager } from "~/components/ui/toast";
import { KanbanCardView } from "./KanbanCardView";
import { KanbanColumn, parseKanbanColumnDropId } from "./KanbanColumn";
import {
  reorderDraftCardIds,
  type KanbanCard,
  type KanbanColumnKey,
  type KanbanProjectBoard,
} from "./kanban.logic";
import { useKanbanUiStore } from "../../kanbanUiStore";
import { useKanbanDraftStart } from "./useKanbanDraftStart";

function resolveDropColumn(board: KanbanProjectBoard, overId: string): KanbanColumnKey | null {
  const columnDrop = parseKanbanColumnDropId(overId);
  if (columnDrop) {
    return columnDrop.projectId === board.projectId ? columnDrop.column : null;
  }
  // Sortable draft cards are the only non-column droppables on this board.
  return board.draft.some((card) => card.cardId === overId) ? "draft" : null;
}

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCorners(args);
};

export function KanbanProjectBoardView({
  board,
  onOpenCard,
  onCardContextMenu,
  onNewTask,
  nowMs,
}: {
  board: KanbanProjectBoard;
  onOpenCard: (card: KanbanCard) => void;
  onCardContextMenu?: ((card: KanbanCard, event: React.MouseEvent) => void) | undefined;
  onNewTask: () => void;
  nowMs?: number;
}) {
  const setDraftOrder = useKanbanUiStore((state) => state.setDraftOrder);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  // A completed drag still emits a click on the source card; swallow exactly that one
  // so dropping a card never also opens its chat.
  const suppressClickRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const handleOpenCard = (card: KanbanCard) => {
    if (suppressClickRef.current) {
      return;
    }
    onOpenCard(card);
  };
  const startDraft = useKanbanDraftStart(onOpenCard);

  const handleDragStart = (event: DragStartEvent) => {
    const card = board.draft.find((candidate) => candidate.cardId === event.active.id) ?? null;
    setActiveCard(card);
    suppressClickRef.current = true;
  };

  const releaseClickSuppression = () => {
    // The trailing click (if any) fires synchronously after dragend; release on the
    // next tick so regular clicks keep working when the drop happens off-card.
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    releaseClickSuppression();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    releaseClickSuppression();
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const card = board.draft.find((candidate) => candidate.cardId === activeId);
    if (!card) {
      return;
    }
    const overId = String(over.id);
    const targetColumn = resolveDropColumn(board, overId);
    if (targetColumn === "draft") {
      const visibleCardIds = board.draft.map((draftCard) => draftCard.cardId);
      const nextOrder =
        overId === activeId
          ? null
          : board.draft.some((draftCard) => draftCard.cardId === overId)
            ? reorderDraftCardIds(visibleCardIds, activeId, overId)
            : // Dropped on the column body itself: move to the end.
              reorderDraftCardIds(visibleCardIds, activeId, visibleCardIds.at(-1) ?? activeId);
      if (nextOrder) {
        setDraftOrder(board.projectId, nextOrder);
      }
      return;
    }
    if (targetColumn === "inProgress") {
      // A drag that started before the board re-derived could re-drop a card whose
      // dispatch is still settling; a second drop must not queue another turn.
      if (useKanbanUiStore.getState().optimisticDispatchByThreadId[card.threadId]) {
        return;
      }
      void startDraft(card);
      return;
    }
    if (targetColumn === "done") {
      toastManager.add({
        type: "info",
        title: "Done is derived automatically",
        description: "Cards move here when their runs complete.",
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full min-h-0 gap-3 overflow-x-auto px-4 pb-4">
        <KanbanColumn
          projectId={board.projectId}
          columnKey="draft"
          cards={board.draft}
          onOpenCard={handleOpenCard}
          onCardContextMenu={onCardContextMenu}
          sortable
          droppable
          activeCard={activeCard}
          onNewCard={onNewTask}
          {...(nowMs !== undefined ? { nowMs } : {})}
        />
        <KanbanColumn
          projectId={board.projectId}
          columnKey="inProgress"
          cards={board.inProgress}
          onOpenCard={handleOpenCard}
          onCardContextMenu={onCardContextMenu}
          droppable
          activeCard={activeCard}
          {...(nowMs !== undefined ? { nowMs } : {})}
        />
        <KanbanColumn
          projectId={board.projectId}
          columnKey="done"
          cards={board.done}
          onOpenCard={handleOpenCard}
          onCardContextMenu={onCardContextMenu}
          droppable
          activeCard={activeCard}
          {...(nowMs !== undefined ? { nowMs } : {})}
        />
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <KanbanCardView card={activeCard} isOverlay {...(nowMs !== undefined ? { nowMs } : {})} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
