import { useEffect, useRef, useState } from '@lynx-js/react';

import { resolveAssistantMessageDisplayText } from '@synara-web/components/chat/MessagesTimeline.logic';
// Same transcript typography math the Web bubbles use (font-size, line-height,
// footer size), so both targets derive geometry from one source instead of
// hand-tuned CSS on each side.
import {
  getChatTranscriptTextStyle,
  getChatTranscriptUserMessageTextStyle,
} from '@synara-web/components/chat/chatTypography';
import {
  MessageAssistantRowComposition,
  MessageUserBubbleComposition,
  MessageUserRowComposition,
} from '@synara-web/components/chat/MessageRowComposition';
import { CollapsedWorkComposition } from '@synara-web/components/chat/CollapsedWorkComposition';
import { TimelineStatusRowComposition } from '@synara-web/components/chat/TimelineStatusRowComposition';

import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { ChatMarkdown } from '../components/markdown/ChatMarkdown';
import type { ThreadTranscriptRow } from './queries';
import {
  estimateTranscriptRowMainAxisSize,
  resolveMessageWorkPlacement,
  transcriptRowVersion,
  type MessageTranscriptRow,
  type WorkLogEntry,
} from './transcriptRows.logic';
import { TRANSCRIPT_KEYBOARD_LANDMARK_PROPS } from './transcriptFocus.logic';

const BOTTOM_EPSILON = 30;
const SCROLL_EVENT_SOURCE = 2;

function statusIcon(tone: 'thinking' | 'tool' | 'info' | 'error'): string {
  if (tone === 'error') return '!';
  if (tone === 'tool') return '›';
  if (tone === 'thinking') return '…';
  return '✓';
}

function TranscriptWorkEntry({ entry }: { entry: WorkLogEntry }) {
  return (
    <TimelineStatusRowComposition
      displayText={entry.detail ? `${entry.label} ${entry.detail}` : entry.label}
      fontSizePx={12}
      icon={<text className="TranscriptStatusIcon">{statusIcon(entry.tone)}</text>}
      tone={entry.tone}
    />
  );
}

function TranscriptWorkEntries({
  entries,
}: {
  readonly entries: readonly WorkLogEntry[];
}) {
  if (entries.length === 0) return null;
  return (
    <view className="TranscriptWorkEntries">
      {entries.map((entry) => (
        <TranscriptWorkEntry key={entry.id} entry={entry} />
      ))}
    </view>
  );
}

function TranscriptMessage({ row }: { row: MessageTranscriptRow }) {
  const { message } = row;
  const isUser = message.role === 'user';
  const [collapsedWorkOpen, setCollapsedWorkOpen] = useState(false);
  const {
    collapsedTurnItems,
    hasCollapsedWork,
    leadingWorkEntries,
    inlineWorkEntries,
  } = resolveMessageWorkPlacement(row);
  // Same empty/streaming/"(empty response)" resolution the Web timeline uses,
  // so an assistant turn with no text renders identically on both targets.
  const assistantText = isUser
    ? null
    : resolveAssistantMessageDisplayText(row);
  if (message.role === 'system') {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowStatus">
        <TimelineStatusRowComposition
          displayText={message.text || 'System'}
          fontSizePx={12}
          statusOnly
          tone="info"
        />
      </view>
    );
  }
  return isUser ? (
    <view className="TranscriptMessageRow TranscriptMessageRowUser">
      <MessageUserRowComposition>
        <MessageUserBubbleComposition>
          <text
            className="TranscriptUserText"
            style={getChatTranscriptUserMessageTextStyle() as Record<string, string>}
          >
            {message.text}
          </text>
        </MessageUserBubbleComposition>
      </MessageUserRowComposition>
    </view>
  ) : (
    <view className="TranscriptMessageRow TranscriptMessageRowAssistant">
      {hasCollapsedWork ? (
        <CollapsedWorkComposition
          elapsed={row.collapsedWorkElapsed}
          open={collapsedWorkOpen}
          onOpenChange={setCollapsedWorkOpen}
        >
          {collapsedTurnItems.map((item) =>
            item.kind === 'work' ? (
              <TranscriptWorkEntry key={item.id} entry={item.entry} />
            ) : (
              <view key={item.id} className="TranscriptCollapsedNarration">
                <ChatMarkdown text={item.message.text} />
              </view>
            )
          )}
        </CollapsedWorkComposition>
      ) : null}
      <MessageAssistantRowComposition>
        <TranscriptWorkEntries entries={leadingWorkEntries} />
        {assistantText === null ? null : (
          <view style={getChatTranscriptTextStyle() as Record<string, string>}>
            <ChatMarkdown text={assistantText} />
          </view>
        )}
        <TranscriptWorkEntries entries={inlineWorkEntries} />
      </MessageAssistantRowComposition>
    </view>
  );
}

function TranscriptRowContent({ row }: { row: ThreadTranscriptRow }) {
  if (row.kind === 'message') {
    return <TranscriptMessage row={row} />;
  }
  if (row.kind === 'work') {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowStatus">
        {row.groupedEntries.map((entry) => (
          <TranscriptWorkEntry key={entry.id} entry={entry} />
        ))}
      </view>
    );
  }
  if (row.kind === 'working' || row.kind === 'working-header') {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowStatus">
        <TimelineStatusRowComposition
          displayText={row.kind === 'working-header' ? 'Working…' : 'Thinking'}
          fontSizePx={12}
          statusOnly
          tone="thinking"
        />
      </view>
    );
  }
  if (row.kind === 'proposed-plan') {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowStatus">
        <TimelineStatusRowComposition
          displayText="Plan ready"
          fontSizePx={12}
          statusOnly
          tone="info"
        />
      </view>
    );
  }
  return (
    <view className="TranscriptMessageRow TranscriptMessageRowStatus">
      <TimelineStatusRowComposition
        displayText="Preparing worktree…"
        fontSizePx={12}
        statusOnly
        tone="info"
      />
    </view>
  );
}

export function Transcript({ rows }: { readonly rows: readonly ThreadTranscriptRow[] }) {
  const listRef = useRef<React.ElementRef<'list'>>(null);
  const pinnedRef = useRef(true);
  const [pinned, setPinned] = useState(true);

  function scrollToBottom() {
    'background only';
    if (rows.length === 0) return;
    listRef.current
      ?.invoke({
        method: 'scrollToPosition',
        params: { index: rows.length - 1, alignTo: 'bottom', smooth: false },
      })
      .exec();
  }

  function handleScroll(event: {
    detail?: {
      scrollTop?: number;
      scrollHeight?: number;
      listHeight?: number;
      eventSource?: number;
    };
  }) {
    'background only';
    const detail = event.detail;
    if (
      detail?.eventSource !== SCROLL_EVENT_SOURCE ||
      detail.scrollTop === undefined ||
      detail.scrollHeight === undefined ||
      detail.listHeight === undefined
    ) {
      return;
    }
    const atBottom =
      detail.scrollTop + detail.listHeight >= detail.scrollHeight - BOTTOM_EPSILON;
    if (atBottom !== pinnedRef.current) {
      pinnedRef.current = atBottom;
      setPinned(atBottom);
    }
  }

  useEffect(() => {
    'background only';
    if (pinnedRef.current) scrollToBottom();
  }, [rows.length, transcriptRowVersion(rows[rows.length - 1])]);

  function jumpToLatest() {
    'background only';
    pinnedRef.current = true;
    setPinned(true);
    scrollToBottom();
  }

  const jumpInteraction = useLynxInteractiveState({
    baseClassName: 'TranscriptJump',
    onActivate: jumpToLatest,
  });

  return (
    <view className="TranscriptShell">
      <list
        ref={listRef}
        className="TranscriptList"
        {...TRANSCRIPT_KEYBOARD_LANDMARK_PROPS}
        scroll-orientation="vertical"
        need-visible-item-info={true}
        scroll-event-throttle={24}
        bindscroll={handleScroll}
      >
        {rows.map((row) => (
          <list-item
            item-key={row.id}
            key={row.id}
            estimated-main-axis-size-px={estimateTranscriptRowMainAxisSize(row)}
          >
            <TranscriptRowContent row={row} />
          </list-item>
        ))}
      </list>
      {!pinned ? (
        <view
          className={jumpInteraction.className}
          aria-label="Jump to latest"
          {...jumpInteraction.eventProps}
        >
          <text className="TranscriptJumpText">Jump to latest ↓</text>
        </view>
      ) : null}
    </view>
  );
}
