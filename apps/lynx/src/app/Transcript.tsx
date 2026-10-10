import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "@lynx-js/react";
import { ensureNativeApi } from "~/nativeApi";
import arrowDownSvg from "@tabler/icons/outline/arrow-down.svg?raw";

import {
  type ModelSelection,
  type ProviderInteractionMode,
  type RuntimeMode,
} from "@synara/contracts";
import {
  formatOutgoingComposerPrompt,
  resolveLatestTailUserMessageEditTarget,
  resolvePromptEffortFromModelSelection,
} from "@synara/shared/conversationEdit";
import {
  resolveAssistantMessageCopyState,
  resolveAssistantMessageDisplayText,
} from "@synara-web/components/chat/MessagesTimeline.logic";
import { chunkCollapsedTurnItems } from "@synara-web/components/chat/MessagesTimeline.logic";
import {
  classifyToolCallSummaryCategory,
  summarizeToolCallGroup,
} from "@synara-web/components/chat/toolCallGroup.logic";
import {
  createActiveTrailStore,
  deriveMessageTrailItems,
  isMessageTrailEligible,
  resolveActiveTrailSnapshot,
  resolveVisibleRowRangeFromAttachedCells,
  type ActiveTrailStore,
  type MessageTrailAnchor,
} from "@synara-web/components/chat/messageTrail.logic";
import {
  appendOriginalComposerPromptBlocks,
  deriveDisplayedUserMessageState,
} from "@synara-web/lib/terminalContext";
import { resolveSelectionActionLayout } from "@synara/shared/selectionActionLayout";
import { pinActionLabel } from "@synara-web/lib/pin.logic";
import { formatDayAwareTimestamp } from "@synara-web/timestampFormat";
import {
  createMarkdownCodeFence,
  formatShellTranscript,
  formatToolOutputText,
} from "@synara-web/lib/toolCallDetailsFormatting";
// Same transcript typography math the Web bubbles use (font-size, line-height,
// footer size), so both targets derive geometry from one source instead of
// hand-tuned CSS on each side.
import {
  getChatTranscriptLineHeightPx,
  getChatMessageFooterTextStyle,
  getChatTranscriptTextStyle,
  getChatTranscriptUserMessageTextStyle,
} from "@synara-web/components/chat/chatTypography";
import { ComposerColumnFrameSurface } from "@synara-web/components/chat/ComposerColumnFrameSurface";
import {
  MessageAssistantRowComposition,
  MessageUserBubbleComposition,
  MessageUserRowComposition,
} from "@synara-web/components/chat/MessageRowComposition";
import { CollapsedWorkComposition } from "@synara-web/components/chat/CollapsedWorkComposition";
import { TimelineStatusRowComposition } from "@synara-web/components/chat/TimelineStatusRowComposition";
import {
  formatAgentActivityEntryPreview,
  isReasoningUpdateWorkEntry,
} from "@synara-web/components/chat/agentActivity.logic";

import { useTranscriptScrollerOverhangPx } from "./ThreadComposerDock.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import { ChevronRightIcon, MessageCircleIcon, NewThreadIcon, Undo2Icon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import branchSvg from "@synara-central-icons/branch.svg?raw";
import copySvg from "@synara-central-icons/square-behind-square-6.svg?raw";
import pinSvg from "@synara-central-icons/pin.svg?raw";
import { MessageActionButtonLynx } from "../components/ui/MessageActionButton.lynx";
import { ChatMarkdown, type MarkdownTextSelection } from "../components/markdown/ChatMarkdown";
import { createAssistantSelectionAttachment } from "@synara-web/lib/assistantSelections";
import type { TranscriptAssistantSelection } from "@synara-web/components/chat/chatSelectionActions";
import { bridgeCall } from "../platform/bridge";
import { queryClient, type ThreadTranscriptRow } from "./queries";
import { TranscriptUserMessageEditForm } from "./TranscriptUserMessageEditForm.lynx";
import { TranscriptStatusIcon } from "./TranscriptStatusIcon.lynx";
import {
  TranscriptProposedPlanCard,
  TranscriptTurnChangedFiles,
  TranscriptUserAttachments,
  TranscriptUserInputExchange,
  TranscriptWorkingHeader,
} from "./TranscriptRowCards.lynx";
import {
  resolveProposedPlanCardPresentation,
  resolveTurnChangedFiles,
  resolveUserMessageAttachments,
} from "./transcriptRowCards.logic";
import { ThreadErrorBanner } from "../components/ThreadErrorBanner.lynx";
import { useRuntimeSocketUrl } from "./useRuntimeSocketUrl.lynx";
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
} from "./transcriptRows.logic";
import { TRANSCRIPT_KEYBOARD_LANDMARK_PROPS } from "./transcriptFocus.logic";
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from "../platform/motion.lynx";

const BOTTOM_EPSILON = 30;
const SCROLL_EVENT_SOURCE = 2;
// Web's MessagesTimeline ends with a 64px footer inside a list that carries
// 16px bottom padding at this desktop breakpoint. Keep that breathing room as
// explicit list chrome so the final message-to-composer geometry matches.
const TRANSCRIPT_BOTTOM_CONTENT_INSET_PX = 80;
const IS_WEB_RELAY_MODE = process.env.SYNARA_LYNX_WEB_RELAY === "1";

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
      props.active ? " TranscriptMessageTrailTick--active" : ""
    }${props.visible ? " TranscriptMessageTrailTick--visible" : ""}${
      props.focusDistance === 0
        ? " TranscriptMessageTrailItem--focused"
        : props.focusDistance === 1
          ? " TranscriptMessageTrailItem--near"
          : props.focusDistance === 2
            ? " TranscriptMessageTrailItem--far"
            : ""
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
      {/* A passive preview: hidden it still spans the transcript, and Lynx does not inherit
          pointer-events: none, so its text would bubble taps to the trail item. */}
      <view className="TranscriptMessageTrailTooltip" user-interaction-enabled={false}>
        <text className="TranscriptMessageTrailPreview">{props.item.preview}</text>
        {props.item.responsePreview ? (
          <text className="TranscriptMessageTrailResponse">{props.item.responsePreview}</text>
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
  const scrollerOverhangPx = useTranscriptScrollerOverhangPx();
  const items = deriveMessageTrailItems(
    props.rows.filter(
      (row): row is Extract<ThreadTranscriptRow, { readonly kind: "message" }> =>
        row.kind === "message",
    ),
  );
  const activeSnapshot = useSyncExternalStore(
    props.activeStore.subscribe,
    props.activeStore.get,
    props.activeStore.get,
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
      style={{ bottom: `${-scrollerOverhangPx}px` }}
      accessibility-element
      accessibility-label="Message navigation"
      accessibility-trait="summary"
    >
      <view className="TranscriptMessageTrailTrack">
        {items.map((item, index) => (
          <TranscriptMessageTrailItem
            key={item.id}
            active={activeSnapshot.currentId === item.id}
            focusDistance={hoveredIndex === null ? null : Math.abs(index - hoveredIndex)}
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
  if (category === "read" || category === "search") {
    return <TranscriptStatusIcon kind="search" tone={props.entry.tone} />;
  }
  if (category === "edit") {
    return <TranscriptStatusIcon kind="edit" tone={props.entry.tone} />;
  }
  return <TranscriptStatusIcon kind={props.entry.tone} tone={props.entry.tone} />;
}

function TranscriptJumpIcon() {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className="TranscriptJumpIcon"
      content={colorizeLynxSvg(arrowDownSvg, semanticIconColor("primary"))}
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
  readonly markdownTree?: import("../components/markdown/markdownAst.lynx").MarkdownNode | null;
  readonly workspaceRoot: string | null;
}) {
  if (entry.turnFailure) {
    // Upstream draws a failed turn as the error card, not as a work row.
    return <ThreadErrorBanner error={entry.turnFailure.message} inline title="Task interrupted" />;
  }
  if (isReasoningUpdateWorkEntry(entry)) {
    const reasoningText =
      formatAgentActivityEntryPreview(entry) ?? entry.preview ?? entry.detail ?? entry.label;
    return (
      <view className="TranscriptReasoningEntry">
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
      language: "bash",
      text: formatShellTranscript(details.command, details.output),
    });
  } else {
    const output = formatToolOutputText(details.output);
    if (output) blocks.push({ language: "text", text: output });
  }
  if (details.content) blocks.push({ language: "text", text: details.content });
  if (details.diff) blocks.push({ language: "diff", text: details.diff });
  if (details.files?.length) {
    blocks.push({ language: "text", text: details.files.join("\n") });
  }
  if (blocks.length === 0) return null;
  return (
    <view
      className="TranscriptToolDetailsContent"
      style={
        {
          "--transcript-tool-details-font-size": `${props.chatFontSizePx}px`,
          "--transcript-tool-details-line-height": `${getChatTranscriptLineHeightPx(props.chatFontSizePx)}px`,
        } as Record<string, string>
      }
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
    baseClassName: "TranscriptToolDetailsTrigger",
    accessibleLabel: `${open ? "Collapse" : "Expand"} ${label}`,
    accessibilityValue: open ? "Expanded" : "Collapsed",
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
          className={disclosureChevronClassName(open, "TranscriptToolDetailsChevron")}
          size={12}
        />
      </view>
      {present ? (
        <view className={disclosureContentClassName(open, "TranscriptToolDetailsPanel")}>
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
  placement,
  workspaceRoot,
}: {
  readonly chatFontSizePx: number;
  readonly entries: readonly WorkLogEntry[];
  /** Inside a message row: before its text (`mb-1.5`) or after it (`mt-1.5`). */
  readonly placement?: "leading" | "trailing";
  readonly markdownTreesByWorkEntryId?: Readonly<
    Record<string, import("../components/markdown/markdownAst.lynx").MarkdownNode | null>
  >;
  readonly workspaceRoot: string | null;
}) {
  if (entries.length === 0) return null;
  return (
    <view
      className={
        placement
          ? `TranscriptWorkEntries TranscriptWorkEntries--${placement}`
          : "TranscriptWorkEntries"
      }
    >
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
  readonly markdownTreesByWorkEntryId?: Readonly<
    Record<string, import("../components/markdown/markdownAst.lynx").MarkdownNode | null>
  >;
  readonly workspaceRoot: string | null;
}) {
  const [open, setOpen] = useState(false);
  const summary = summarizeToolCallGroup(props.entries);
  if (!summary) {
    return (
      <TranscriptWorkEntries
        chatFontSizePx={props.chatFontSizePx}
        entries={props.entries}
        markdownTreesByWorkEntryId={props.markdownTreesByWorkEntryId}
        workspaceRoot={props.workspaceRoot}
      />
    );
  }
  const interaction = useLynxInteractiveState({
    baseClassName: "TranscriptToolGroupTrigger",
    accessibleLabel: `${open ? "Collapse" : "Expand"} ${summary.label}`,
    accessibilityValue: open ? "Expanded" : "Collapsed",
    onActivate: () => setOpen((current) => !current),
  });
  return (
    <view className="TranscriptToolGroup">
      <view className={interaction.className} aria-expanded={open} {...interaction.eventProps}>
        <TranscriptWorkIcon entry={summary.iconEntry} />
        <text className="TranscriptToolGroupLabel">{summary.label}</text>
        <ChevronRightIcon
          className={disclosureChevronClassName(open, "TranscriptToolGroupChevron")}
          size={12}
        />
      </view>
      {open ? (
        <view className="TranscriptToolGroupEntries">
          <TranscriptWorkEntries
            chatFontSizePx={props.chatFontSizePx}
            entries={props.entries}
            markdownTreesByWorkEntryId={props.markdownTreesByWorkEntryId}
            workspaceRoot={props.workspaceRoot}
          />
        </view>
      ) : null}
    </view>
  );
}

/** Where the selection toolbar sits, so the new-chat composer can open in its place. */
export interface TranscriptSelectionAnchor {
  readonly left: number;
  readonly top: number;
  readonly placement: "top" | "bottom";
}

/** Upstream's transcript selection actions beyond Add to Chat (Side, new chat). */
export interface TranscriptSelectionHandlers {
  /** False inside a Side chat, which cannot open another Side. */
  readonly canAddToSide: boolean;
  readonly onAddToSide: (selection: TranscriptAssistantSelection) => Promise<void>;
  readonly onAddToNewChat: (
    selection: TranscriptAssistantSelection,
    anchor: TranscriptSelectionAnchor,
  ) => void;
}

function TranscriptSelectionToolbarButton(props: {
  readonly label: string;
  readonly disabled?: boolean;
  readonly onActivate: () => void;
}) {
  // Acting on press keeps the native text selection alive; the tap that follows the same
  // press is swallowed so it cannot fire twice.
  const pressActivatedRef = useRef(false);
  const interaction = useLynxInteractiveState({
    baseClassName: `TranscriptSelectionAction${
      props.disabled ? " TranscriptSelectionAction--disabled" : ""
    }`,
    accessibleLabel: props.label,
    disabled: props.disabled,
    onActivate: () => {
      if (!pressActivatedRef.current) props.onActivate();
    },
  });
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
      catchmousedown={() => {
        "background only";
        if (props.disabled || pressActivatedRef.current) return;
        pressActivatedRef.current = true;
        interaction.eventProps.bindmousedown?.();
        props.onActivate();
        setTimeout(() => {
          pressActivatedRef.current = false;
        }, 300);
      }}
    >
      <text className="TranscriptSelectionActionLabel">{props.label}</text>
    </view>
  );
}

/**
 * Electron's TranscriptSelectionAction: a divided strip of text actions sized to its labels
 * and centered in the layout's 320px slot, so no label clips at any font size.
 */
function TranscriptSelectionAction(props: {
  readonly assistantMessageId: string;
  readonly handlers?: TranscriptSelectionHandlers;
  readonly onAddToChat: () => void;
  readonly onDismiss: () => void;
  readonly selection: MarkdownTextSelection;
  readonly viewport: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
}) {
  const [sideBusy, setSideBusy] = useState(false);
  const [sideError, setSideError] = useState<string | null>(null);
  const layout = resolveSelectionActionLayout({
    selectionRect: props.selection,
    pointer: { x: props.selection.left, y: props.selection.top },
    viewport: props.viewport,
  });
  const selection: TranscriptAssistantSelection = {
    assistantMessageId: props.assistantMessageId,
    text: props.selection.text,
  };
  const handlers = props.handlers;
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
      <view className="TranscriptSelectionToolbarStrip">
        <TranscriptSelectionToolbarButton
          label="Add to Chat"
          disabled={sideBusy}
          onActivate={props.onAddToChat}
        />
        {handlers ? (
          <TranscriptSelectionToolbarButton
            label="Add to Side"
            disabled={sideBusy || !handlers.canAddToSide}
            onActivate={() => {
              "background only";
              setSideBusy(true);
              setSideError(null);
              void handlers
                .onAddToSide(selection)
                .then(() => props.onDismiss())
                .catch((error: unknown) =>
                  setSideError(error instanceof Error ? error.message : "Try again."),
                )
                .finally(() => setSideBusy(false));
            }}
          />
        ) : null}
        {handlers ? (
          <TranscriptSelectionToolbarButton
            label="Add to new Chat"
            disabled={sideBusy}
            onActivate={() => {
              "background only";
              handlers.onAddToNewChat(selection, layout);
              props.onDismiss();
            }}
          />
        ) : null}
      </view>
      {sideError ? (
        <text className="TranscriptSelectionToolbarError" accessibility-trait="text">
          {`Could not add selection to Side. ${sideError}`}
        </text>
      ) : null}
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
  onForkFromMessage,
  selectionHandlers,
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
  readonly onForkFromMessage?: (messageId: string) => void;
  readonly selectionHandlers?: TranscriptSelectionHandlers;
  readonly pinnedMessageIds: ReadonlySet<string>;
  row: MessageTranscriptRow;
  threadId: string;
  readonly timestampFormat: "locale" | "12-hour" | "24-hour";
  readonly selectionViewport: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly workspaceRoot: string | null;
}) {
  const { svgColors } = useTheme();
  const { message } = row;
  const isUser = message.role === "user";
  const [collapsedWorkOpen, setCollapsedWorkOpen] = useState(false);
  const { collapsedTurnItems, hasCollapsedWork, leadingWorkEntries, inlineWorkEntries } =
    resolveMessageWorkPlacement(row);
  // Same empty/streaming/"(empty response)" resolution the Web timeline uses,
  // so an assistant turn with no text renders identically on both targets.
  const assistantText = isUser ? null : resolveAssistantMessageDisplayText(row);
  const addAssistantSelection = useComposerDraftStore((state) => state.addAssistantSelection);
  const messageHover = useLynxInteractiveState({
    // The Web host maps DOM mouseover onto Lynx's ui-hover state only for
    // focusable controls or explicit hover owners. Message rows intentionally
    // stay out of the tab order, so mark this non-focusable region explicitly.
    baseClassName: `TranscriptMessageHoverRegion LynxWebHoverOwner ${
      isUser ? "TranscriptMessageHoverRegion--user" : "TranscriptMessageHoverRegion--assistant"
    }`,
    focusable: false,
  });
  const copy = useLynxInteractiveState({
    baseClassName: "TranscriptMessageAction",
    accessibleLabel: "Copy message",
    onActivate: () => {
      "background only";
      const text = isUser ? message.text : assistantText;
      if (!text) return;
      void import(/* webpackMode: "eager" */ "../platform/clipboard").then(({ clipboard }) =>
        clipboard.writeText(text),
      );
    },
  });
  const revertTurnCount = row.revertTurnCount;
  const revert = useLynxInteractiveState({
    baseClassName: "TranscriptMessageAction",
    accessibleLabel: "Revert to this message",
    disabled: revertTurnCount === undefined,
    onActivate: () => {
      "background only";
      if (revertTurnCount === undefined) return;
      void import(/* webpackMode: "eager" */ "../platform/dialogs").then(async ({ dialogs }) => {
        const confirmed = await dialogs.confirm(
          [
            `Revert this thread to checkpoint ${revertTurnCount}?`,
            "This will discard newer messages and turn diffs in this thread.",
            "This action cannot be undone.",
          ].join("\n"),
        );
        if (!confirmed) return;
        try {
          await ensureNativeApi().orchestration.dispatchCommand({
            type: "thread.checkpoint.revert",
            commandId: `lynx-command-${Date.now()}-${Math.random().toString(16).slice(2)}` as never,
            threadId: threadId as never,
            turnCount: revertTurnCount,
            scope: "thread",
            createdAt: new Date().toISOString(),
          });
          await queryClient.invalidateQueries({
            queryKey: ["thread-detail", threadId],
          });
        } catch (error) {
          onThreadError?.(error instanceof Error ? error.message : "Failed to revert message.");
        }
      });
    },
  });
  const displayedUserMessage = isUser
    ? deriveDisplayedUserMessageState(message.text, {
        // Same rule as Electron's MessagesTimeline: any image, file or quoted
        // selection gives the bubble visible content, so the bootstrap prompt hides.
        hideImageOnlyBootstrapPrompt: (message.attachments ?? []).some(
          (attachment) =>
            attachment.type === "image" ||
            attachment.type === "file" ||
            attachment.type === "assistant-selection",
        ),
        messageId: message.id,
      })
    : null;
  const edit = useLynxInteractiveState({
    baseClassName: "TranscriptMessageAction",
    accessibleLabel: "Edit message",
    disabled: !editable || editSubmitting,
    onActivate: () => {
      if (!displayedUserMessage?.copyText.trim()) return;
      onStartEdit(message.id, displayedUserMessage.copyText);
    },
  });
  const pinned = pinnedMessageIds.has(message.id);
  const pin = useLynxInteractiveState({
    baseClassName: `TranscriptMessageAction${pinned ? " TranscriptMessageAction--persistent" : ""}`,
    accessibleLabel: pinActionLabel("message", pinned),
    onActivate: () => {
      "background only";
      void ensureNativeApi()
        .orchestration.dispatchCommand({
          type: pinned ? "thread.pinned-message.remove" : "thread.pinned-message.add",
          commandId: `lynx-command-${Date.now()}-${Math.random().toString(16).slice(2)}` as never,
          threadId: threadId as never,
          messageId: message.id,
        })
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: ["thread-detail", threadId],
          }),
        );
    },
  });
  const timestamp = formatDayAwareTimestamp(message.createdAt, timestampFormat);
  const runtimeSocketUrl = useRuntimeSocketUrl();
  const userAttachments = isUser
    ? resolveUserMessageAttachments({ attachments: message.attachments, runtimeSocketUrl })
    : null;
  // Electron's footer rules: copy, fork and pin belong to a settled, persisted answer;
  // a pinned message keeps its pin so it can always be unpinned.
  const assistantCopyState = resolveAssistantMessageCopyState({
    text: assistantText,
    showCopyButton: row.showAssistantCopyButton,
    streaming: row.assistantCopyStreaming,
  });
  const showPinToggle = !isUser && (assistantCopyState.visible || pinned);
  const showForkAction = !isUser && assistantCopyState.visible && onForkFromMessage !== undefined;
  const isTerminalAssistantMessage =
    !isUser && row.showAssistantCopyButton && !row.assistantTurnInProgress;
  const assistantMeta = isTerminalAssistantMessage
    ? formatDayAwareTimestamp(message.createdAt, timestampFormat)
    : "";
  const fork = useLynxInteractiveState({
    baseClassName: "TranscriptMessageAction",
    accessibleLabel: "Fork thread from this turn",
    onActivate: () => onForkFromMessage?.(message.id),
  });
  const turnSummary = row.assistantTurnDiffSummary;
  const turnChangedFileCount = turnSummary?.files.length ?? 0;
  function addSelectedTextToChat() {
    "background only";
    if (!activeTextSelection) return;
    const selection = createAssistantSelectionAttachment({
      assistantMessageId: message.id,
      text: activeTextSelection.text,
    });
    if (selection)
      addAssistantSelection(threadId, { ...selection, assistantMessageId: message.id });
    onTextSelectionChange(null);
  }
  if (message.role === "system") {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowStatus">
        <TimelineStatusRowComposition
          displayText={message.text || "System"}
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
          <>
            {userAttachments ? (
              <TranscriptUserAttachments
                attachments={userAttachments}
                hasText={(displayedUserMessage?.visibleText ?? message.text).trim().length > 0}
              />
            ) : null}
            <MessageUserBubbleComposition>
              <view
                className="TranscriptUserText"
                style={
                  getChatTranscriptUserMessageTextStyle(chatFontSizePx) as Record<string, string>
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
          </>
        )}
        {editing ? null : (
          <view className="TranscriptMessageFooter TranscriptMessageFooter--user">
            <text
              className="TranscriptMessageTimestamp"
              style={getChatMessageFooterTextStyle(chatFontSizePx) as Record<string, string>}
            >
              {timestamp}
            </text>
            <MessageActionButtonLynx className={copy.className} eventProps={copy.eventProps}>
              <svg
                className="TranscriptMessageActionIcon"
                content={colorizeLynxSvg(copySvg, svgColors.iconSecondary)}
              />
            </MessageActionButtonLynx>
            {editable && displayedUserMessage?.copyText.trim() ? (
              <MessageActionButtonLynx className={edit.className} eventProps={edit.eventProps}>
                <NewThreadIcon
                  color={svgColors.iconSecondary}
                  className="TranscriptMessageActionIcon"
                  size={13}
                />
              </MessageActionButtonLynx>
            ) : null}
            {revertTurnCount === undefined ? null : (
              <MessageActionButtonLynx className={revert.className} eventProps={revert.eventProps}>
                <Undo2Icon
                  color={svgColors.iconSecondary}
                  className="TranscriptMessageActionIcon"
                  size={13}
                />
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
            chunk.kind === "tool-group" ? (
              <TranscriptToolGroup
                key={`tool-group:${chunk.id}`}
                chatFontSizePx={chatFontSizePx}
                entries={chunk.entries}
                markdownTreesByWorkEntryId={row.markdownTreesByWorkEntryId}
                workspaceRoot={workspaceRoot}
              />
            ) : chunk.item.kind === "work" ? (
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
                  preparsedTree={row.markdownTreesByMessageId?.[chunk.item.message.id]}
                  text={chunk.item.message.text}
                />
              </view>
            ),
          )}
        </CollapsedWorkComposition>
      ) : null}
      <MessageAssistantRowComposition>
        <TranscriptWorkEntries
          chatFontSizePx={chatFontSizePx}
          entries={leadingWorkEntries}
          markdownTreesByWorkEntryId={row.markdownTreesByWorkEntryId}
          placement="leading"
          workspaceRoot={workspaceRoot}
        />
        {assistantText === null ? null : (
          <view className="TranscriptAssistantContent">
            <view
              className="TranscriptAssistantTypography"
              style={getChatTranscriptTextStyle(chatFontSizePx) as Record<string, string>}
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
          <TranscriptTurnChangedFiles
            changes={resolveTurnChangedFiles(turnSummary.files)}
            onReview={onOpenTurnDiff ? () => onOpenTurnDiff(turnSummary.turnId) : undefined}
          />
        ) : null}
        <TranscriptWorkEntries
          chatFontSizePx={chatFontSizePx}
          entries={inlineWorkEntries}
          markdownTreesByWorkEntryId={row.markdownTreesByWorkEntryId}
          placement="trailing"
          workspaceRoot={workspaceRoot}
        />
        {activeTextSelection ? (
          <TranscriptSelectionAction
            assistantMessageId={message.id}
            handlers={selectionHandlers}
            selection={activeTextSelection}
            onAddToChat={addSelectedTextToChat}
            onDismiss={() => onTextSelectionChange(null)}
            viewport={selectionViewport}
          />
        ) : null}
        {assistantCopyState.visible || showPinToggle || assistantMeta.length > 0 ? (
          // Turn-end actions read Copy → Fork → Pin → time and stay visible at rest, as
          // in Electron: they belong to a settled turn.
          <view
            className={`TranscriptMessageFooter TranscriptMessageFooter--assistant${
              assistantCopyState.visible || showPinToggle
                ? " TranscriptMessageFooter--leading-action"
                : ""
            }`}
          >
            {assistantCopyState.visible ? (
              <MessageActionButtonLynx className={copy.className} eventProps={copy.eventProps}>
                <svg
                  className="TranscriptMessageActionIcon"
                  content={colorizeLynxSvg(copySvg, svgColors.iconSecondary)}
                />
              </MessageActionButtonLynx>
            ) : null}
            {showForkAction ? (
              <MessageActionButtonLynx className={fork.className} eventProps={fork.eventProps}>
                <svg
                  className="TranscriptMessageActionIcon"
                  content={colorizeLynxSvg(branchSvg, svgColors.iconSecondary)}
                />
              </MessageActionButtonLynx>
            ) : null}
            {showPinToggle ? (
              <MessageActionButtonLynx className={pin.className} eventProps={pin.eventProps}>
                <svg
                  className="TranscriptMessageActionIcon"
                  content={colorizeLynxSvg(
                    pinSvg,
                    pinned ? svgColors.foreground : svgColors.iconSecondary,
                  )}
                />
              </MessageActionButtonLynx>
            ) : null}
            {assistantMeta.length > 0 ? (
              <text
                className="TranscriptMessageMeta"
                style={getChatMessageFooterTextStyle(chatFontSizePx) as Record<string, string>}
              >
                {assistantMeta}
              </text>
            ) : null}
          </view>
        ) : null}
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
  onForkFromMessage,
  selectionHandlers,
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
    selection: MarkdownTextSelection | null,
  ) => void;
  readonly onThreadError?: (error: string | null) => void;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly onOpenTurnDiff?: (turnId: string) => void;
  readonly onForkFromMessage?: (messageId: string) => void;
  readonly selectionHandlers?: TranscriptSelectionHandlers;
  readonly pinnedMessageIds: ReadonlySet<string>;
  row: ThreadTranscriptRow;
  threadId: string;
  readonly timestampFormat: "locale" | "12-hour" | "24-hour";
  readonly selectionViewport: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly workspaceRoot: string | null;
}) {
  if (row.kind === "message") {
    return (
      <TranscriptMessage
        chatFontSizePx={chatFontSizePx}
        editDraft={editDraft}
        editError={editError}
        editing={editingMessageId === row.message.id}
        editSubmitting={editSubmitting}
        editable={editableMessageId === row.message.id}
        activeTextSelection={selectedAssistantMessageId === row.message.id ? textSelection : null}
        onCancelEdit={onCancelEdit}
        onEditDraftChange={onEditDraftChange}
        onStartEdit={onStartEdit}
        onSubmitEdit={onSubmitEdit}
        onTextSelectionChange={(selection) => onTextSelectionChange(row.message.id, selection)}
        onThreadError={onThreadError}
        onOpenFileReference={onOpenFileReference}
        onOpenTurnDiff={onOpenTurnDiff}
        onForkFromMessage={onForkFromMessage}
        selectionHandlers={selectionHandlers}
        pinnedMessageIds={pinnedMessageIds}
        row={row}
        threadId={threadId}
        timestampFormat={timestampFormat}
        selectionViewport={selectionViewport}
        workspaceRoot={workspaceRoot}
      />
    );
  }
  if (row.kind === "work") {
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
  if (row.kind === "working-header") {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowAssistant">
        <TranscriptWorkingHeader startedAt={row.createdAt} />
      </view>
    );
  }
  if (row.kind === "working") {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowStatus">
        <TimelineStatusRowComposition
          displayText="Thinking"
          fontSizePx={chatFontSizePx}
          statusOnly
          tone="thinking"
        />
      </view>
    );
  }
  if (row.kind === "proposed-plan") {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowCard">
        <TranscriptProposedPlanCard
          chatFontSizePx={chatFontSizePx}
          collapsedPreviewTree={row.planPreviewMarkdownTree}
          displayedTree={row.markdownTree}
          onOpenFileReference={onOpenFileReference}
          plan={resolveProposedPlanCardPresentation(row.proposedPlan.planMarkdown)}
          workspaceRoot={workspaceRoot}
        />
      </view>
    );
  }
  if (row.kind === "user-input") {
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowCard">
        <TranscriptUserInputExchange
          chatFontSizePx={chatFontSizePx}
          items={row.entry.userInputExchange}
        />
      </view>
    );
  }
  if (row.kind === "message-segment") {
    // One slice of a settled answer whose text was interleaved with tool rows.
    const segmentText = row.message.textSegments?.[row.segmentIndex]?.text ?? row.message.text;
    if (segmentText.trim().length === 0) return null;
    return (
      <view className="TranscriptMessageRow TranscriptMessageRowAssistant">
        <view
          className="TranscriptAssistantTypography"
          style={getChatTranscriptTextStyle(chatFontSizePx) as Record<string, string>}
        >
          <ChatMarkdown
            cwd={workspaceRoot}
            onOpenFileReference={onOpenFileReference}
            preparsedTree={row.markdownTree}
            text={segmentText}
          />
        </view>
      </view>
    );
  }
  // `worktree-setup`: the transient first-send step card.
  return (
    <view className="TranscriptMessageRow TranscriptMessageRowStatus">
      <TimelineStatusRowComposition
        displayText="Preparing worktree…"
        fontSizePx={chatFontSizePx}
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
  onForkFromMessage,
  selectionHandlers,
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
  readonly onForkFromMessage?: (messageId: string) => void;
  readonly selectionHandlers?: TranscriptSelectionHandlers;
  readonly pinnedMessageIds: ReadonlySet<string>;
  readonly rows: readonly ThreadTranscriptRow[];
  readonly threadId: string;
  readonly timestampFormat: "locale" | "12-hour" | "24-hour";
  readonly onController?: (controller: TranscriptController | null) => void;
  readonly onThreadError?: (error: string | null) => void;
  readonly runtimeMode: RuntimeMode | null;
  readonly sessionStatus: string | null;
  readonly viewportHeight: number;
  readonly viewportLeft?: number;
  readonly viewportWidth: number;
  readonly workspaceRoot: string | null;
}) {
  const listRef = useRef<React.ElementRef<"list">>(null);
  const pinnedRef = useRef(true);
  const [pinned, setPinned] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [selectedAssistantMessageId, setSelectedAssistantMessageId] = useState<string | null>(null);
  const [textSelection, setTextSelection] = useState<MarkdownTextSelection | null>(null);
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
      if (row.kind === "message" && row.message.role === "user") {
        anchors.push({ id: row.message.id as never, rowIndex });
      }
    });
    return anchors;
  }, [rows]);
  const transcriptMessages = useMemo(
    () => rows.flatMap((row) => (row.kind === "message" ? [row.message] : [])),
    [rows],
  );
  const latestEditTarget = useMemo(
    () =>
      resolveLatestTailUserMessageEditTarget({
        messages: transcriptMessages,
        activeTurnId,
      }),
    [activeTurnId, transcriptMessages],
  );
  const editableMessageId =
    latestEditTarget.editable &&
    modelSelection !== null &&
    runtimeMode !== null &&
    interactionMode !== null
      ? latestEditTarget.messageId
      : null;

  function cancelUserMessageEdit() {
    "background only";
    if (editSubmitting) return;
    setEditingMessageId(null);
    setEditDraft("");
    setEditError(null);
    onThreadError?.(null);
  }

  function startUserMessageEdit(messageId: string, text: string) {
    "background only";
    if (editSubmitting) return;
    setEditingMessageId(messageId);
    setEditDraft(text);
    setEditError(null);
    onThreadError?.(null);
  }

  async function submitUserMessageEdit() {
    "background only";
    const messageId = editingMessageId;
    const trimmedDraft = editDraft.trim();
    if (
      !messageId ||
      !trimmedDraft ||
      editSubmitting ||
      !modelSelection ||
      !runtimeMode ||
      !interactionMode
    )
      return;
    const target = resolveLatestTailUserMessageEditTarget({
      messages: transcriptMessages,
      activeTurnId,
    });
    if (!target.editable || target.messageId !== messageId) {
      const message = "Only the latest rollbackable user message can be edited.";
      setEditError(message);
      onThreadError?.(message);
      return;
    }
    if (sessionStatus === "starting" || sessionStatus === "running") {
      const message = "Wait for the current send to finish before editing.";
      setEditError(message);
      onThreadError?.(message);
      return;
    }
    const originalMessage = transcriptMessages[target.messageIndex];
    if (!originalMessage || originalMessage.role !== "user") return;
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
      await ensureNativeApi().orchestration.dispatchCommand({
        type: "thread.message.edit-and-resend",
        commandId: `lynx-command-${Date.now()}-${Math.random().toString(16).slice(2)}` as never,
        threadId: threadId as never,
        messageId: messageId as never,
        text: outgoingText,
        modelSelection,
        runtimeMode,
        interactionMode,
        createdAt: new Date().toISOString(),
      });
      setEditingMessageId(null);
      setEditDraft("");
      onThreadError?.(null);
      await queryClient.invalidateQueries({
        queryKey: ["thread-detail", threadId],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to edit message.";
      setEditError(message);
      onThreadError?.(message);
    } finally {
      setEditSubmitting(false);
    }
  }

  function scrollToBottom() {
    "background only";
    const params = buildTranscriptScrollToBottomParams(rows.length, 1);
    if (!params) return;
    listRef.current
      ?.invoke({
        method: "scrollToPosition",
        params,
      })
      .exec();
  }

  function scrollToMessage(messageId: string) {
    "background only";
    const index = rows.findIndex((row) => row.kind === "message" && row.message.id === messageId);
    if (index < 0) return;
    pinnedRef.current = false;
    setPinned(false);
    listRef.current
      ?.invoke({
        method: "scrollToPosition",
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
    "background only";
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
    "background only";
    setSelectedAssistantMessageId(null);
    setTextSelection(null);
    const visibleRange = resolveVisibleRowRangeFromAttachedCells({
      attachedCells: event.detail?.attachedCells ?? [],
      listHeight: event.detail?.listHeight,
    });
    if (visibleRange) {
      activeTrailStore.set(
        resolveActiveTrailSnapshot(userMessageAnchors, visibleRange.top, visibleRange.bottom),
      );
    }
    handleScrollDetail(event.detail);
  }

  function handleScrollToLower() {
    "background only";
    if (IS_WEB_RELAY_MODE) return;
    if (pinnedRef.current) return;
    pinnedRef.current = true;
    setPinned(true);
  }

  useEffect(() => {
    "background only";
    if (pinnedRef.current) scrollToBottom();
  }, [rows.length, transcriptRowVersion(rows[rows.length - 1])]);

  useEffect(() => {
    "background only";
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
    "background only";
    if (!IS_WEB_RELAY_MODE) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function sampleWebTranscriptScroll() {
      "background only";
      try {
        const info = await bridgeCall<{
          readonly listHeight: number;
          readonly previousScrollTop: number | null;
          readonly scrollHeight: number;
          readonly scrollTop: number;
        } | null>("readTranscriptScroll");
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
    "background only";
    pinnedRef.current = true;
    setPinned(true);
    scrollToBottom();
  }

  const jumpInteraction = useLynxInteractiveState({
    baseClassName: "TranscriptJump",
    onActivate: jumpToLatest,
  });

  return (
    <view
      className="TranscriptShell"
      bindlayoutchange={(event: {
        readonly detail?: { left?: number; top?: number; width?: number; height?: number };
      }) => {
        "background only";
        const detail = event.detail ?? {};
        if (
          typeof detail.left === "number" &&
          typeof detail.top === "number" &&
          typeof detail.width === "number" &&
          typeof detail.height === "number"
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
            estimated-main-axis-size-px={estimateTranscriptRowMainAxisSize(row, chatFontSizePx)}
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
                onForkFromMessage={onForkFromMessage}
                selectionHandlers={selectionHandlers}
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
