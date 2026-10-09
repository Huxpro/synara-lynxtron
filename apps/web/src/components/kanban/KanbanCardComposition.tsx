// FILE: KanbanCardComposition.tsx
// Purpose: Physical shared source for kanban-card visibility, ordering, and anatomy.
// Host tags and icons live in KanbanCardCompositionElements so Web and Lynx
// consume this same component tree without copying the card renderer.

import {
  KanbanCardAttachmentElement,
  KanbanCardBranchElement,
  KanbanCardColumnStatusElement,
  KanbanCardDraftPreviewElement,
  KanbanCardForkElement,
  KanbanCardMetaRowElement,
  KanbanCardOptimisticStatusElement,
  KanbanCardPinElement,
  KanbanCardProviderElement,
  KanbanCardPullRequestElement,
  KanbanCardRootElement,
  KanbanCardStatusPillElement,
  KanbanCardTimestampElement,
  KanbanCardTitleElement,
  KanbanCardTitleRowElement,
  KanbanCardTrailingElement,
  KanbanCardWorktreeElement,
} from "~/components/kanban/KanbanCardCompositionElements";
import { resolveThreadEnvironmentPresentation } from "~/lib/threadEnvironment";
import { formatRelativeTime } from "~/lib/relativeTime";
import { formatElapsed } from "../../session-logic";
import { resolveThreadStatusPill } from "../Sidebar.logic";
import { resolvePrStatePresentation } from "../pullRequest/pullRequestStatePresentation.logic";
import { KANBAN_COLUMN_LABELS, kanbanThreadCardId, type KanbanCard } from "./kanban.logic";
import type { KanbanDragPoint } from "./kanbanDnd.logic";

export interface KanbanCardCompositionProps {
  readonly card: KanbanCard;
  readonly onOpen?: ((card: KanbanCard) => void) | undefined;
  readonly onContextMenu?: (
    card: KanbanCard,
    event: React.MouseEvent,
    restoreFocus?: () => void,
  ) => void;
  readonly onDragPointerStart?: ((card: KanbanCard, point: KanbanDragPoint) => void) | undefined;
  readonly isOverlay?: boolean | undefined;
  readonly isDragSource?: boolean | undefined;
  readonly nowMs?: number | undefined;
  readonly visualState?: "default" | "hover" | "focus" | "pressed" | undefined;
}

const REDUNDANT_COLUMN_PILL_LABELS = new Set(["Working", "Connecting", "Completed"]);

export function KanbanCardComposition({
  card,
  onOpen,
  onContextMenu,
  onDragPointerStart,
  isOverlay = false,
  isDragSource = false,
  nowMs,
  visualState = "default",
}: KanbanCardCompositionProps) {
  const showDraftPreview =
    card.column === "draft" &&
    card.draftPrompt.length > 0 &&
    card.cardId === kanbanThreadCardId(card.threadId);
  const isForked = Boolean(card.thread?.forkSourceThreadId && !card.thread.sidechatSourceThreadId);
  const worktreeBadgeLabel = resolveThreadEnvironmentPresentation({
    envMode: card.envMode,
    worktreePath: card.worktreePath,
  }).worktreeBadgeLabel;
  const pullRequest = card.thread?.lastKnownPr ?? null;
  const pullRequestPresentation = pullRequest ? resolvePrStatePresentation(pullRequest) : null;
  const activeWorkElapsed =
    card.activeWorkStartedAt && nowMs
      ? formatElapsed(card.activeWorkStartedAt, new Date(nowMs).toISOString())
      : null;
  const statusPill = card.thread
    ? resolveThreadStatusPill({
        thread: card.thread,
        hasPendingApprovals: card.thread.hasPendingApprovals,
        hasPendingUserInput: card.thread.hasPendingUserInput,
      })
    : null;
  const visibleStatusPill =
    statusPill && !REDUNDANT_COLUMN_PILL_LABELS.has(statusPill.label) ? statusPill : null;

  return (
    <KanbanCardRootElement
      accessibleLabel={`${card.title}, ${
        card.isTerminal ? "Terminal" : KANBAN_COLUMN_LABELS[card.column]
      }`}
      isOverlay={isOverlay}
      isDragSource={isDragSource}
      visualState={visualState}
      onActivate={onOpen ? () => onOpen(card) : undefined}
      onContextMenu={onContextMenu ? (event) => onContextMenu(card, event) : undefined}
      onDragPointerStart={
        onDragPointerStart ? (point) => onDragPointerStart(card, point) : undefined
      }
    >
      <KanbanCardTitleRowElement>
        <KanbanCardTitleElement>{card.title}</KanbanCardTitleElement>
        {card.thread?.isPinned ? <KanbanCardPinElement /> : null}
      </KanbanCardTitleRowElement>
      {showDraftPreview ? (
        <KanbanCardDraftPreviewElement>{card.draftPrompt}</KanbanCardDraftPreviewElement>
      ) : null}
      <KanbanCardMetaRowElement>
        {card.isTerminal ? null : <KanbanCardProviderElement provider={card.provider} />}
        {card.branch ? <KanbanCardBranchElement label={card.branch} /> : null}
        {worktreeBadgeLabel ? <KanbanCardWorktreeElement label={worktreeBadgeLabel} /> : null}
        {isForked ? <KanbanCardForkElement /> : null}
        {pullRequest && pullRequestPresentation ? (
          <KanbanCardPullRequestElement
            number={pullRequest.number}
            title={pullRequest.title}
            presentation={pullRequestPresentation}
          />
        ) : null}
        {card.draftHasAttachments ? <KanbanCardAttachmentElement /> : null}
        <KanbanCardTrailingElement>
          {card.isOptimisticDispatch ? (
            <KanbanCardOptimisticStatusElement elapsed={activeWorkElapsed} />
          ) : (
            <>
              {visibleStatusPill ? <KanbanCardStatusPillElement pill={visibleStatusPill} /> : null}
              {activeWorkElapsed ? (
                <KanbanCardTimestampElement label={`Worked for ${activeWorkElapsed}`} />
              ) : card.timestamp ? (
                <KanbanCardTimestampElement label={formatRelativeTime(card.timestamp)} />
              ) : null}
            </>
          )}
          <KanbanCardColumnStatusElement
            column={card.column}
            label={card.isTerminal ? "Terminal" : KANBAN_COLUMN_LABELS[card.column]}
            isTerminal={card.isTerminal}
          />
        </KanbanCardTrailingElement>
      </KanbanCardMetaRowElement>
    </KanbanCardRootElement>
  );
}
