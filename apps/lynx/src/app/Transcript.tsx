import { useEffect, useRef, useState } from '@lynx-js/react';
import botSvg from '@synara-central-icons/robot.svg?raw';
import toolSvg from '@synara-central-icons/zap.svg?raw';

import { PROVIDER_SEND_TURN_MAX_ATTACHMENTS } from '@synara/contracts';
import { resolveAssistantMessageDisplayText } from '@synara-web/components/chat/MessagesTimeline.logic';
import { resolveTranscriptMarkerRange } from '@synara/shared/threadMarkers';
import { formatShortTimestamp } from '@synara-web/timestampFormat';
// Same transcript typography math the Web bubbles use (font-size, line-height,
// footer size), so both targets derive geometry from one source instead of
// hand-tuned CSS on each side.
import {
  getChatTranscriptTextStyle,
  getChatTranscriptUserMessageTextStyle,
} from '@synara-web/components/chat/chatTypography';
import { ArrowDownIcon } from '@synara-web/lib/icons';
import {
  MessageAssistantRowComposition,
  MessageUserBubbleComposition,
  MessageUserRowComposition,
} from '@synara-web/components/chat/MessageRowComposition';
import { CollapsedWorkComposition } from '@synara-web/components/chat/CollapsedWorkComposition';
import { TimelineStatusRowComposition } from '@synara-web/components/chat/TimelineStatusRowComposition';

import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { useTheme } from '../adapters/useTheme.lynx';
import { useComposerDraftStore } from '../adapters/composerDraftStore.lynx';
import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  MessageCircleIcon,
  TextWrapIcon,
} from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import pinSvg from '@synara-central-icons/pin.svg?raw';
import {
  ChatMarkdown,
  type MarkdownTextSelection,
} from '../components/markdown/ChatMarkdown';
import {
  createAssistantSelectionAttachment,
  getAssistantSelectionValidationError,
} from '@synara-web/lib/assistantSelections';
import { bridgeCall } from '../platform/bridge';
import { queryClient, type ThreadTranscriptRow } from './queries';
import {
  buildTranscriptScrollToBottomParams,
  estimateTranscriptRowMainAxisSize,
  resolveTranscriptPinnedFromScroll,
  resolveTranscriptPinnedFromSample,
  resolveMessageWorkPlacement,
  resolveTranscriptWorkEntryDisplayText,
  transcriptRowVersion,
  type MessageTranscriptRow,
  type WorkLogEntry,
} from './transcriptRows.logic';
import { TRANSCRIPT_KEYBOARD_LANDMARK_PROPS } from './transcriptFocus.logic';

const BOTTOM_EPSILON = 30;
const SCROLL_EVENT_SOURCE = 2;
// Web's MessagesTimeline ends with a 64px footer inside a list that carries
// 16px bottom padding at this desktop breakpoint. Keep that breathing room as
// explicit list chrome so the final message-to-composer geometry matches.
const TRANSCRIPT_BOTTOM_CONTENT_INSET_PX = 80;
const IS_WEB_RELAY_MODE = process.env.SYNARA_LYNX_WEB_RELAY === '1';

function TranscriptStatusIcon(props: {
  readonly tone: 'thinking' | 'tool' | 'info' | 'error';
}) {
  const { svgColors } = useTheme();
  if (props.tone === 'error') {
    return <CircleAlertIcon className="TranscriptStatusIcon" size={13} />;
  }
  if (props.tone === 'info') {
    return <CheckIcon className="TranscriptStatusIcon" size={13} />;
  }
  return (
    <svg
      className="TranscriptStatusIcon"
      content={colorizeLynxSvg(
        props.tone === 'thinking' ? botSvg : toolSvg,
        svgColors.mutedForeground
      )}
    />
  );
}

function TranscriptWorkEntry({ entry }: { entry: WorkLogEntry }) {
  return (
    <TimelineStatusRowComposition
      displayText={resolveTranscriptWorkEntryDisplayText(entry)}
      fontSizePx={12}
      icon={<TranscriptStatusIcon tone={entry.tone} />}
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

function TranscriptSelectionAction(props: {
  readonly onAddToChat: () => void;
  readonly onHighlight: () => void;
  readonly onUnderline: () => void;
  readonly selection: MarkdownTextSelection;
}) {
  const highlight = useLynxInteractiveState({
    baseClassName: 'TranscriptSelectionAction',
    accessibleLabel: 'Highlight',
    onActivate: props.onHighlight,
  });
  const underline = useLynxInteractiveState({
    baseClassName: 'TranscriptSelectionAction',
    accessibleLabel: 'Underline',
    onActivate: props.onUnderline,
  });
  const addToChat = useLynxInteractiveState({
    baseClassName: 'TranscriptSelectionAction',
    accessibleLabel: 'Add to chat',
    onActivate: props.onAddToChat,
  });
  return (
    <view
      className="TranscriptSelectionToolbar"
      style={{
        left: `${props.selection.left}px`,
        top: `${props.selection.top + 8}px`,
      }}
      accessibility-element
      accessibility-label="Selection actions"
      accessibility-traits="summary"
    >
      <view className={highlight.className} {...highlight.eventProps}>
        <text className="TranscriptSelectionActionGlyph">✎</text>
        <text className="TranscriptSelectionActionLabel">Highlight</text>
      </view>
      <view className={underline.className} {...underline.eventProps}>
        <TextWrapIcon className="TranscriptSelectionActionIcon" size={13} />
        <text className="TranscriptSelectionActionLabel">Underline</text>
      </view>
      <view className={addToChat.className} {...addToChat.eventProps}>
        <MessageCircleIcon className="TranscriptSelectionActionIcon" size={13} />
        <text className="TranscriptSelectionActionLabel">Add to chat</text>
      </view>
    </view>
  );
}

function TranscriptMessage({
  chatFontSizePx,
  onOpenFileReference,
  pinnedMessageIds,
  row,
  threadId,
  timestampFormat,
  workspaceRoot,
}: {
  readonly chatFontSizePx: number;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly pinnedMessageIds: ReadonlySet<string>;
  row: MessageTranscriptRow;
  threadId: string;
  readonly timestampFormat: 'locale' | '12-hour' | '24-hour';
  readonly workspaceRoot: string | null;
}) {
  const { message } = row;
  const isUser = message.role === 'user';
  const [collapsedWorkOpen, setCollapsedWorkOpen] = useState(false);
  const [textSelection, setTextSelection] =
    useState<MarkdownTextSelection | null>(null);
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
  const draftAttachmentCount = useComposerDraftStore((state) => {
    const draft = state.draftsByThreadId[threadId];
    return (draft?.files.length ?? 0) + (draft?.assistantSelections.length ?? 0);
  });
  const assistantSelectionUnavailable =
    assistantText === null ||
    getAssistantSelectionValidationError({
      assistantMessageId: message.id,
      text: assistantText ?? '',
    }) !== null ||
    draftAttachmentCount >= PROVIDER_SEND_TURN_MAX_ATTACHMENTS;
  const addAssistantSelection = useComposerDraftStore(
    (state) => state.addAssistantSelection
  );
  const addToChat = useLynxInteractiveState({
    baseClassName: 'TranscriptMessageAction',
    accessibleLabel: 'Reference whole assistant message',
    disabled: assistantSelectionUnavailable,
    onActivate: () => {
      if (assistantText === null) return;
      const selection = createAssistantSelectionAttachment({
        assistantMessageId: message.id,
        text: assistantText,
      });
      if (selection) addAssistantSelection(threadId, selection);
    },
  });
  const messageHover = useLynxInteractiveState({
    baseClassName: `TranscriptMessageHoverRegion ${
      isUser
        ? 'TranscriptMessageHoverRegion--user'
        : 'TranscriptMessageHoverRegion--assistant'
    }`,
    focusable: false,
  });
  const copy = useLynxInteractiveState({
    baseClassName: 'TranscriptMessageAction',
    accessibleLabel: 'Copy message',
    onActivate: () => {
      'background only';
      const text = isUser ? message.text : assistantText;
      if (!text) return;
      void import(/* webpackMode: "eager" */ '../platform/clipboard').then(
        ({ clipboard }) => clipboard.writeText(text)
      );
    },
  });
  const pinned = pinnedMessageIds.has(message.id);
  const pin = useLynxInteractiveState({
    baseClassName: `TranscriptMessageAction${
      pinned ? ' TranscriptMessageAction--persistent' : ''
    }`,
    accessibleLabel: pinned ? 'Unpin from panel' : 'Pin to panel',
    onActivate: () => {
      'background only';
      void import(/* webpackMode: "eager" */ '../data/synaraClient').then(
        ({ dispatchSynaraCommand }) =>
          dispatchSynaraCommand({
            type: pinned
              ? 'thread.pinned-message.remove'
              : 'thread.pinned-message.add',
            commandId: `lynx-command-${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}` as never,
            threadId: threadId as never,
            messageId: message.id,
          }).then(() =>
            queryClient.invalidateQueries({
              queryKey: ['thread-detail', threadId],
            })
          )
      );
    },
  });
  const timestamp = formatShortTimestamp(
    message.createdAt,
    timestampFormat
  );
  function addSelectedTextToChat() {
    'background only';
    if (!textSelection) return;
    const selection = createAssistantSelectionAttachment({
      assistantMessageId: message.id,
      text: textSelection.text,
    });
    if (selection) addAssistantSelection(threadId, selection);
    setTextSelection(null);
  }
  function addMarker(style: 'highlight' | 'underline') {
    'background only';
    if (!textSelection || assistantText === null) return;
    const range = resolveTranscriptMarkerRange({
      messageText: assistantText,
      selectedText: textSelection.text,
    });
    if (!range) return;
    const now = Date.now();
    void import(/* webpackMode: "eager" */ '../data/synaraClient').then(
      ({ dispatchSynaraCommand }) =>
        dispatchSynaraCommand({
          type: 'thread.marker.add',
          commandId: `lynx-command-${now}-${Math.random()
            .toString(16)
            .slice(2)}` as never,
          threadId: threadId as never,
          markerId: `lynx-marker-${now}-${Math.random()
            .toString(16)
            .slice(2)}` as never,
          messageId: message.id,
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          selectedText: textSelection.text,
          style,
          color: style === 'highlight' ? 'yellow' : 'blue',
        }).then(() => {
          setTextSelection(null);
          return queryClient.invalidateQueries({
            queryKey: ['thread-detail', threadId],
          });
        })
    );
  }
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
    <view
      className={`TranscriptMessageRow TranscriptMessageRowUser ${messageHover.className}`}
      {...messageHover.eventProps}
    >
      <MessageUserRowComposition>
        <MessageUserBubbleComposition>
          <view
            className="TranscriptUserText"
            style={
              getChatTranscriptUserMessageTextStyle(
                chatFontSizePx
              ) as Record<string, string>
            }
          >
            <ChatMarkdown
              cwd={workspaceRoot}
              selectable
              text={message.text}
              variant="user"
              mentionReferences={message.mentions ?? []}
              onOpenFileReference={onOpenFileReference}
            />
          </view>
        </MessageUserBubbleComposition>
        <view className="TranscriptMessageFooter TranscriptMessageFooter--user">
          <text className="TranscriptMessageTimestamp">{timestamp}</text>
          <view className={copy.className} {...copy.eventProps}>
            <CopyIcon className="TranscriptMessageActionIcon" size={13} />
          </view>
        </view>
      </MessageUserRowComposition>
    </view>
  ) : (
    <view
      className={`TranscriptMessageRow TranscriptMessageRowAssistant ${messageHover.className}`}
      {...messageHover.eventProps}
    >
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
                <ChatMarkdown
                  cwd={workspaceRoot}
                  onOpenFileReference={onOpenFileReference}
                  text={item.message.text}
                />
              </view>
            )
          )}
        </CollapsedWorkComposition>
      ) : null}
      <MessageAssistantRowComposition>
        <TranscriptWorkEntries entries={leadingWorkEntries} />
        {assistantText === null ? null : (
          <view className="TranscriptAssistantContent">
            <view
              style={
                getChatTranscriptTextStyle(
                  chatFontSizePx
                ) as Record<string, string>
              }
            >
              <ChatMarkdown
                cwd={workspaceRoot}
                onOpenFileReference={onOpenFileReference}
                onTextSelection={setTextSelection}
                selectable
                text={assistantText}
              />
            </view>
          </view>
        )}
        <TranscriptWorkEntries entries={inlineWorkEntries} />
        {textSelection ? (
          <TranscriptSelectionAction
            selection={textSelection}
            onAddToChat={addSelectedTextToChat}
            onHighlight={() => addMarker('highlight')}
            onUnderline={() => addMarker('underline')}
          />
        ) : null}
        {assistantText === null ? null : (
          <view
            className={`TranscriptMessageFooter${
              pinned ? ' TranscriptMessageFooter--persistent' : ''
            }`}
          >
            <view className={pin.className} {...pin.eventProps}>
              <svg
                className="TranscriptMessageActionIcon"
                content={colorizeLynxSvg(pinSvg, 'var(--muted-foreground)')}
              />
            </view>
            <view className={copy.className} {...copy.eventProps}>
              <CopyIcon className="TranscriptMessageActionIcon" size={13} />
            </view>
            <view
              className={`${addToChat.className}${
                addToChat.disabled ? ' ui-disabled' : ''
              }`}
              {...addToChat.eventProps}
            >
              <MessageCircleIcon className="TranscriptMessageActionIcon" size={13} />
            </view>
            <text className="TranscriptMessageTimestamp">{timestamp}</text>
          </view>
        )}
      </MessageAssistantRowComposition>
    </view>
  );
}

function TranscriptRowContent({
  chatFontSizePx,
  onOpenFileReference,
  pinnedMessageIds,
  row,
  threadId,
  timestampFormat,
  workspaceRoot,
}: {
  readonly chatFontSizePx: number;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly pinnedMessageIds: ReadonlySet<string>;
  row: ThreadTranscriptRow;
  threadId: string;
  readonly timestampFormat: 'locale' | '12-hour' | '24-hour';
  readonly workspaceRoot: string | null;
}) {
  if (row.kind === 'message') {
    return (
      <TranscriptMessage
        chatFontSizePx={chatFontSizePx}
        onOpenFileReference={onOpenFileReference}
        pinnedMessageIds={pinnedMessageIds}
        row={row}
        threadId={threadId}
        timestampFormat={timestampFormat}
        workspaceRoot={workspaceRoot}
      />
    );
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

export interface TranscriptController {
  readonly scrollToMessage: (messageId: string) => void;
}

export function Transcript({
  chatFontSizePx,
  onOpenFileReference,
  pinnedMessageIds,
  rows,
  threadId,
  timestampFormat,
  onController,
  workspaceRoot,
}: {
  readonly chatFontSizePx: number;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly pinnedMessageIds: ReadonlySet<string>;
  readonly rows: readonly ThreadTranscriptRow[];
  readonly threadId: string;
  readonly timestampFormat: 'locale' | '12-hour' | '24-hour';
  readonly onController?: (controller: TranscriptController | null) => void;
  readonly workspaceRoot: string | null;
}) {
  const listRef = useRef<React.ElementRef<'list'>>(null);
  const pinnedRef = useRef(true);
  const [pinned, setPinned] = useState(true);

  function scrollToBottom() {
    'background only';
    const params = buildTranscriptScrollToBottomParams(rows.length, 1);
    if (!params) return;
    listRef.current
      ?.invoke({
        method: 'scrollToPosition',
        params,
      })
      .exec();
  }

  function scrollToMessage(messageId: string) {
    'background only';
    const index = rows.findIndex(
      (row) => row.kind === 'message' && row.message.id === messageId
    );
    if (index < 0) return;
    pinnedRef.current = false;
    setPinned(false);
    listRef.current
      ?.invoke({
        method: 'scrollToPosition',
        params: {
          index,
          offset: 0,
          smooth: true,
        },
      })
      .exec();
  }

  function handleScrollDetail(detail?: {
    deltaY?: number;
    scrollTop?: number;
    scrollHeight?: number;
    listHeight?: number;
    eventSource?: number;
  }) {
    'background only';
    const nextPinned = resolveTranscriptPinnedFromScroll({
      currentPinned: pinnedRef.current,
      detail,
      isWebRelayMode: IS_WEB_RELAY_MODE,
      nativeUserEventSource: SCROLL_EVENT_SOURCE,
      bottomEpsilon: BOTTOM_EPSILON,
    });
    if (nextPinned !== pinnedRef.current) {
      pinnedRef.current = nextPinned;
      setPinned(nextPinned);
    }
  }

  function handleScroll(event: {
    detail?: Parameters<typeof handleScrollDetail>[0];
  }) {
    'background only';
    handleScrollDetail(event.detail);
  }

  function handleScrollToLower() {
    'background only';
    if (IS_WEB_RELAY_MODE) return;
    if (pinnedRef.current) return;
    pinnedRef.current = true;
    setPinned(true);
  }

  useEffect(() => {
    'background only';
    if (pinnedRef.current) scrollToBottom();
  }, [rows.length, transcriptRowVersion(rows[rows.length - 1])]);

  useEffect(() => {
    'background only';
    if (!IS_WEB_RELAY_MODE) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function sampleWebTranscriptScroll() {
      'background only';
      try {
        const info = await bridgeCall<{
          readonly listHeight: number;
          readonly previousScrollTop: number | null;
          readonly scrollHeight: number;
          readonly scrollTop: number;
        } | null>('readTranscriptScroll');
        if (!cancelled && info) {
          const nextPinned = resolveTranscriptPinnedFromSample({
            currentPinned: pinnedRef.current,
            previousScrollTop: info.previousScrollTop,
            scrollTop: info.scrollTop,
            scrollHeight: info.scrollHeight,
            listHeight: info.listHeight,
            bottomEpsilon: BOTTOM_EPSILON,
          });
          if (nextPinned !== pinnedRef.current) {
            pinnedRef.current = nextPinned;
            setPinned(nextPinned);
          }
        }
      } catch {
        // The host can be between routes or shutting down. Keep the last-known
        // pin state and sample again while this transcript remains mounted.
      } finally {
        if (!cancelled) timeoutId = setTimeout(sampleWebTranscriptScroll, 120);
      }
    }

    timeoutId = setTimeout(sampleWebTranscriptScroll, 120);
    return () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    onController?.({ scrollToMessage });
    return () => onController?.(null);
  }, [onController, rows]);

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
        lower-threshold={BOTTOM_EPSILON}
        bindscrolltolower={handleScrollToLower}
      >
        {rows.map((row) => (
          <list-item
            item-key={row.id}
            key={row.id}
            estimated-main-axis-size-px={estimateTranscriptRowMainAxisSize(
              row,
              chatFontSizePx
            )}
          >
            <TranscriptRowContent
              chatFontSizePx={chatFontSizePx}
              onOpenFileReference={onOpenFileReference}
              pinnedMessageIds={pinnedMessageIds}
              row={row}
              threadId={threadId}
              timestampFormat={timestampFormat}
              workspaceRoot={workspaceRoot}
            />
          </list-item>
        ))}
        <list-item
          item-key="transcript-bottom-inset"
          estimated-main-axis-size-px={TRANSCRIPT_BOTTOM_CONTENT_INSET_PX}
        >
          <view className="TranscriptBottomInset" />
        </list-item>
      </list>
      {!pinned ? (
        <view
          className={jumpInteraction.className}
          aria-label="Scroll to bottom"
          {...jumpInteraction.eventProps}
        >
          <ArrowDownIcon className="TranscriptJumpIcon" />
        </view>
      ) : null}
    </view>
  );
}
