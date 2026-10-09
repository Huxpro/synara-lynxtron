// FILE: KanbanColumnComposition.tsx
// Purpose: Physical shared source for read-only kanban column anatomy, render
// cap, card order, empty state, and header capabilities.

import { useState } from "react";

import {
  KanbanColumnCardItemElement,
  KanbanColumnCardListElement,
  KanbanColumnCountElement,
  KanbanColumnDispatchTargetElement,
  KanbanColumnEmptyElement,
  KanbanColumnHeaderActionsElement,
  KanbanColumnHeaderElement,
  KanbanColumnNewCardElement,
  KanbanColumnRootElement,
  KanbanColumnShowMoreElement,
  KanbanColumnStatusElement,
  KanbanColumnTitleElement,
} from "~/components/kanban/KanbanColumnCompositionElements";
import { KanbanCardComposition } from "./KanbanCardComposition";
import { KANBAN_COLUMN_V2_LABELS as KANBAN_COLUMN_LABELS } from "@synara/shared/kanban";
import { type KanbanCard, type KanbanColumnKey } from "./kanban.logic";
import type { KanbanDragPoint } from "./kanbanDnd.logic";

export const KANBAN_DONE_RENDER_CAP = 30;

export function KanbanColumnComposition(props: {
  readonly columnKey: KanbanColumnKey;
  readonly cards: readonly KanbanCard[];
  readonly onOpenCard: (card: KanbanCard) => void;
  readonly onCardContextMenu?: (
    card: KanbanCard,
    event: React.MouseEvent,
    restoreFocus?: () => void,
  ) => void;
  readonly onCardDragPointerStart?:
    | ((card: KanbanCard, point: KanbanDragPoint) => void)
    | undefined;
  readonly dragSourceCardId?: string | null | undefined;
  readonly onNewCard?: (() => void) | undefined;
  readonly showDispatchTarget?: boolean | undefined;
  readonly dispatchTargetLabel?: string | undefined;
  readonly nowMs?: number | undefined;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleCards =
    props.columnKey === "done" && !showAll && props.cards.length > KANBAN_DONE_RENDER_CAP
      ? props.cards.slice(0, KANBAN_DONE_RENDER_CAP)
      : props.cards;
  const hiddenCount = props.cards.length - visibleCards.length;

  return (
    <KanbanColumnRootElement>
      <KanbanColumnHeaderElement>
        <KanbanColumnTitleElement>{KANBAN_COLUMN_LABELS[props.columnKey]}</KanbanColumnTitleElement>
        <KanbanColumnCountElement>{props.cards.length}</KanbanColumnCountElement>
        <KanbanColumnHeaderActionsElement>
          {props.showDispatchTarget ? (
            <KanbanColumnDispatchTargetElement>
              {props.dispatchTargetLabel ?? "Drop to send"}
            </KanbanColumnDispatchTargetElement>
          ) : null}
          {props.onNewCard ? (
            <KanbanColumnNewCardElement label="New task" onActivate={props.onNewCard} />
          ) : null}
          <KanbanColumnStatusElement column={props.columnKey} />
        </KanbanColumnHeaderActionsElement>
      </KanbanColumnHeaderElement>
      <KanbanColumnCardListElement>
        {visibleCards.map((card) => (
          <KanbanColumnCardItemElement key={card.cardId}>
            <KanbanCardComposition
              card={card}
              onOpen={props.onOpenCard}
              {...(props.onCardContextMenu ? { onContextMenu: props.onCardContextMenu } : {})}
              {...(props.onCardDragPointerStart
                ? { onDragPointerStart: props.onCardDragPointerStart }
                : {})}
              isDragSource={props.dragSourceCardId === card.cardId}
              {...(props.nowMs !== undefined ? { nowMs: props.nowMs } : {})}
            />
          </KanbanColumnCardItemElement>
        ))}
        {props.cards.length === 0 ? (
          <KanbanColumnEmptyElement>No cards</KanbanColumnEmptyElement>
        ) : null}
        {hiddenCount > 0 ? (
          <KanbanColumnCardItemElement>
            <KanbanColumnShowMoreElement
              label={`Show ${hiddenCount} more`}
              onActivate={() => setShowAll(true)}
            />
          </KanbanColumnCardItemElement>
        ) : null}
      </KanbanColumnCardListElement>
    </KanbanColumnRootElement>
  );
}
