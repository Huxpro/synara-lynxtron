import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from '@lynx-js/react';
import arrowDownSvg from '@tabler/icons/outline/arrow-down.svg?raw';

import {
  PROVIDER_SEND_TURN_MAX_ATTACHMENTS,
  type ModelSelection,
  type ProviderInteractionMode,
  type RuntimeMode,
} from '@synara/contracts';
import {
  formatOutgoingComposerPrompt,
  resolveLatestTailUserMessageEditTarget,
  resolvePromptEffortFromModelSelection,
} from '@synara/shared/conversationEdit';
import { resolveAssistantMessageDisplayText } from '@synara-web/components/chat/MessagesTimeline.logic';
import {
  chunkCollapsedTurnItems,
} from '@synara-web/components/chat/MessagesTimeline.logic';
import {
  classifyToolCallSummaryCategory,
  summarizeToolCallGroup,
} from '@synara-web/components/chat/toolCallGroup.logic';
import {
  createActiveTrailStore,
  deriveMessageTrailItems,
  isMessageTrailEligible,
  resolveActiveTrailSnapshot,
  resolveMessageTrailPaneEdgeOffset,
  resolveVisibleRowRangeFromAttachedCells,
  type ActiveTrailStore,
  type MessageTrailAnchor,
} from '@synara-web/components/chat/messageTrail.logic';
import {
  appendOriginalComposerPromptBlocks,
  deriveDisplayedUserMessageState,
} from '@synara-web/lib/terminalContext';
import { resolveTranscriptMarkerRange } from '@synara/shared/threadMarkers';
import { resolveSelectionActionLayout } from '@synara/shared/selectionActionLayout';
import { formatShortTimestamp } from '@synara-web/timestampFormat';
import {
  createMarkdownCodeFence,
  formatShellTranscript,
  formatToolOutputText,
} from '@synara-web/lib/toolCallDetailsFormatting';
// Same transcript typography math the Web bubbles use (font-size, line-height,
// footer size), so both targets derive geometry from one source instead of
// hand-tuned CSS on each side.
import {
  getChatTranscriptLineHeightPx,
  getChatTranscriptTextStyle,
  getChatTranscriptUserMessageTextStyle,
} from '@synara-web/components/chat/chatTypography';
import { ComposerColumnFrameSurface } from '@synara-web/components/chat/ComposerColumnFrameSurface';
import {
  MessageAssistantRowComposition,
  MessageUserBubbleComposition,
  MessageUserRowComposition,
} from '@synara-web/components/chat/MessageRowComposition';
import { CollapsedWorkComposition } from '@synara-web/components/chat/CollapsedWorkComposition';
import { TimelineStatusRowComposition } from '@synara-web/components/chat/TimelineStatusRowComposition';
import {
  formatAgentActivityEntryPreview,
  isReasoningUpdateWorkEntry,
} from '@synara-web/components/chat/agentActivity.logic';

import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { useTheme } from '../adapters/useTheme.lynx';
import { useComposerDraftStore } from '../adapters/composerDraftStore.lynx';
import {
  ChevronRightIcon,
  CopyIcon,
  MessageCircleIcon,
  NewThreadIcon,
  PencilIcon,
  TextWrapIcon,
  Undo2Icon,
} from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import pinSvg from '@synara-central-icons/pin.svg?raw';
import { MessageActionButtonLynx } from '../components/ui/MessageActionButton.lynx';
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
import { TranscriptUserMessageEditForm } from './TranscriptUserMessageEditForm.lynx';
import { TranscriptStatusIcon } from './TranscriptStatusIcon.lynx';
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
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';

const BOTTOM_EPSILON = 30;
const SCROLL_EVENT_SOURCE = 2;
// Web's MessagesTimeline ends with a 64px footer inside a list that carries
// 16px bottom padding at this desktop breakpoint. Keep that breathing room as
// explicit list chrome so the final message-to-composer geometry matches.
const TRANSCRIPT_BOTTOM_CONTENT_INSET_PX = 80;
const IS_WEB_RELAY_MODE = process.env.SYNARA_LYNX_WEB_RELAY === '1';

function TranscriptMessageTrailItem(props: {
  readonly active: boolean;
  readonly focusDistance: number | null;
  readonly index: number;
  readonly item: ReturnType<typeof deriveMessageTrailItems>[number];
  readonly onActivate: () => void;
  readonly onHoverChange: (index: number | null) => void;
  readonly visible: boolean;
}) {
  const tick = useLynxInteractiveState({
    baseClassName: `TranscriptMessageTrailItem${
      props.active ? ' TranscriptMessageTrailTick--active' : ''
    }${props.visible ? ' TranscriptMessageTrailTick--visible' : ''}${
      props.focusDistance === 0
        ? ' TranscriptMessageTrailItem--focused'
        : props.focusDistance === 1
          ? ' TranscriptMessageTrailItem--near'
          : props.focusDistance === 2
            ? ' TranscriptMessageTrailItem--far'
            : ''
    }`,
    accessibleLabel: `Message ${props.item.ordinal}: ${props.item.preview.slice(0, 60)}`,
    onIntent: () => props.onHoverChange(props.index),
    onActivate: props.onActivate,
  });
  return (
    <view
      className={tick.className}
      {...tick.eventProps}
      bindmouseleave={() => {
        tick.eventProps.bindmouseleave?.();
        props.onHoverChange(null);
      }}
      bindblur={() => {
        tick.eventProps.bindblur?.();
        props.onHoverChange(null);
      }}
    >
      <view className="TranscriptMessageTrailTick" />
      <view className="TranscriptMessageTrailTooltip">
        <text className="TranscriptMessageTrailPreview">
          {props.item.preview}
        </text>
        {props.item.responsePreview ? (
          <text className="TranscriptMessageTrailResponse">
            {props.item.responsePreview}
          </text>
        ) : null}
      </view>
    </view>
  );
}

function TranscriptMessageTrail(props: {
  readonly activeStore: ActiveTrailStore;
  readonly onSelect: (messageId: string) => void;
  readonly rows: readonly ThreadTranscriptRow[];
  readonly viewportWidth: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const items = deriveMessageTrailItems(props.rows);
  const activeSnapshot = useSyncExternalStore(
    props.activeStore.subscribe,
    props.activeStore.get,
    props.activeStore.get
  );
  const visibleIds = new Set(activeSnapshot.visibleIds);
  if (
    !isMessageTrailEligible({
      itemCount: items.length,
      paneWidth: props.viewportWidth,
    })
  ) {
    return null;
  }
  return (
    <view
      className="TranscriptMessageTrail"
      style={{
        left: `${resolveMessageTrailPaneEdgeOffset(props.viewportWidth)}px`,
      }}
      accessibility-element
      accessibility-label="Message navigation"
      accessibility-trait="summary"
    >
      <view className="TranscriptMessageTrailTrack">
        {items.map((item, index) => (
          <TranscriptMessageTrailItem
            key={item.id}
            active={activeSnapshot.currentId === item.id}
            focusDistance={
              hoveredIndex === null ? null : Math.abs(index - hoveredIndex)
            }
            index={index}
            item={item}
            onActivate={() => props.onSelect(item.id)}
            onHoverChange={setHoveredIndex}
            visible={visibleIds.has(item.id)}
          />
        ))}
      </view>
    </view>
  );
}

function TranscriptWorkIcon(props: { readonly entry: WorkLogEntry }) {
  const category = classifyToolCallSummaryCategory(props.entry);
  if (category === 'read' || category === 'search') {
    return <TranscriptStatusIcon kind="search" tone={props.entry.tone} />;
  }
  if (category === 'edit') {
    return <TranscriptStatusIcon kind="edit" tone={props.entry.tone} />;
  }
  return <TranscriptStatusIcon kind={props.entry.tone} tone={props.entry.tone} />;
}

function TranscriptJumpIcon() {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className="TranscriptJumpIcon"
      content={colorizeLynxSvg(arrowDownSvg, semanticIconColor('primary'))}
    />
  );
}

function TranscriptWorkEntry({
  chatFontSizePx,
  entry,
  markdownTree,
  workspaceRoot,
}: {
  readonly chatFontSizePx: number;
  readonly entry: WorkLogEntry;
  readonly markdownTree?: import('../components/markdown/markdownAst.lynx').MarkdownNode | null;
  readonly workspaceRoot: string | null;
}) {
  if (isReasoningUpdateWorkEntry(entry)) {
    const reasoningText =
      formatAgentActivityEntryPreview(entry) ?? entry.preview ?? entry.detail ?? entry.label;
    return (
      <view
        className="TranscriptReasoningEntry"
        style={{
          fontSize: `${Math.max(11, chatFontSizePx - 1)}px`,
          lineHeight: '19px',
        }}
      >
        <ChatMarkdown cwd={workspaceRoot} preparsedTree={markdownTree} text={reasoningText} />
      </view>
    );
  }
  if (entry.toolDetails) {
    return (
      <TranscriptToolDetailsDisclosure
        chatFontSizePx={chatFontSizePx}
        entry={entry}
        workspaceRoot={workspaceRoot}
      />
    );
  }
  return (
    <TimelineStatusRowComposition
      displayText={resolveTranscriptWorkEntryDisplayText(entry)}
      fontSizePx={chatFontSizePx}
      icon={<TranscriptWorkIcon entry={entry} />}
      tone={entry.tone}
    />
  );
}

function TranscriptToolDetailsContent(props: {
  readonly chatFontSizePx: number;
  readonly entry: WorkLogEntry;
  readonly workspaceRoot: string | null;
}) {
  const details = props.entry.toolDetails;
  if (!details) return null;
  const blocks: Array<{ readonly language: string; readonly text: string }> = [];
  if (details.command) {
    blocks.push({
      language: 'bash',
      text: formatShellTranscript(details.command, details.output),
    });
  } else {
    const output = formatToolOutputText(details.output);
    if (output) blocks.push({ language: 'text', text: output });
  }
  if (details.content) blocks.push({ language: 'text', text: details.content });
  if (details.diff) blocks.push({ language: 'diff', text: details.diff });
  if (details.files?.length) {
    blocks.push({ language: 'text', text: details.files.join('\n') });
  }
  if (blocks.length === 0) return null;
  return (
    <view
      className="TranscriptToolDetailsContent"
      style={{
        '--transcript-tool-details-font-size': `${props.chatFontSizePx}px`,
        '--transcript-tool-details-line-height': `${getChatTranscriptLineHeightPx(props.chatFontSizePx)}px`,
      } as Record<string, string>}
    >
      {blocks.map((block, index) => (
        <ChatMarkdown
          key={`${block.language}:${index}`}
          className="TranscriptToolDetailsMarkdown"
          cwd={props.workspaceRoot}
          text={createMarkdownCodeFence(block.language, block.text)}
        />
      ))}
    </view>
  );
}

function TranscriptToolDetailsDisclosure(props: {
  readonly chatFontSizePx: number;
  readonly entry: WorkLogEntry;
  readonly workspaceRoot: string | null;
}) {
  const [open, setOpen] = useState(false);
  const present = useLynxDisclosurePresence(open);
  const label = resolveTranscriptWorkEntryDisplayText(props.entry);
  const interaction = useLynxInteractiveState({
    baseClassName: 'TranscriptToolDetailsTrigger',
    accessibleLabel: `${open ? 'Collapse' : 'Expand'} ${label}`,
    accessibilityValue: open ? 'Expanded' : 'Collapsed',
    onActivate: () => setOpen((current) => !current),
  });
  return (
    <view className="TranscriptToolDetailsDisclosure">
      <view className={interaction.className} aria-expanded={open} {...interaction.eventProps}>
        <TimelineStatusRowComposition
          compact
          displayText={label}
          fontSizePx={props.chatFontSizePx}
          icon={<TranscriptWorkIcon entry={props.entry} />}
          tone={props.entry.tone}
        />
        <ChevronRightIcon
          className={disclosureChevronClassName(open, 'TranscriptToolDetailsChevron')}
          size={12}
        />
      </view>
      {present ? (
        <view
          className={disclosureContentClassName(
            open,
            'TranscriptToolDetailsPanel'
          )}
        >
          <TranscriptToolDetailsContent
            chatFontSizePx={props.chatFontSizePx}
            entry={props.entry}
            workspaceRoot={props.workspaceRoot}
          />
        </view>
      ) : null}
    </view>
  );
}

function TranscriptWorkEntries({
  chatFontSizePx,
  entries,
  markdownTreesByWorkEntryId,
  workspaceRoot,
}: {
  readonly chatFontSizePx: number;
  readonly entries: readonly WorkLogEntry[];
  readonly markdownTreesByWorkEntryId?: Readonly<Record<string, import('../components/markdown/markdownAst.lynx').MarkdownNode | null>>;
  readonly workspaceRoot: string | null;
}) {
  if (entries.length === 0) return null;
  return (
    <view className="TranscriptWorkEntries">
      {entries.map((entry) => (
        <TranscriptWorkEntry
          key={entry.id}
          chatFontSizePx={chatFontSizePx}
          entry={entry}
          markdownTree={markdownTreesByWorkEntryId?.[entry.id]}
          workspaceRoot={workspaceRoot}
        />
      ))}
    </view>
  );
}

function TranscriptToolGroup(props: {
  readonly chatFontSizePx: number;
  readonly entries: readonly WorkLogEntry[];
  readonly markdownTreesByWorkEntryId?: Readonly<Record<string, import('../components/markdown/markdownAst.lynx').MarkdownNode | null>>;
  readonly workspaceRoot: string | null;
}) {
  const [open, setOpen] = useState(false);
  const summary = summarizeToolCallGroup(props.entries);
  if (!summary) {
    return (
      <TranscriptWorkEntries chatFontSizePx={props.chatFontSizePx} entries={props.entries} markdownTreesByWorkEntryId={props.markdownTreesByWorkEntryId} workspaceRoot={props.workspaceRoot} />
    );
  }
  const interaction = useLynxInteractiveState({
    baseClassName: 'TranscriptToolGroupTrigger',
    accessibleLabel: `${open ? 'Collapse' : 'Expand'} ${summary.label}`,
    accessibilityValue: open ? 'Expanded' : 'Collapsed',
    onActivate: () => setOpen((current) => !current),
  });
  return (
    <view className="TranscriptToolGroup">
      <view className={interaction.className} aria-expanded={open} {...interaction.eventProps}>
        <TranscriptWorkIcon entry={summary.iconEntry} />
        <text className="TranscriptToolGroupLabel">{summary.label}</text>
        <ChevronRightIcon
          className={disclosureChevronClassName(open, 'TranscriptToolGroupChevron')}
          size={12}
        />
      </view>
      {open ? (
        <view className="TranscriptToolGroupEntries">
          <TranscriptWorkEntries chatFontSizePx={props.chatFontSizePx} entries={props.entries} markdownTreesByWorkEntryId={props.markdownTreesByWorkEntryId} workspaceRoot={props.workspaceRoot} />
        </view>
      ) : null}
    </view>
  );
}

function TranscriptSelectionAction(props: {
  readonly onAddToChat: () => void;
  readonly onHighlight: () => void;
  readonly onUnderline: () => void;
  readonly selection: MarkdownTextSelection;
  readonly viewport: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
}) {
  const highlightPointerActivationRef = useRef(false);
  const underlinePointerActivationRef = useRef(false);
  const addToChatPointerActivationRef = useRef(false);
  const pointerActivate = (
    lock: { current: boolean },
    activate: () => void,
    beginPress?: () => void
  ) => {
    'background only';
    if (lock.current) return;
    lock.current = true;
    beginPress?.();
    activate();
    setTimeout(() => {
      lock.current = false;
    }, 300);
  };
  const highlight = useLynxInteractiveState({
    baseClassName: 'TranscriptSelectionAction',
    accessibleLabel: 'Highlight',
    onActivate: () => {
      if (!highlightPointerActivationRef.current) props.onHighlight();
    },
  });
  const underline = useLynxInteractiveState({
    baseClassName: 'TranscriptSelectionAction',
    accessibleLabel: 'Underline',
    onActivate: () => {
      if (!underlinePointerActivationRef.current) props.onUnderline();
    },
  });
  const addToChat = useLynxInteractiveState({
    baseClassName: 'TranscriptSelectionAction',
    accessibleLabel: 'Add to chat',
    onActivate: () => {
      if (!addToChatPointerActivationRef.current) props.onAddToChat();
    },
  });
  const layout = resolveSelectionActionLayout({
    selectionRect: props.selection,
    pointer: { x: props.selection.left, y: props.selection.top },
    viewport: props.viewport,
  });
  const compact = layout.width < 292;
  return (
    <view
      className={`TranscriptSelectionToolbar TranscriptSelectionToolbar--${layout.placement}`}
      style={{
        left: `${layout.left}px`,
        top: `${layout.top}px`,
        width: `${layout.width}px`,
      }}
      accessibility-element
      accessibility-label="Selection actions"
      accessibility-trait="summary"
    >
      <view
        className={highlight.className}
        {...highlight.eventProps}
        catchmousedown={() =>
          pointerActivate(
            highlightPointerActivationRef,
            props.onHighlight,
            highlight.eventProps.bindmousedown
          )
        }
      >
        <PencilIcon className="TranscriptSelectionActionIcon" size={14} />
        {compact ? null : (
          <text className="TranscriptSelectionActionLabel">Highlight</text>
        )}
      </view>
      <view
        className={underline.className}
        {...underline.eventProps}
        catchmousedown={() =>
          pointerActivate(
            underlinePointerActivationRef,
            props.onUnderline,
            underline.eventProps.bindmousedown
          )
        }
      >
        <TextWrapIcon className="TranscriptSelectionActionIcon" size={13} />
        {compact ? null : (
          <text className="TranscriptSelectionActionLabel">Underline</text>
        )}
      </view>
      <view
        className={addToChat.className}
        {...addToChat.eventProps}
        catchmousedown={() =>
          pointerActivate(
            addToChatPointerActivationRef,
            props.onAddToChat,
            addToChat.eventProps.bindmousedown
          )
        }
      >
        <MessageCircleIcon className="TranscriptSelectionActionIcon" size={13} />
        {compact ? null : (
          <text className="TranscriptSelectionActionLabel">Add to chat</text>
        )}
      </view>
    </view>
  );
}

function TranscriptMessage({
  chatFontSizePx,
  editDraft,
  editError,
  editing,
  editSubmitting,
  editable,
  activeTextSelection,
  onCancelEdit,
  onEditDraftChange,
  onStartEdit,
  onSubmitEdit,
  onTextSelectionChange,
  onThreadError,
  onOpenFileReference,
  onOpenTurnDiff,
  pinnedMessageIds,
  row,
  threadId,
  timestampFormat,
  selectionViewport,
  workspaceRoot,
}: {
  readonly chatFontSizePx: number;
  readonly editDraft: string;
  readonly editError: string | null;
  readonly editing: boolean;
  readonly editSubmitting: boolean;
  readonly editable: boolean;
  readonly activeTextSelection: MarkdownTextSelection | null;
  readonly onCancelEdit: () => void;
  readonly onEditDraftChange: (value: string) => void;
  readonly onStartEdit: (messageId: string, text: string) => void;
  readonly onSubmitEdit: () => void;
  readonly onTextSelectionChange: (selection: MarkdownTextSelection | null) => void;
  readonly onThreadError?: (error: string | null) => void;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly onOpenTurnDiff?: (turnId: string) => void;
  readonly pinnedMessageIds: ReadonlySet<string>;
  row: MessageTranscriptRow;
  threadId: string;
  readonly timestampFormat: 'locale' | '12-hour' | '24-hour';
  readonly selectionViewport: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly workspaceRoot: string | null;
}) {
  const { svgColors } = useTheme();
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
    // The Web host maps DOM mouseover onto Lynx's ui-hover state only for
    // focusable controls or explicit hover owners. Message rows intentionally
    // stay out of the tab order, so mark this non-focusable region explicitly.
    baseClassName: `TranscriptMessageHoverRegion LynxWebHoverOwner ${
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
  const revertTurnCount = row.revertTurnCount;
  const revert = useLynxInteractiveState({
    baseClassName: 'TranscriptMessageAction',
    accessibleLabel: 'Revert to this message',
    disabled: revertTurnCount === undefined,
    onActivate: () => {
      'background only';
      if (revertTurnCount === undefined) return;
      void import(/* webpackMode: "eager" */ '../platform/dialogs').then(
        async ({ dialogs }) => {
          const confirmed = await dialogs.confirm(
            [
              `Revert this thread to checkpoint ${revertTurnCount}?`,
              'This will discard newer messages and turn diffs in this thread.',
              'This action cannot be undone.',
            ].join('\n')
          );
          if (!confirmed) return;
          try {
            await dispatchSynaraCommand({
              type: 'thread.checkpoint.revert',
              commandId: `lynx-command-${Date.now()}-${Math.random()
                .toString(16)
                .slice(2)}` as never,
              threadId: threadId as never,
              turnCount: revertTurnCount,
              scope: 'thread',
              createdAt: new Date().toISOString(),
            });
            await queryClient.invalidateQueries({
              queryKey: ['thread-detail', threadId],
            });
          } catch (error) {
            onThreadError?.(
              error instanceof Error ? error.message : 'Failed to revert message.'
            );
          }
        }
      );
    },
  });
  const displayedUserMessage = isUser
    ? deriveDisplayedUserMessageState(message.text)
    : null;
  const edit = useLynxInteractiveState({
    baseClassName: 'TranscriptMessageAction',
    accessibleLabel: 'Edit message',
    disabled: !editable || editSubmitting,
    onActivate: () => {
      if (!displayedUserMessage?.copyText.trim()) return;
      onStartEdit(message.id, displayedUserMessage.copyText);
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
  const turnSummary = row.assistantTurnDiffSummary;
  const turnChangedFileCount = turnSummary?.files.length ?? 0;
  const turnAdditions =
    turnSummary?.files.reduce((sum, file) => sum + (file.additions ?? 0), 0) ?? 0;
  const turnDeletions =
    turnSummary?.files.reduce((sum, file) => sum + (file.deletions ?? 0), 0) ?? 0;
  const reviewTurnChanges = useLynxInteractiveState({
    baseClassName: 'TranscriptTurnChangesCard',
    accessibleLabel: turnSummary
      ? `Review changes for turn ${turnSummary.turnId}`
      : 'Review changes',
    disabled: !turnSummary || turnChangedFileCount === 0 || !onOpenTurnDiff,
    onActivate: () => {
      if (turnSummary) onOpenTurnDiff?.(turnSummary.turnId);
    },
  });
  function addSelectedTextToChat() {
    'background only';
    if (!activeTextSelection) return;
    const selection = createAssistantSelectionAttachment({
      assistantMessageId: message.id,
      text: activeTextSelection.text,
    });
    if (selection) addAssistantSelection(threadId, selection);
    onTextSelectionChange(null);
  }
  function addMarker(style: 'highlight' | 'underline') {
    'background only';
    if (!activeTextSelection || assistantText === null) return;
    const range = resolveTranscriptMarkerRange({
      messageText: assistantText,
      selectedText: activeTextSelection.text,
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
          selectedText: activeTextSelection.text,
          style,
          color: style === 'highlight' ? 'yellow' : 'blue',
        }).then(() => {
          onTextSelectionChange(null);
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
          fontSizePx={chatFontSizePx}
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
      <MessageUserRowComposition fullWidth={editing}>
        {editing ? (
          <TranscriptUserMessageEditForm
            chatFontSizePx={chatFontSizePx}
            disabled={editSubmitting}
            draft={editDraft}
            error={editError}
            onCancel={onCancelEdit}
            onDraftChange={onEditDraftChange}
            onSubmit={onSubmitEdit}
          />
        ) : (
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
              preparsedTree={row.markdownTree}
              selectable
              text={message.text}
              variant="user"
              mentionReferences={message.mentions ?? []}
              onOpenFileReference={onOpenFileReference}
            />
          </view>
        </MessageUserBubbleComposition>
        )}
        {editing ? null : (
        <view className="TranscriptMessageFooter TranscriptMessageFooter--user">
          <text className="TranscriptMessageTimestamp">{timestamp}</text>
          <MessageActionButtonLynx className={copy.className} eventProps={copy.eventProps}>
            <CopyIcon color={svgColors.iconSecondary} className="TranscriptMessageActionIcon" size={13} />
          </MessageActionButtonLynx>
          {editable && displayedUserMessage?.copyText.trim() ? (
            <MessageActionButtonLynx className={edit.className} eventProps={edit.eventProps}>
              <NewThreadIcon color={svgColors.iconSecondary} className="TranscriptMessageActionIcon" size={13} />
            </MessageActionButtonLynx>
          ) : null}
          {revertTurnCount === undefined ? null : (
            <MessageActionButtonLynx className={revert.className} eventProps={revert.eventProps}>
              <Undo2Icon color={svgColors.iconSecondary} className="TranscriptMessageActionIcon" size={13} />
            </MessageActionButtonLynx>
          )}
        </view>
        )}
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
          {chunkCollapsedTurnItems(collapsedTurnItems).map((chunk) =>
            chunk.kind === 'tool-group' ? (
              <TranscriptToolGroup
                key={`tool-group:${chunk.id}`}
                chatFontSizePx={chatFontSizePx}
                entries={chunk.entries}
                markdownTreesByWorkEntryId={row.markdownTreesByWorkEntryId}
                workspaceRoot={workspaceRoot}
              />
            ) : chunk.item.kind === 'work' ? (
              <TranscriptWorkEntry
                key={chunk.item.id}
                chatFontSizePx={chatFontSizePx}
                entry={chunk.item.entry}
                markdownTree={row.markdownTreesByWorkEntryId?.[chunk.item.entry.id]}
                workspaceRoot={workspaceRoot}
              />
            ) : (
              <view key={chunk.item.id} className="TranscriptCollapsedNarration">
                <ChatMarkdown
                  cwd={workspaceRoot}
                  onOpenFileReference={onOpenFileReference}
                  preparsedTree={
                    row.markdownTreesByMessageId?.[chunk.item.message.id]
                  }
                  text={chunk.item.message.text}
                />
              </view>
            )
          )}
        </CollapsedWorkComposition>
      ) : null}
      <MessageAssistantRowComposition>
        <TranscriptWorkEntries
          chatFontSizePx={chatFontSizePx}
          entries={leadingWorkEntries}
          markdownTreesByWorkEntryId={row.markdownTreesByWorkEntryId}
          workspaceRoot={workspaceRoot}
        />
        {assistantText === null ? null : (
          <view className="TranscriptAssistantContent">
            <view
              className="TranscriptAssistantTypography"
              style={
                getChatTranscriptTextStyle(
                  chatFontSizePx
                ) as Record<string, string>
              }
            >
              <ChatMarkdown
                cwd={workspaceRoot}
                onOpenFileReference={onOpenFileReference}
                onTextSelection={onTextSelectionChange}
                preparsedTree={row.markdownTree}
                selectable
                text={assistantText}
              />
            </view>
          </view>
        )}
        {!row.assistantTurnInProgress && turnSummary && turnChangedFileCount > 0 ? (
          <view
            className={reviewTurnChanges.className}
            {...reviewTurnChanges.eventProps}
          >
            <view className="TranscriptTurnChangesSummary">
              <text className="TranscriptTurnChangesLabel">
                {`Edited ${turnChangedFileCount} ${turnChangedFileCount === 1 ? 'file' : 'files'}`}
              </text>
              <text className="TranscriptTurnChangesStats">
                <text className="TranscriptTurnChangesAdditions">{`+${turnAdditions}`}</text>
                {' '}
                <text className="TranscriptTurnChangesDeletions">{`-${turnDeletions}`}</text>
              </text>
            </view>
            <text className="TranscriptTurnChangesReview">Review</text>
          </view>
        ) : null}
        <TranscriptWorkEntries
          chatFontSizePx={chatFontSizePx}
          entries={inlineWorkEntries}
          markdownTreesByWorkEntryId={row.markdownTreesByWorkEntryId}
          workspaceRoot={workspaceRoot}
        />
        {activeTextSelection ? (
          <TranscriptSelectionAction
            selection={activeTextSelection}
            onAddToChat={addSelectedTextToChat}
            onHighlight={() => addMarker('highlight')}
            onUnderline={() => addMarker('underline')}
            viewport={selectionViewport}
          />
        ) : null}
        {assistantText === null ? null : (
          <view
            className={`TranscriptMessageFooter${
              pinned ? ' TranscriptMessageFooter--persistent' : ''
            }`}
          >
            <MessageActionButtonLynx className={pin.className} eventProps={pin.eventProps}>
              <svg
                className="TranscriptMessageActionIcon"
                content={colorizeLynxSvg(pinSvg, svgColors.iconSecondary)}
              />
            </MessageActionButtonLynx>
            <MessageActionButtonLynx className={copy.className} eventProps={copy.eventProps}>
              <CopyIcon color={svgColors.iconSecondary} className="TranscriptMessageActionIcon" size={13} />
            </MessageActionButtonLynx>
            <view
              className={`${addToChat.className}${
                addToChat.disabled ? ' ui-disabled' : ''
              }`}
              {...addToChat.eventProps}
            >
              <MessageCircleIcon color={svgColors.iconSecondary} className="TranscriptMessageActionIcon" size={13} />
            </view>
            <text className="TranscriptMessageTimestamp">{timestamp}</text>
          </view>
        )}
      </MessageAssistantRowComposition>
    </view>
  );
}

function TranscriptRowContent({
  editDraft,
  editError,
  editingMessageId,
  editSubmitting,
  editableMessageId,
  selectedAssistantMessageId,
  textSelection,
  chatFontSizePx,
  onCancelEdit,
  onEditDraftChange,
  onStartEdit,
  onSubmitEdit,
  onTextSelectionChange,
  onThreadError,
  onOpenFileReference,
  onOpenTurnDiff,
  pinnedMessageIds,
  row,
  threadId,
  timestampFormat,
  selectionViewport,
  workspaceRoot,
}: {
  readonly editDraft: string;
  readonly editError: string | null;
  readonly editingMessageId: string | null;
  readonly editSubmitting: boolean;
  readonly editableMessageId: string | null;
  readonly selectedAssistantMessageId: string | null;
  readonly textSelection: MarkdownTextSelection | null;
  readonly chatFontSizePx: number;
  readonly onCancelEdit: () => void;
  readonly onEditDraftChange: (value: string) => void;
  readonly onStartEdit: (messageId: string, text: string) => void;
  readonly onSubmitEdit: () => void;
  readonly onTextSelectionChange: (
    messageId: string,
    selection: MarkdownTextSelection | null
  ) => void;
  readonly onThreadError?: (error: string | null) => void;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly onOpenTurnDiff?: (turnId: string) => void;
  readonly pinnedMessageIds: ReadonlySet<string>;
  row: ThreadTranscriptRow;
  threadId: string;
  readonly timestampFormat: 'locale' | '12-hour' | '24-hour';
  readonly selectionViewport: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly workspaceRoot: string | null;
}) {
  if (row.kind === 'message') {
    return (
      <TranscriptMessage
        chatFontSizePx={chatFontSizePx}
        editDraft={editDraft}
        editError={editError}
        editing={editingMessageId === row.message.id}
        editSubmitting={editSubmitting}
        editable={editableMessageId === row.message.id}
        activeTextSelection={
          selectedAssistantMessageId === row.message.id ? textSelection : null
        }
        onCancelEdit={onCancelEdit}
        onEditDraftChange={onEditDraftChange}
        onStartEdit={onStartEdit}
        onSubmitEdit={onSubmitEdit}
        onTextSelectionChange={(selection) =>
          onTextSelectionChange(row.message.id, selection)
        }
        onThreadError={onThreadError}
        onOpenFileReference={onOpenFileReference}
        onOpenTurnDiff={onOpenTurnDiff}
        pinnedMessageIds={pinnedMessageIds}
        row={row}
        threadId={threadId}
        timestampFormat={timestampFormat}
        selectionViewport={selectionViewport}
        workspaceRoot={workspaceRoot}
      />
    );
  }
  if (row.kind === 'work') {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowStatus">
        {row.groupedEntries.map((entry) => (
          <TranscriptWorkEntry
            key={entry.id}
            chatFontSizePx={chatFontSizePx}
            entry={entry}
            markdownTree={row.markdownTreesByWorkEntryId?.[entry.id]}
            workspaceRoot={workspaceRoot}
          />
        ))}
      </view>
    );
  }
  if (row.kind === 'working' || row.kind === 'working-header') {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowStatus">
        <TimelineStatusRowComposition
          displayText={row.kind === 'working-header' ? 'Working…' : 'Thinking'}
          fontSizePx={chatFontSizePx}
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
          fontSizePx={chatFontSizePx}
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
  activeTurnId,
  chatFontSizePx,
  interactionMode,
  modelSelection,
  onOpenFileReference,
  onOpenTurnDiff,
  pinnedMessageIds,
  rows,
  threadId,
  timestampFormat,
  onController,
  onThreadError,
  runtimeMode,
  sessionStatus,
  viewportHeight,
  viewportLeft = 0,
  viewportWidth,
  workspaceRoot,
}: {
  readonly activeTurnId: string | null;
  readonly chatFontSizePx: number;
  readonly interactionMode: ProviderInteractionMode | null;
  readonly modelSelection: ModelSelection | null;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly onOpenTurnDiff?: (turnId: string) => void;
  readonly pinnedMessageIds: ReadonlySet<string>;
  readonly rows: readonly ThreadTranscriptRow[];
  readonly threadId: string;
  readonly timestampFormat: 'locale' | '12-hour' | '24-hour';
  readonly onController?: (controller: TranscriptController | null) => void;
  readonly onThreadError?: (error: string | null) => void;
  readonly runtimeMode: RuntimeMode | null;
  readonly sessionStatus: string | null;
  readonly viewportHeight: number;
  readonly viewportLeft?: number;
  readonly viewportWidth: number;
  readonly workspaceRoot: string | null;
}) {
  const listRef = useRef<React.ElementRef<'list'>>(null);
  const pinnedRef = useRef(true);
  const [pinned, setPinned] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [selectedAssistantMessageId, setSelectedAssistantMessageId] =
    useState<string | null>(null);
  const [textSelection, setTextSelection] =
    useState<MarkdownTextSelection | null>(null);
  const [selectionViewport, setSelectionViewport] = useState({
    left: viewportLeft,
    top: 0,
    width: viewportWidth,
    height: viewportHeight,
  });
  const [activeTrailStore] = useState(createActiveTrailStore);
  const userMessageAnchors = useMemo<MessageTrailAnchor[]>(() => {
    const anchors: MessageTrailAnchor[] = [];
    rows.forEach((row, rowIndex) => {
      if (row.kind === 'message' && row.message.role === 'user') {
        anchors.push({ id: row.message.id as never, rowIndex });
      }
    });
    return anchors;
  }, [rows]);
  const transcriptMessages = useMemo(
    () => rows.flatMap((row) => (row.kind === 'message' ? [row.message] : [])),
    [rows]
  );
  const latestEditTarget = useMemo(
    () =>
      resolveLatestTailUserMessageEditTarget({
        messages: transcriptMessages,
        activeTurnId,
      }),
    [activeTurnId, transcriptMessages]
  );
  const editableMessageId =
    latestEditTarget.editable &&
    modelSelection !== null &&
    runtimeMode !== null &&
    interactionMode !== null
      ? latestEditTarget.messageId
      : null;

  function cancelUserMessageEdit() {
    'background only';
    if (editSubmitting) return;
    setEditingMessageId(null);
    setEditDraft('');
    setEditError(null);
    onThreadError?.(null);
  }

  function startUserMessageEdit(messageId: string, text: string) {
    'background only';
    if (editSubmitting) return;
    setEditingMessageId(messageId);
    setEditDraft(text);
    setEditError(null);
    onThreadError?.(null);
  }

  async function submitUserMessageEdit() {
    'background only';
    const messageId = editingMessageId;
    const trimmedDraft = editDraft.trim();
    if (
      !messageId ||
      !trimmedDraft ||
      editSubmitting ||
      !modelSelection ||
      !runtimeMode ||
      !interactionMode
    ) return;
    const target = resolveLatestTailUserMessageEditTarget({
      messages: transcriptMessages,
      activeTurnId,
    });
    if (!target.editable || target.messageId !== messageId) {
      const message = 'Only the latest rollbackable user message can be edited.';
      setEditError(message);
      onThreadError?.(message);
      return;
    }
    if (sessionStatus === 'starting' || sessionStatus === 'running') {
      const message = 'Wait for the current send to finish before editing.';
      setEditError(message);
      onThreadError?.(message);
      return;
    }
    const originalMessage = transcriptMessages[target.messageIndex];
    if (!originalMessage || originalMessage.role !== 'user') return;
    const textWithOriginalContext = appendOriginalComposerPromptBlocks({
      editedPrompt: trimmedDraft,
      originalPrompt: originalMessage.text,
    });
    const outgoingText = formatOutgoingComposerPrompt({
      provider: modelSelection.provider,
      model: modelSelection.model,
      effort: resolvePromptEffortFromModelSelection(modelSelection),
      text: textWithOriginalContext,
    });
    setEditSubmitting(true);
    setEditError(null);
    try {
      await dispatchSynaraCommand({
        type: 'thread.message.edit-and-resend',
        commandId: `lynx-command-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}` as never,
        threadId: threadId as never,
        messageId: messageId as never,
        text: outgoingText,
        modelSelection,
        runtimeMode,
        interactionMode,
        createdAt: new Date().toISOString(),
      });
      setEditingMessageId(null);
      setEditDraft('');
      onThreadError?.(null);
      await queryClient.invalidateQueries({
        queryKey: ['thread-detail', threadId],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to edit message.';
      setEditError(message);
      onThreadError?.(message);
    } finally {
      setEditSubmitting(false);
    }
  }

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
    detail?: Parameters<typeof handleScrollDetail>[0] & {
      attachedCells?: readonly {
        index?: number;
        top?: number;
        bottom?: number;
      }[];
    };
  }) {
    'background only';
    setSelectedAssistantMessageId(null);
    setTextSelection(null);
    const visibleRange = resolveVisibleRowRangeFromAttachedCells({
      attachedCells: event.detail?.attachedCells ?? [],
      listHeight: event.detail?.listHeight,
    });
    if (visibleRange) {
      activeTrailStore.set(
        resolveActiveTrailSnapshot(
          userMessageAnchors,
          visibleRange.top,
          visibleRange.bottom
        )
      );
    }
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
    // Transcript is reused across route changes. A manual upward scroll belongs
    // to the thread that received it; carrying pinned=false into the next
    // thread makes Native enter at an arbitrary inherited offset while Electron
    // canonically enters a thread at its tail. Explicit message jumps still run
    // through scrollToMessage after this route-entry reset.
    pinnedRef.current = true;
    setPinned(true);
    scrollToBottom();
  }, [threadId]);

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
    <view
      className="TranscriptShell"
      bindlayoutchange={(event: {
        readonly detail?: { left?: number; top?: number; width?: number; height?: number };
      }) => {
        'background only';
        const detail = event.detail ?? {};
        if (
          typeof detail.left === 'number' &&
          typeof detail.top === 'number' &&
          typeof detail.width === 'number' &&
          typeof detail.height === 'number'
        ) {
          setSelectionViewport({
            left: viewportLeft + detail.left,
            top: detail.top,
            width: detail.width,
            height: detail.height,
          });
        }
      }}
    >
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
            className="TranscriptListItem"
            estimated-main-axis-size-px={estimateTranscriptRowMainAxisSize(
              row,
              chatFontSizePx
            )}
          >
            <ComposerColumnFrameSurface className="TranscriptRowFrame">
              <TranscriptRowContent
                editDraft={editDraft}
                editError={editError}
                editingMessageId={editingMessageId}
                editSubmitting={editSubmitting}
                editableMessageId={editableMessageId}
                selectedAssistantMessageId={selectedAssistantMessageId}
                textSelection={textSelection}
                chatFontSizePx={chatFontSizePx}
                onCancelEdit={cancelUserMessageEdit}
                onEditDraftChange={setEditDraft}
                onStartEdit={startUserMessageEdit}
                onSubmitEdit={() => void submitUserMessageEdit()}
                onTextSelectionChange={(messageId, selection) => {
                  setSelectedAssistantMessageId(selection ? messageId : null);
                  setTextSelection(selection);
                }}
                onThreadError={onThreadError}
                onOpenFileReference={onOpenFileReference}
                 onOpenTurnDiff={onOpenTurnDiff}
                pinnedMessageIds={pinnedMessageIds}
                row={row}
                threadId={threadId}
                timestampFormat={timestampFormat}
                selectionViewport={selectionViewport}
                workspaceRoot={workspaceRoot}
              />
            </ComposerColumnFrameSurface>
          </list-item>
        ))}
        <list-item
          item-key="transcript-bottom-inset"
          estimated-main-axis-size-px={TRANSCRIPT_BOTTOM_CONTENT_INSET_PX}
        >
          <view className="TranscriptBottomInset" />
        </list-item>
      </list>
      <TranscriptMessageTrail
        activeStore={activeTrailStore}
        rows={rows}
        viewportWidth={viewportWidth}
        onSelect={scrollToMessage}
      />
      {!pinned ? (
        <view
          className={jumpInteraction.className}
          aria-label="Scroll to bottom"
          {...jumpInteraction.eventProps}
        >
          <TranscriptJumpIcon />
        </view>
      ) : null}
    </view>
  );
}
