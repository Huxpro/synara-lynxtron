import { useEffect, useInitData, useMemo, useRef, useState } from "@lynx-js/react";
import { getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef } from "@lynx-js/types";
import { useQuery } from "@tanstack/react-query";
import type {
  ModelSelection,
  ProviderKind,
  ProviderMentionReference,
  ProviderSkillReference,
  ServerProviderStatus,
  OrchestrationThreadActivity,
  RuntimeMode,
} from "@synara/contracts";
import agentMentionSvg from "@synara-central-icons/robot.svg?raw";
import skillSvg from "@synara-central-icons/building-blocks.svg?raw";
import terminalSvg from "@synara-central-icons/console.svg?raw";
import {
  resolveChatComposerPlaceholder,
  resolveEmptyComposerEditorMinHeightPx,
  resolveSessionPhase,
} from "@synara/shared/composerPlaceholder";
import { DEFAULT_CHAT_FONT_SIZE_PX, normalizeChatFontSizePx } from "@synara-web/chatFontSize";

import { useComposerDraftStore } from "../../adapters/composerDraftStore.lynx";
import { resolveNativeComposerMaxLines } from "./composerNativeLines.logic";
import { useTheme } from "../../adapters/useTheme.lynx";
import { ClockIcon, ExternalLinkIcon } from "../../lib/icons.lynx";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import { dialogs } from "../../platform/dialogs";
import { bridgeCall, onGlobalEvent } from "../../platform/bridge";
import {
  claimComposerInputFocus,
  subscribeTerminalInputFocusOwner,
} from "../../platform/inputFocusOwnership.lynx";
import { clipboard as clipboardPort } from "../../platform/clipboard";
import { sleepOnHost } from "../../platform/timer";
import { fetchSidebarSnapshot, resolveNativeAssistantDeliveryMode } from "../../app/queries";
import {
  splitPromptIntoComposerSegments,
  type ComposerPromptSegment,
} from "@synara-web/composer-editor-mentions";
import { detectComposerTrigger, type ComposerTrigger } from "@synara-web/composer-logic";
import {
  ComposerCommandMenuComposition,
  type ComposerCommandItem,
} from "@synara-web/components/chat/ComposerCommandMenuComposition";
import { buildWorkspacePathComposerItems } from "@synara-web/components/chat/ComposerPathMentionItems";
import { buildThreadMentionComposerItems } from "@synara-web/components/chat/ComposerThreadMentionItems";
import { ComposerExtrasMenuComposition } from "@synara-web/components/chat/ComposerExtrasMenuComposition";
import { getComposerTraitSelection } from "@synara-web/components/chat/composerTraits";
import {
  buildSkillSearchFields,
  providerSkillDisplayName,
  rankProviderDiscoveryItems,
} from "@synara-web/lib/providerDiscovery";
import { resolveRuntimeModelDescriptor } from "@synara-web/components/chat/runtimeModelCapabilities";
import { ComposerRuntimeModeControlComposition } from "@synara-web/components/chat/ComposerRuntimeModeControlComposition";
import { shouldUseCompactComposerFooter } from "@synara-web/components/composerFooterLayout";
import {
  deriveCumulativeCostUsd,
  deriveContextWindowMeterDisplay,
  deriveLatestContextWindowState,
} from "@synara-web/lib/contextWindow";
import { ComposerContextWindowMeterElement } from "../../adapters/ComposerInputCompositionElements.lynx";
import { ComposerReferenceAttachmentsComposition } from "@synara-web/components/chat/ComposerReferenceAttachmentsComposition";
import {
  ComposerEditorRegionComposition,
  ComposerFooterContentComposition,
  ComposerFooterRowComposition,
  ComposerInputSurfaceComposition,
  ComposerPrimaryActionComposition,
} from "@synara-web/components/chat/ComposerInputComposition";
import { ComposerLifecycleStatus } from "@synara-web/components/chat/ComposerLifecycleStatus";
import {
  formatComposerSkillChipLabel,
  formatComposerSlashCommandChipLabel,
  resolveAgentChipColor,
} from "@synara-web/components/composerInlineChip.logic";
import { buildModelSelection, buildNextProviderOptions } from "@synara-web/providerModelOptions";
import { isProviderKind } from "@synara-web/providerOrdering";
import {
  appendPastedTextToEditablePrompt,
  createPastedTextDraft,
  type PastedTextDraft,
} from "@synara-web/lib/composerPastedText";
import type { TerminalContextDraft } from "@synara-web/lib/terminalContext";
import {
  dispatchSynaraCommand,
  fetchServerConfig,
  fetchProviderModels,
  fetchProviderSkills,
  searchProjectEntries,
} from "../../data/synaraClient.lynx";
import {
  buildComposerInteractionModeSetCommand,
  buildComposerSendText,
  buildComposerRuntimeModeSetCommand,
  buildComposerTurnInterruptCommand,
  buildComposerTurnStartCommand,
  isConnectingComposerSession,
  isRunningComposerSession,
  runComposerSendTransaction,
} from "./composerDispatch.logic";
import { resolveComposerInputTransition } from "./composerPastedTextInput.logic";
import {
  cutComposerNativeEditorSelection,
  normalizeComposerNativeEditorSnapshot,
  selectAllComposerNativeEditor,
  type ComposerNativeEditorSnapshot,
} from "./composerNativeEditor.logic";
import {
  consumeComposerNativeValueAck,
  type ComposerNativeValueAck,
} from "./composerNativeValueAck.logic";
import {
  createComposerEditorHistory,
  pushComposerEditorHistory,
  redoComposerEditorHistory,
  undoComposerEditorHistory,
  type ComposerEditorHistorySnapshot,
} from "./composerEditorHistory.logic";
import {
  applyNativeComposerDisplayEdit,
  createNativeComposerDraftProjection,
  displayOffsetForCanonicalOffset,
  type NativeComposerDisplayToken,
} from "./composerDraftProjection.logic";
import {
  releasePickedComposerFile,
  resolvePickedComposerFiles,
  stageNativeComposerFiles,
  type NativeComposerFileAttachment,
  type NativeComposerImageAttachment,
} from "./composerAttachments.lynx";
import { ComposerModelPicker } from "./ComposerModelPicker.lynx";
import { ComposerVoiceButton, ComposerVoiceRecorderBar } from "./ComposerVoiceControls.lynx";
import { useNativeComposerVoice } from "./useNativeComposerVoice.lynx";
import { ExpandedImageOverlay, type NativeExpandedImagePreview } from "./ExpandedImageOverlay.lynx";
import { FileEntryIcon } from "../FileEntryIcon.lynx";
import { Button } from "../ui/button";
import {
  buildLynxAgentMentionItems,
  buildLynxSlashCommandItems,
  resolveLynxAgentMentionSelection,
  resolveLynxPathMentionSelection,
  resolveLynxSkillSelection,
  resolveLynxSlashCommandSelection,
  resolveLynxThreadMentionSelection,
} from "./composerCommandMenu.logic";
import {
  findComposerMenuActiveItem,
  nudgeComposerMenuActiveItemId,
  resolveComposerMenuActiveItemId,
} from "./composerMenuNavigation.logic";

import "./composer.css";

type ComposerTokenSegment = Exclude<ComposerPromptSegment, { readonly type: "text" }>;
const EMPTY_ASSISTANT_SELECTIONS = [];
const EMPTY_MENTIONS: ReadonlyArray<Extract<ComposerCommandItem, { type: "thread" }>["mention"]> =
  [];
const EMPTY_PASTED_TEXTS: ReadonlyArray<PastedTextDraft> = [];
const EMPTY_FILES: ReadonlyArray<NativeComposerFileAttachment> = [];
const EMPTY_IMAGES: ReadonlyArray<NativeComposerImageAttachment> = [];
const EMPTY_NON_PERSISTED_IMAGE_IDS: ReadonlyArray<string> = [];
const EMPTY_FILE_COMMENTS = [];
const EMPTY_SKILLS: ReadonlyArray<ProviderSkillReference> = [];
const EMPTY_TERMINAL_CONTEXTS: ReadonlyArray<TerminalContextDraft> = [];
const EMPTY_COMMAND_ITEMS: ReadonlyArray<ComposerCommandItem> = [];
// Match the web composer's "@" path search (ChatView COMPOSER_PATH_QUERY_DEBOUNCE_MS, limit 80).
const COMPOSER_PATH_QUERY_DEBOUNCE_MS = 120;
const COMPOSER_PATH_QUERY_LIMIT = 80;
interface ComposerEditorHistoryContext {
  readonly mentions: ReadonlyArray<ProviderMentionReference>;
  readonly pastedTexts: ReadonlyArray<PastedTextDraft>;
  readonly skills: ReadonlyArray<ProviderSkillReference>;
  readonly terminalContexts: ReadonlyArray<TerminalContextDraft>;
}
function segmentLabel(segment: ComposerTokenSegment): string {
  if (segment.type === "mention") return segment.path.split(/[\\/]/).pop() || segment.path;
  if (segment.type === "skill") return formatComposerSkillChipLabel(segment.name);
  if (segment.type === "slash-command") {
    return formatComposerSlashCommandChipLabel(segment.command);
  }
  if (segment.type === "agent-mention") return `@${segment.alias}`;
  if (segment.type === "terminal-context") {
    return segment.context?.terminalLabel ?? "Terminal context";
  }
  return segment.url;
}

function ComposerTokenIcon(props: {
  readonly kind: ComposerTokenSegment["type"] | NativeComposerDisplayToken["kind"];
  readonly pathValue?: string;
  readonly color?: string;
}) {
  const { semanticIconColor } = useTheme();
  if (props.kind === "mention") {
    return <FileEntryIcon className="ComposerChipIcon" pathValue={props.pathValue ?? ""} />;
  }
  if (props.kind === "slash-command") {
    return <ClockIcon className="ComposerChipIcon" color="var(--info-foreground)" size={12} />;
  }
  if (props.kind === "link") {
    return (
      <ExternalLinkIcon className="ComposerChipIcon" color="var(--info-foreground)" size={12} />
    );
  }
  const content =
    props.kind === "skill"
      ? skillSvg
      : props.kind === "agent-mention"
        ? agentMentionSvg
        : terminalSvg;
  return (
    <svg
      className="ComposerChipIcon"
      content={colorizeLynxSvg(
        content,
        props.color ??
          (props.kind === "terminal-context"
            ? semanticIconColor("primary")
            : "var(--info-foreground)"),
      )}
    />
  );
}

function ComposerChip({ segment }: { readonly segment: ComposerTokenSegment }) {
  const agentColor =
    segment.type === "agent-mention" ? resolveAgentChipColor(segment.color) : undefined;
  return (
    <view
      className={`ComposerChip ComposerChip--${segment.type}`}
      style={
        agentColor
          ? {
              backgroundColor: agentColor.bg,
              color: agentColor.text,
            }
          : undefined
      }
    >
      <ComposerTokenIcon
        kind={segment.type}
        pathValue={segment.type === "mention" ? segment.path : undefined}
        color={agentColor?.text}
      />
      <text
        className="ComposerChipLabel"
        style={agentColor ? { color: agentColor.text } : undefined}
      >
        {segmentLabel(segment)}
      </text>
    </view>
  );
}

function ComposerProjectionChip({
  fontSizePx,
  token,
}: {
  readonly fontSizePx: number;
  readonly token: NativeComposerDisplayToken;
}) {
  return (
    <view className={`ComposerChip ComposerChip--${token.kind}`}>
      <ComposerTokenIcon
        kind={token.kind}
        pathValue={
          token.kind === "mention" && token.key.startsWith("mention:")
            ? token.key.slice("mention:".length)
            : undefined
        }
      />
      <text className="ComposerChipLabel" style={{ fontSize: `${fontSizePx}px` }}>
        {token.label}
      </text>
    </view>
  );
}

function ComposerProjectedVisualContent({
  fontSizePx,
  projection,
}: {
  readonly fontSizePx: number;
  readonly projection: ReturnType<typeof createNativeComposerDraftProjection>;
}) {
  return (
    <view className="ComposerProjectedVisualContent" aria-hidden="true">
      {projection.plainSegments.map((plain, index) => (
        <view className="ComposerProjectedVisualSegment" key={`plain:${index}`}>
          {plain ? (
            <text className="ComposerProjectedVisualText" style={{ fontSize: `${fontSizePx}px` }}>
              {plain}
            </text>
          ) : null}
          {projection.displayTokens[index] ? (
            <ComposerProjectionChip
              fontSizePx={fontSizePx}
              token={projection.displayTokens[index]!}
            />
          ) : null}
        </view>
      ))}
    </view>
  );
}

interface ComposerProps {
  readonly availableWidth?: number | null;
  readonly chatFontSizePx?: number;
  readonly activeTurnId: string | null;
  readonly interactionMode: "default" | "plan" | undefined;
  readonly modelSelection: ModelSelection | undefined;
  readonly runtimeMode: RuntimeMode | undefined;
  readonly sessionStatus: string | null;
  readonly threadId: string;
  readonly draftId?: string;
  readonly workspaceRoot?: string | null;
  readonly emptyLanding?: boolean;
  /** Provider a started thread is pinned to; the model picker hides every other provider. */
  readonly lockedProvider?: ProviderKind | null;
  /** "Add providers" in the model picker: Settings → Providers. */
  readonly onOpenProviderSettings?: () => void;
  /** Electron's thread composer placeholder (resolveChatComposerPlaceholder). */
  readonly placeholder?: string;
  readonly voiceInputEnabled?: boolean;
  readonly providerStatuses?: readonly ServerProviderStatus[];
  readonly pendingUserInputCount?: number;
  readonly activities?: readonly OrchestrationThreadActivity[];
  readonly onBeforeSend?: (input: {
    readonly interactionMode: "default" | "plan";
    readonly modelSelection: ModelSelection;
    readonly runtimeMode: RuntimeMode;
    readonly text: string;
  }) => Promise<void>;
  readonly onProviderStatusesChange?: (statuses: readonly ServerProviderStatus[]) => void;
  readonly onSetInteractionMode?: (interactionMode: "default" | "plan") => void | Promise<void>;
  readonly onSetRuntimeMode?: (runtimeMode: RuntimeMode) => void | Promise<void>;
  readonly onSendSucceeded?: () => void | Promise<void>;
}

function createComposerDispatchId(kind: "command" | "message"): string {
  "background only";
  return `lynx-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function Composer({
  availableWidth = null,
  chatFontSizePx = DEFAULT_CHAT_FONT_SIZE_PX,
  activeTurnId,
  interactionMode,
  modelSelection,
  runtimeMode,
  sessionStatus,
  threadId,
  draftId,
  workspaceRoot,
  emptyLanding = false,
  lockedProvider,
  onOpenProviderSettings,
  placeholder: placeholderProp,
  voiceInputEnabled = false,
  providerStatuses,
  pendingUserInputCount = 0,
  activities = [],
  onBeforeSend,
  onProviderStatusesChange,
  onSetInteractionMode,
  onSetRuntimeMode,
  onSendSucceeded,
}: ComposerProps) {
  const compactFooter = shouldUseCompactComposerFooter(availableWidth);
  // Electron reads the latest usage epoch, which a completed compaction clears.
  const contextWindow = useMemo(
    () => deriveLatestContextWindowState(activities).snapshot,
    [activities],
  );
  const contextWindowDisplay = useMemo(
    () => (contextWindow === null ? null : deriveContextWindowMeterDisplay(contextWindow)),
    [contextWindow],
  );
  const cumulativeCostUsd = useMemo(() => deriveCumulativeCostUsd(activities), [activities]);
  const normalizedChatFontSizePx = normalizeChatFontSizePx(chatFontSizePx);
  // Hosts with more context (approvals, question options, subagents) pass their own.
  const placeholder =
    placeholderProp ??
    (emptyLanding
      ? "Ask for follow-up changes or attach images"
      : resolveChatComposerPlaceholder({
          approvalPending: false,
          pendingQuestion: pendingUserInputCount > 0 ? { freeform: false } : null,
          planFollowUp: false,
          subagent: false,
          phase: resolveSessionPhase(sessionStatus),
        }));
  const emptyEditorMinHeightPx = resolveEmptyComposerEditorMinHeightPx({
    availableWidthPx: availableWidth,
    chatFontSizePx: normalizedChatFontSizePx,
    placeholder,
  });
  const initData = useInitData() as {
    readonly initialComposerModelProvider?: unknown;
  };
  const initialModelMenuProvider =
    typeof initData.initialComposerModelProvider === "string" &&
    isProviderKind(initData.initialComposerModelProvider)
      ? initData.initialComposerModelProvider
      : null;
  const { resolvedTheme, svgColors } = useTheme();
  const textareaRef = useRef<React.ElementRef<"textarea">>(null);
  const editorRegionRef = useRef<NodesRef>(null);
  const nativeFocusRequestPendingRef = useRef(false);
  const brandedThreadId = (draftId ?? threadId) as never;
  const draft = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.prompt ?? "",
  );
  const assistantSelections = useComposerDraftStore(
    (state) =>
      state.draftsByThreadId[brandedThreadId]?.assistantSelections ?? EMPTY_ASSISTANT_SELECTIONS,
  );
  const pastedTexts = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.pastedTexts ?? EMPTY_PASTED_TEXTS,
  );
  const files = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.files ?? EMPTY_FILES,
  );
  const images = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.images ?? EMPTY_IMAGES,
  );
  const nonPersistedImageIds = useComposerDraftStore(
    (state) =>
      state.draftsByThreadId[brandedThreadId]?.nonPersistedImageIds ??
      EMPTY_NON_PERSISTED_IMAGE_IDS,
  );
  const nonPersistedImageIdSet = useMemo(
    () => new Set(nonPersistedImageIds),
    [nonPersistedImageIds],
  );
  const fileComments = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.fileComments ?? EMPTY_FILE_COMMENTS,
  );
  const mentions = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.mentions ?? EMPTY_MENTIONS,
  );
  const skills = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.skills ?? EMPTY_SKILLS,
  );
  const terminalContexts = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.terminalContexts ?? EMPTY_TERMINAL_CONTEXTS,
  );
  const draftProjection = useMemo(
    () =>
      createNativeComposerDraftProjection({
        canonicalText: draft,
        mentions,
        skills,
        terminalContexts,
      }),
    [draft, mentions, skills, terminalContexts],
  );
  const nativeEditorMaxLines = resolveNativeComposerMaxLines({
    availableWidthPx: availableWidth,
    chatFontSizePx: normalizedChatFontSizePx,
    text: draftProjection.displayText,
  });
  const draftModelSelection = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.modelSelection,
  );
  const draftModelSelectionByProvider = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.modelSelectionByProvider,
  );
  const addPastedText = useComposerDraftStore((state) => state.addPastedText);
  const addFiles = useComposerDraftStore((state) => state.addFiles);
  const addImages = useComposerDraftStore((state) => state.addImages);
  const clearDraft = useComposerDraftStore((state) => state.clearDraft);
  const removePastedText = useComposerDraftStore((state) => state.removePastedText);
  const removeFile = useComposerDraftStore((state) => state.removeFile);
  const removeImage = useComposerDraftStore((state) => state.removeImage);
  const removeFileComments = useComposerDraftStore((state) => state.removeFileComments);
  const removeAssistantSelections = useComposerDraftStore(
    (state) => state.removeAssistantSelections,
  );
  const setPrompt = useComposerDraftStore((state) => state.setPrompt);
  const setModelSelection = useComposerDraftStore((state) => state.setModelSelection);
  const setMentions = useComposerDraftStore((state) => state.setMentions);
  const setSkills = useComposerDraftStore((state) => state.setSkills);
  const setTerminalContexts = useComposerDraftStore((state) => state.setTerminalContexts);
  const [focused, setFocused] = useState(false);
  const [nativeEditorFocusEpoch, setNativeEditorFocusEpoch] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const sendInFlightRef = useRef(false);
  const [isStopping, setIsStopping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<NativeExpandedImagePreview | null>(null);
  const [composerTrigger, setComposerTrigger] = useState<ComposerTrigger | null>(null);
  const [composerHighlightedItemId, setComposerHighlightedItemId] = useState<string | null>(null);
  const [modelCatalogProvider, setModelCatalogProvider] = useState<ProviderKind | null>(
    initialModelMenuProvider,
  );
  const pendingNativeValueRef = useRef<ComposerNativeValueAck | null>(null);
  const nativeSelectionRef = useRef({
    selectionStart: draftProjection.displayText.length,
    selectionEnd: draftProjection.displayText.length,
  });
  const nativeEditorSnapshotRef = useRef<ComposerNativeEditorSnapshot>({
    value: draftProjection.displayText,
    selectionStart: draftProjection.displayText.length,
    selectionEnd: draftProjection.displayText.length,
    isComposing: false,
  });
  const draftProjectionRef = useRef(draftProjection);
  const appliedDisplayProjectionRef = useRef<string | null>(null);
  draftProjectionRef.current = draftProjection;
  const editorHistoryRef = useRef(createComposerEditorHistory<ComposerEditorHistoryContext>());
  const compositionHistorySnapshotRef =
    useRef<ComposerEditorHistorySnapshot<ComposerEditorHistoryContext> | null>(null);
  useEffect(() => {
    "background only";
    const prompt = useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]?.prompt ?? "";
    const current = useComposerDraftStore.getState().draftsByThreadId[brandedThreadId];
    const projection = createNativeComposerDraftProjection({
      canonicalText: prompt,
      mentions: current?.mentions ?? EMPTY_MENTIONS,
      skills: current?.skills ?? EMPTY_SKILLS,
      terminalContexts: current?.terminalContexts ?? EMPTY_TERMINAL_CONTEXTS,
    });
    const selection = {
      selectionStart: projection.displayText.length,
      selectionEnd: projection.displayText.length,
    };
    draftProjectionRef.current = projection;
    appliedDisplayProjectionRef.current = null;
    nativeSelectionRef.current = selection;
    nativeEditorSnapshotRef.current = {
      value: projection.displayText,
      ...selection,
      isComposing: false,
    };
    editorHistoryRef.current = createComposerEditorHistory<ComposerEditorHistoryContext>();
    compositionHistorySnapshotRef.current = null;
  }, [brandedThreadId]);
  const activeModelSelection = draftModelSelection ?? modelSelection;
  const activeProvider = activeModelSelection?.provider as ProviderKind | undefined;
  const discoveryProvider = modelCatalogProvider ?? activeProvider;
  const { data: mentionSnapshot } = useQuery({
    queryKey: ["sidebar-snapshot"],
    queryFn: fetchSidebarSnapshot,
    refetchInterval: 5_000,
  });
  const {
    data: runtimeModelCatalog,
    isFetching: runtimeModelsFetching,
    isPending: runtimeModelsPending,
  } = useQuery({
    queryKey: ["provider-model-catalog", discoveryProvider ?? null, workspaceRoot ?? null],
    queryFn: () => {
      "background only";
      if (!discoveryProvider) {
        throw new Error("Provider model discovery requires an active provider.");
      }
      return fetchProviderModels({
        provider: discoveryProvider,
        cwd: workspaceRoot ?? null,
      });
    },
    enabled: Boolean(discoveryProvider),
    staleTime: 60_000,
  });
  const { data: serverConfig } = useQuery({
    queryKey: ["server-config"],
    queryFn: () => {
      "background only";
      return fetchServerConfig();
    },
    staleTime: 15_000,
    retry: false,
  });
  const voice = useNativeComposerVoice({
    enabled: voiceInputEnabled,
    draftKey: brandedThreadId,
    threadId,
    provider: activeProvider,
    providerStatuses: providerStatuses ?? serverConfig?.providers ?? [],
    workspaceRoot,
    pendingUserInputCount,
    readPrompt: (draftKey) =>
      useComposerDraftStore.getState().draftsByThreadId[draftKey]?.prompt ?? "",
    onTranscript: (draftKey, nextPrompt) => {
      setPrompt(draftKey, nextPrompt);
      setNativeValue(nextPrompt);
    },
    onActionStart: () => setSendError(null),
    onSettled: () => restoreNativeFocus(),
    onProviderStatusesChange,
  });
  const isVoiceRecording = voice.isRecording;
  const isVoiceTranscribing = voice.isTranscribing;
  const voiceDurationMs = voice.durationMs;
  const voiceWaveformLevels = voice.waveformLevels;
  const showVoiceNotesControl = voice.showVoiceNotesControl;
  useEffect(() => {
    if (serverConfig) {
      onProviderStatusesChange?.(serverConfig.providers);
    }
  }, [onProviderStatusesChange, serverConfig]);
  const { data: providerSkillsCatalog, isPending: providerSkillsPending } = useQuery({
    queryKey: ["provider-skills", activeProvider ?? null, workspaceRoot ?? null, threadId],
    queryFn: () => {
      "background only";
      if (!activeProvider || !workspaceRoot) {
        throw new Error("Skill discovery requires a provider and workspace.");
      }
      return fetchProviderSkills({
        provider: activeProvider,
        cwd: workspaceRoot,
        threadId,
      });
    },
    enabled:
      (composerTrigger?.kind === "skill" || composerTrigger?.kind === "slash-command") &&
      Boolean(activeProvider) &&
      Boolean(workspaceRoot),
    staleTime: 30_000,
  });
  const activeRuntimeModel = useMemo(
    () =>
      activeModelSelection
        ? resolveRuntimeModelDescriptor({
            provider: activeModelSelection.provider,
            model: activeModelSelection.model,
            runtimeModels:
              discoveryProvider === activeModelSelection.provider
                ? runtimeModelCatalog?.models
                : null,
          })
        : undefined,
    [activeModelSelection, discoveryProvider, runtimeModelCatalog?.models],
  );
  const activeTraitSelection = useMemo(
    () =>
      activeModelSelection
        ? getComposerTraitSelection(
            activeModelSelection.provider,
            activeModelSelection.model,
            draft,
            activeModelSelection.options,
            activeRuntimeModel,
          )
        : null,
    [activeModelSelection, activeRuntimeModel, draft],
  );
  const supportsFastMode = Boolean(
    activeTraitSelection &&
    (activeTraitSelection.fastModeDescriptor !== null ||
      activeTraitSelection.caps.supportsFastMode),
  );
  const mentionProjects = useMemo(
    () =>
      (mentionSnapshot?.projects ?? []).map((project) => ({
        id: project.id,
        kind: project.kind,
        name: project.title,
      })),
    [mentionSnapshot],
  );
  const mentionThreads = useMemo(
    () =>
      (mentionSnapshot?.threads ?? []).flatMap((thread) =>
        thread.provider
          ? [
              {
                id: thread.id,
                projectId: thread.projectId,
                title: thread.title,
                provider: thread.provider,
                createdAt: thread.createdAt ?? thread.updatedAt,
                archivedAt: null,
                latestUserMessageAt: thread.latestUserMessageAt ?? null,
              },
            ]
          : [],
      ),
    [mentionSnapshot],
  );
  const segments = useMemo(() => splitPromptIntoComposerSegments(draft), [draft]);
  const auxiliaryTokens = segments.filter(
    (segment): segment is ComposerTokenSegment =>
      segment.type !== "text" && segment.type !== "mention" && segment.type !== "skill",
  );
  const slashCommandItems = useMemo(
    () =>
      composerTrigger?.kind === "slash-command"
        ? buildLynxSlashCommandItems(composerTrigger.query)
        : [],
    [composerTrigger],
  );
  const threadMentionItems = useMemo(
    () =>
      composerTrigger?.kind === "mention"
        ? buildThreadMentionComposerItems({
            currentThreadId: threadId,
            projects: mentionProjects,
            query: composerTrigger.query,
            threads: mentionThreads,
          })
        : [],
    [composerTrigger, mentionProjects, mentionThreads, threadId],
  );
  // Workspace "@" path search, debounced like the web composer.
  const mentionQuery = composerTrigger?.kind === "mention" ? composerTrigger.query : "";
  const [debouncedMentionQuery, setDebouncedMentionQuery] = useState(mentionQuery);
  useEffect(() => {
    "background only";
    const timer = setTimeout(
      () => setDebouncedMentionQuery(mentionQuery),
      COMPOSER_PATH_QUERY_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [mentionQuery]);
  const effectiveMentionQuery = mentionQuery.length > 0 ? debouncedMentionQuery : "";
  const { data: workspaceEntriesResult } = useQuery({
    queryKey: ["composer-path-entries", workspaceRoot ?? null, effectiveMentionQuery],
    queryFn: () => {
      "background only";
      if (!workspaceRoot) throw new Error("Workspace entry search is unavailable.");
      return searchProjectEntries({
        cwd: workspaceRoot,
        query: effectiveMentionQuery,
        limit: COMPOSER_PATH_QUERY_LIMIT,
      });
    },
    enabled:
      composerTrigger?.kind === "mention" &&
      Boolean(workspaceRoot) &&
      effectiveMentionQuery.length > 0,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  });
  const pathMentionItems = useMemo(
    () =>
      composerTrigger?.kind === "mention" && effectiveMentionQuery.length > 0
        ? buildWorkspacePathComposerItems(workspaceEntriesResult?.entries ?? [])
        : [],
    [composerTrigger?.kind, effectiveMentionQuery, workspaceEntriesResult],
  );
  const agentMentionItems = useMemo(
    () =>
      composerTrigger?.kind === "mention" && activeProvider
        ? buildLynxAgentMentionItems(activeProvider, composerTrigger.query)
        : [],
    [activeProvider, composerTrigger],
  );
  const skillItems = useMemo<ComposerCommandItem[]>(() => {
    if (composerTrigger?.kind !== "skill" && composerTrigger?.kind !== "slash-command") return [];
    return rankProviderDiscoveryItems(
      providerSkillsCatalog?.skills ?? [],
      composerTrigger.query,
      buildSkillSearchFields,
    ).map((skill) => ({
      id: `skill:${skill.path}`,
      type: "skill" as const,
      skill,
      label: providerSkillDisplayName(skill),
      description: skill.description ?? skill.path,
    }));
  }, [composerTrigger, providerSkillsCatalog?.skills]);
  const composerMenuItems =
    composerTrigger?.kind === "slash-command"
      ? [...slashCommandItems, ...skillItems]
      : composerTrigger?.kind === "skill"
        ? skillItems
        : composerTrigger?.kind === "mention"
          ? [...threadMentionItems, ...pathMentionItems, ...agentMentionItems]
          : EMPTY_COMMAND_ITEMS;
  const activeComposerMenuItemId = resolveComposerMenuActiveItemId({
    activeItemId: composerHighlightedItemId,
    items: composerMenuItems,
  });
  useEffect(() => {
    "background only";
    setComposerHighlightedItemId((current) =>
      resolveComposerMenuActiveItemId({
        activeItemId: current,
        items: composerMenuItems,
      }),
    );
  }, [composerMenuItems]);

  function setNativeValue(
    canonicalValue: string,
    selectionStart = canonicalValue.length,
    selectionEnd = selectionStart,
    triggerAfterAck: ComposerTrigger | null = null,
  ) {
    "background only";
    const current = useComposerDraftStore.getState().draftsByThreadId[brandedThreadId];
    const projection = createNativeComposerDraftProjection({
      canonicalText: canonicalValue,
      mentions: current?.mentions ?? EMPTY_MENTIONS,
      skills: current?.skills ?? EMPTY_SKILLS,
      terminalContexts: current?.terminalContexts ?? EMPTY_TERMINAL_CONTEXTS,
    });
    draftProjectionRef.current = projection;
    const safeCanonicalSelectionStart = Math.max(
      0,
      Math.min(canonicalValue.length, selectionStart),
    );
    const safeCanonicalSelectionEnd = Math.max(
      safeCanonicalSelectionStart,
      Math.min(canonicalValue.length, selectionEnd),
    );
    const nextSelection = {
      selectionStart: displayOffsetForCanonicalOffset({
        projection,
        canonicalOffset: safeCanonicalSelectionStart,
      }),
      selectionEnd: displayOffsetForCanonicalOffset({
        projection,
        canonicalOffset: safeCanonicalSelectionEnd,
      }),
    };
    pendingNativeValueRef.current = {
      value: projection.displayText,
      triggerAfterAck,
    };
    appliedDisplayProjectionRef.current = projection.displayText;
    nativeSelectionRef.current = nextSelection;
    nativeEditorSnapshotRef.current = {
      value: projection.displayText,
      ...nextSelection,
      isComposing: false,
    };
    textareaRef.current
      ?.invoke({ method: "setValue", params: { value: projection.displayText } })
      .exec();
    textareaRef.current?.invoke({ method: "focus" }).exec();
    textareaRef.current?.invoke({ method: "setSelectionRange", params: nextSelection }).exec();
  }

  function restoreNativeFocus() {
    "background only";
    claimComposerInputFocus();
    if (nativeFocusRequestPendingRef.current) return;
    nativeFocusRequestPendingRef.current = true;
    const focusComposer = () => {
      const textarea = textareaRef.current;
      if (!textarea) {
        nativeFocusRequestPendingRef.current = false;
        return;
      }
      const restoreSelection = () => {
        textarea
          .invoke({
            method: "setSelectionRange",
            params: nativeSelectionRef.current,
            success: () => {
              nativeFocusRequestPendingRef.current = false;
            },
            fail: () => {
              nativeFocusRequestPendingRef.current = false;
            },
          })
          .exec();
      };
      textarea
        .invoke({
          method: "focus",
          success: restoreSelection,
          fail: () => {
            setTimeout(() => {
              textarea
                .invoke({
                  method: "focus",
                  success: restoreSelection,
                  fail: () => {
                    nativeFocusRequestPendingRef.current = false;
                  },
                })
                .exec();
            }, 0);
          },
        })
        .exec();
    };
    void bridgeCall("shellReleaseTerminalInputFocus").then(focusComposer, focusComposer);
  }

  function claimComposerInputOwnership() {
    "background only";
    claimComposerInputFocus();
    void bridgeCall("shellClaimComposerInputFocus", {
      owner: brandedThreadId,
    }).catch(() => undefined);
  }

  function releaseComposerInputOwnership() {
    "background only";
    void bridgeCall("shellSetComposerInputFocused", {
      enabled: false,
      owner: brandedThreadId,
    }).catch(() => undefined);
  }

  useEffect(() => {
    "background only";
    return subscribeTerminalInputFocusOwner((owner) => {
      if (owner === null) return;
      releaseComposerInputOwnership();
      nativeFocusRequestPendingRef.current = false;
      setFocused(false);
      setNativeEditorFocusEpoch((current) => current + 1);
    });
  }, []);
  useEffect(() => {
    "background only";
    return releaseComposerInputOwnership;
  }, [brandedThreadId]);
  useEffect(() => {
    "background only";
    const publishBounds = () => {
      void getRectByRef(editorRegionRef, true)
        .then((rect) =>
          bridgeCall("shellSetComposerInputBounds", {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          }),
        )
        .catch(() => undefined);
    };
    const timers = [0, 80, 240].map((delay) => setTimeout(publishBounds, delay));
    const dispose = onGlobalEvent("viewport:resize", publishBounds);
    return () => {
      for (const timer of timers) clearTimeout(timer);
      dispose();
    };
  }, []);

  useEffect(() => {
    "background only";
    if (
      appliedDisplayProjectionRef.current === draftProjection.displayText &&
      nativeEditorSnapshotRef.current.value === draftProjection.displayText
    ) {
      return;
    }
    const selection = {
      selectionStart: draftProjection.displayText.length,
      selectionEnd: draftProjection.displayText.length,
    };
    draftProjectionRef.current = draftProjection;
    nativeSelectionRef.current = selection;
    nativeEditorSnapshotRef.current = {
      value: draftProjection.displayText,
      ...selection,
      isComposing: false,
    };
    pendingNativeValueRef.current = {
      value: draftProjection.displayText,
      ...selection,
    };
    appliedDisplayProjectionRef.current = draftProjection.displayText;
    textareaRef.current
      ?.invoke({
        method: "setValue",
        params: { value: draftProjection.displayText },
      })
      .exec();
    textareaRef.current?.invoke({ method: "setSelectionRange", params: selection }).exec();
  }, [draftProjection]);

  async function readNativeEditorSnapshot(fallbackPrompt: string): Promise<{
    readonly isComposing: boolean;
    readonly selectionEnd: number;
    readonly selectionStart: number;
    readonly value: string;
  } | null> {
    "background only";
    const fallbackProjection =
      draftProjectionRef.current.canonicalText === fallbackPrompt
        ? draftProjectionRef.current
        : createNativeComposerDraftProjection({
            canonicalText: fallbackPrompt,
            mentions,
            skills,
            terminalContexts,
          });
    const trackedSnapshot = nativeEditorSnapshotRef.current;
    const fallback: ComposerNativeEditorSnapshot =
      trackedSnapshot.value === fallbackProjection.displayText
        ? trackedSnapshot
        : {
            value: fallbackProjection.displayText,
            isComposing: false,
            ...nativeSelectionRef.current,
          };
    const textarea = textareaRef.current;
    if (!textarea) return fallback;
    const nativeSnapshot = new Promise<typeof fallback>((resolve) => {
      textarea
        .invoke({
          method: "getValue",
          success: (result) => {
            "background only";
            if (!result || typeof (result as { value?: unknown }).value !== "string") {
              resolve(fallback);
              return;
            }
            resolve(normalizeComposerNativeEditorSnapshot(result));
          },
          fail: () => {
            "background only";
            resolve(fallback);
          },
        })
        .exec();
    });
    return Promise.race([nativeSnapshot, sleepOnHost(500).then(() => fallback)]);
  }

  function captureEditorHistorySnapshot(
    editor: ComposerNativeEditorSnapshot = nativeEditorSnapshotRef.current,
  ): ComposerEditorHistorySnapshot<ComposerEditorHistoryContext> {
    "background only";
    const current = useComposerDraftStore.getState().draftsByThreadId[brandedThreadId];
    const edit = applyNativeComposerDisplayEdit({
      projection: draftProjectionRef.current,
      displayText: editor.value,
      displaySelectionStart: editor.selectionStart,
      displaySelectionEnd: editor.selectionEnd,
    });
    return {
      value: edit.canonicalText,
      selectionStart: edit.canonicalSelectionStart,
      selectionEnd: edit.canonicalSelectionEnd,
      context: {
        mentions: [...edit.mentions],
        pastedTexts: [...(current?.pastedTexts ?? EMPTY_PASTED_TEXTS)],
        skills: [...edit.skills],
        terminalContexts: [...edit.terminalContexts],
      },
    };
  }

  function recordEditorHistory(
    editor: ComposerNativeEditorSnapshot = nativeEditorSnapshotRef.current,
  ) {
    "background only";
    editorHistoryRef.current = pushComposerEditorHistory({
      state: editorHistoryRef.current,
      snapshot: captureEditorHistorySnapshot(editor),
    });
  }

  function restoreEditorHistorySnapshot(
    snapshot: ComposerEditorHistorySnapshot<ComposerEditorHistoryContext>,
  ) {
    "background only";
    const current = useComposerDraftStore.getState().draftsByThreadId[brandedThreadId];
    for (const pastedText of current?.pastedTexts ?? EMPTY_PASTED_TEXTS) {
      removePastedText(brandedThreadId, pastedText.id);
    }
    for (const pastedText of snapshot.context.pastedTexts) {
      addPastedText(brandedThreadId, pastedText);
    }
    setMentions(brandedThreadId, snapshot.context.mentions);
    setSkills(brandedThreadId, snapshot.context.skills);
    setTerminalContexts(brandedThreadId, snapshot.context.terminalContexts);
    setPrompt(brandedThreadId, snapshot.value);
    const nextTrigger = detectComposerTrigger(snapshot.value, snapshot.selectionStart);
    setNativeValue(snapshot.value, snapshot.selectionStart, snapshot.selectionEnd, nextTrigger);
    setComposerTrigger(nextTrigger);
    setSendError(null);
  }

  function activateEditorHistory(direction: "undo" | "redo") {
    "background only";
    if (!focused) return;
    const current = captureEditorHistorySnapshot();
    const transition =
      direction === "undo"
        ? undoComposerEditorHistory({
            state: editorHistoryRef.current,
            current,
          })
        : redoComposerEditorHistory({
            state: editorHistoryRef.current,
            current,
          });
    editorHistoryRef.current = transition.state;
    if (transition.snapshot) restoreEditorHistorySnapshot(transition.snapshot);
  }

  async function selectAllNativeEditorText() {
    "background only";
    if (!focused) return;
    const editor = await readNativeEditorSnapshot();
    const selected = selectAllComposerNativeEditor(editor);
    nativeSelectionRef.current = {
      selectionStart: selected.selectionStart,
      selectionEnd: selected.selectionEnd,
    };
    nativeEditorSnapshotRef.current = selected;
    textareaRef.current
      ?.invoke({
        method: "select",
      })
      .exec();
  }

  async function copyOrCutNativeEditorText(cut: boolean) {
    "background only";
    if (!focused) return;
    const editor = nativeEditorSnapshotRef.current;
    const projected = applyNativeComposerDisplayEdit({
      projection: draftProjectionRef.current,
      displayText: editor.value,
      displaySelectionStart: editor.selectionStart,
      displaySelectionEnd: editor.selectionEnd,
    });
    const selectedText = projected.canonicalText.slice(
      projected.canonicalSelectionStart,
      projected.canonicalSelectionEnd,
    );
    if (!selectedText) return;
    try {
      await clipboardPort.writeText(selectedText);
    } catch {
      setSendError("Unable to write the selected text to the clipboard.");
      restoreNativeFocus();
      return;
    }
    if (!cut) {
      restoreNativeFocus();
      return;
    }
    recordEditorHistory(editor);
    const next = cutComposerNativeEditorSelection(editor);
    const edit = applyNativeComposerDisplayEdit({
      projection: draftProjectionRef.current,
      displayText: next.value,
      displaySelectionStart: next.selectionStart,
      displaySelectionEnd: next.selectionEnd,
    });
    setPrompt(brandedThreadId, edit.canonicalText);
    setMentions(brandedThreadId, edit.mentions);
    setSkills(brandedThreadId, edit.skills);
    setTerminalContexts(brandedThreadId, edit.terminalContexts);
    const nextTrigger = detectComposerTrigger(edit.canonicalText, edit.canonicalSelectionStart);
    setNativeValue(
      edit.canonicalText,
      edit.canonicalSelectionStart,
      edit.canonicalSelectionEnd,
      nextTrigger,
    );
    setComposerTrigger(nextTrigger);
  }

  function selectSlashCommand(item: ComposerCommandItem) {
    "background only";
    if (!composerTrigger) return;
    const currentPrompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]?.prompt ?? "";
    const transition = resolveLynxSlashCommandSelection({
      item,
      prompt: currentPrompt,
      trigger: composerTrigger,
    });
    if (!transition) return;
    recordEditorHistory();
    setPrompt(brandedThreadId, transition.prompt);
    setNativeValue(transition.prompt, transition.selectionStart, transition.selectionEnd);
    setComposerTrigger(null);
    if (transition.interactionMode) {
      void setPlanMode(transition.interactionMode === "plan");
    }
  }

  function selectThreadMention(item: ComposerCommandItem) {
    "background only";
    if (!composerTrigger) return;
    const currentPrompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]?.prompt ?? "";
    const transition = resolveLynxThreadMentionSelection({
      item,
      prompt: currentPrompt,
      trigger: composerTrigger,
    });
    if (!transition) return;
    recordEditorHistory();
    const nextMentions = [
      ...mentions.filter((mention) => mention.name !== transition.mention.name),
      transition.mention,
    ];
    setPrompt(brandedThreadId, transition.prompt);
    setMentions(brandedThreadId, nextMentions);
    setNativeValue(transition.prompt, transition.selectionStart, transition.selectionEnd);
    setComposerTrigger(null);
  }

  function selectPathMention(item: ComposerCommandItem) {
    "background only";
    if (!composerTrigger) return;
    const currentPrompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]?.prompt ?? "";
    const transition = resolveLynxPathMentionSelection({
      item,
      prompt: currentPrompt,
      trigger: composerTrigger,
    });
    if (!transition) return;
    recordEditorHistory();
    setPrompt(brandedThreadId, transition.prompt);
    setNativeValue(transition.prompt, transition.selectionStart, transition.selectionEnd);
    setComposerTrigger(null);
  }

  function selectAgentMention(item: ComposerCommandItem) {
    "background only";
    if (!composerTrigger) return;
    const currentPrompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]?.prompt ?? "";
    const transition = resolveLynxAgentMentionSelection({
      item,
      prompt: currentPrompt,
      trigger: composerTrigger,
    });
    if (!transition) return;
    recordEditorHistory();
    setPrompt(brandedThreadId, transition.prompt);
    setNativeValue(transition.prompt, transition.selectionStart, transition.selectionEnd);
    setComposerTrigger(null);
  }

  function selectSkill(item: ComposerCommandItem) {
    "background only";
    if (!composerTrigger || !activeProvider) return;
    const currentPrompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]?.prompt ?? "";
    const transition = resolveLynxSkillSelection({
      item,
      prompt: currentPrompt,
      provider: activeProvider,
      trigger: composerTrigger,
    });
    if (!transition) return;
    recordEditorHistory();
    const nextSkills = skills.some(
      (skill) => skill.name === transition.skill.name && skill.path === transition.skill.path,
    )
      ? skills
      : [...skills, transition.skill];
    setPrompt(brandedThreadId, transition.prompt);
    setSkills(brandedThreadId, nextSkills);
    setNativeValue(transition.prompt, transition.selectionStart, transition.selectionEnd);
    setComposerTrigger(null);
  }

  function handleComposerMenuKey(event: {
    readonly key: string;
    readonly shiftKey?: boolean;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) {
    "background only";
    if (
      composerMenuItems.length === 0 &&
      event.key === "Enter" &&
      event.shiftKey !== true &&
      !nativeEditorSnapshotRef.current.isComposing
    ) {
      event.preventDefault();
      event.stopPropagation();
      void activatePrimaryAction();
      return;
    }
    if (composerMenuItems.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setComposerHighlightedItemId((current) =>
        nudgeComposerMenuActiveItemId({
          activeItemId: current,
          direction: event.key === "ArrowDown" ? "next" : "previous",
          items: composerMenuItems,
        }),
      );
      return;
    }
    if (event.key !== "Enter" && event.key !== "Tab") {
      return;
    }
    const item = findComposerMenuActiveItem({
      activeItemId: composerHighlightedItemId,
      items: composerMenuItems,
    });
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    if (item.type === "skill") {
      selectSkill(item);
    } else if (composerTrigger?.kind === "slash-command") {
      selectSlashCommand(item);
    } else if (item.type === "agent") {
      selectAgentMention(item);
    } else if (composerTrigger?.kind === "mention") {
      selectThreadMention(item);
    }
  }

  function clearDraftAfterSend() {
    "background only";
    clearDraft(brandedThreadId);
    setNativeValue("");
    setComposerTrigger(null);
  }

  function removePastedTextFromDraft(pastedTextId: string) {
    "background only";
    recordEditorHistory();
    removePastedText(brandedThreadId, pastedTextId);
  }

  async function pickNativeComposerFiles() {
    "background only";
    setSendError(null);
    try {
      const picked = await dialogs.pickFiles();
      const resolved = await resolvePickedComposerFiles({
        existingAttachmentCount: files.length + images.length + assistantSelections.length,
        files: picked.files,
      });
      await Promise.all(resolved.rejectedTokens.map((token) => releasePickedComposerFile(token)));
      if (resolved.files.length > 0) {
        addFiles(brandedThreadId, resolved.files);
      }
      if (resolved.images.length > 0) {
        addImages(brandedThreadId, resolved.images);
      }
      const error = resolved.error ?? picked.errors[picked.errors.length - 1] ?? null;
      if (error) setSendError(error);
    } catch (error) {
      setSendError(`Unable to add files: ${String(error)}`);
    } finally {
      restoreNativeFocus();
    }
  }

  async function pasteNativeClipboardText(text: string) {
    "background only";
    if (!focused || !text) return;
    const nativeEditor = nativeEditorSnapshotRef.current;
    if (nativeEditor.isComposing) {
      setSendError("Finish the current text composition before pasting.");
      return;
    }
    recordEditorHistory(nativeEditor);
    const nextDisplay = `${nativeEditor.value.slice(
      0,
      nativeEditor.selectionStart,
    )}${text}${nativeEditor.value.slice(nativeEditor.selectionEnd)}`;
    const nextDisplaySelection = nativeEditor.selectionStart + text.length;
    const projected = applyNativeComposerDisplayEdit({
      projection: draftProjectionRef.current,
      displayText: nextDisplay,
      displaySelectionStart: nextDisplaySelection,
      displaySelectionEnd: nextDisplaySelection,
    });
    const transition = resolveComposerInputTransition({
      previousPrompt: draft,
      nextPrompt: projected.canonicalText,
      selectionStart: projected.canonicalSelectionStart,
      selectionEnd: projected.canonicalSelectionEnd,
      isComposing: false,
    });
    setPrompt(brandedThreadId, transition.prompt);
    setMentions(brandedThreadId, projected.mentions);
    setSkills(brandedThreadId, projected.skills);
    setTerminalContexts(brandedThreadId, projected.terminalContexts);
    if (transition.kind === "collapsed-paste") {
      addPastedText(
        brandedThreadId,
        createPastedTextDraft({
          id: `lynx-paste-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: new Date().toISOString(),
          text: transition.pastedText,
        }),
      );
    }
    const nextTrigger = detectComposerTrigger(transition.prompt, transition.selectionStart);
    setNativeValue(
      transition.prompt,
      transition.selectionStart,
      transition.selectionEnd,
      nextTrigger,
    );
    setComposerTrigger(nextTrigger);
    setSendError(null);
  }

  useEffect(() => {
    "background only";
    const disposePaste = onGlobalEvent(
      "composer:paste-text",
      (payload: { readonly text?: unknown } | string) => {
        const text =
          typeof payload === "string"
            ? payload
            : typeof payload?.text === "string"
              ? payload.text
              : "";
        if (text) void pasteNativeClipboardText(text);
      },
    );
    const disposeUndo = onGlobalEvent("composer:undo", () => {
      activateEditorHistory("undo");
    });
    const disposeRedo = onGlobalEvent("composer:redo", () => {
      activateEditorHistory("redo");
    });
    const disposeSelectAll = onGlobalEvent("composer:select-all", () => {
      void selectAllNativeEditorText();
    });
    const disposeCopy = onGlobalEvent("composer:copy", () => {
      void copyOrCutNativeEditorText(false);
    });
    const disposeCut = onGlobalEvent("composer:cut", () => {
      void copyOrCutNativeEditorText(true);
    });
    const disposeShellCommand = onGlobalEvent("shell:command", (command: string) => {
      if (command === "composer.focus.toggle") restoreNativeFocus();
    });
    return () => {
      disposePaste();
      disposeUndo();
      disposeRedo();
      disposeSelectAll();
      disposeCopy();
      disposeCut();
      disposeShellCommand();
    };
  }, [focused, brandedThreadId, draft]);

  function removeNativeComposerFile(fileId: string) {
    "background only";
    const file = files.find((entry) => entry.id === fileId);
    if (!file) return;
    removeFile(brandedThreadId, fileId);
    void releasePickedComposerFile(file.token);
    restoreNativeFocus();
  }

  function removeNativeComposerImage(imageId: string) {
    "background only";
    const image = images.find((entry) => entry.id === imageId);
    if (!image) return;
    removeImage(brandedThreadId, imageId);
    if (image.appSnapCaptureId) {
      void import(/* webpackMode: "eager" */ "../../platform/appSnap").then(({ appSnap }) =>
        appSnap.acknowledgeCapture(image.appSnapCaptureId!),
      );
    }
    void releasePickedComposerFile(image.token);
    setExpandedImage(null);
    restoreNativeFocus();
  }

  function navigateExpandedImage(direction: -1 | 1) {
    "background only";
    setExpandedImage((current) => {
      if (!current || current.images.length <= 1) return current;
      return {
        ...current,
        index: (current.index + direction + current.images.length) % current.images.length,
      };
    });
  }

  function showPastedTextInField(pastedTextId: string) {
    "background only";
    const pastedText = pastedTexts.find((entry) => entry.id === pastedTextId);
    if (!pastedText) return;
    recordEditorHistory();
    const nextPrompt = appendPastedTextToEditablePrompt(draft, pastedText.text);
    setPrompt(brandedThreadId, nextPrompt);
    removePastedText(brandedThreadId, pastedTextId);
    setNativeValue(nextPrompt);
  }

  function toggleFastMode() {
    "background only";
    if (!activeModelSelection || !activeTraitSelection || !supportsFastMode) {
      return;
    }
    const nextOptions = buildNextProviderOptions(
      activeModelSelection.provider,
      activeModelSelection.options,
      { fastMode: !activeTraitSelection.fastModeEnabled },
    );
    setModelSelection(
      brandedThreadId,
      buildModelSelection(activeModelSelection.provider, activeModelSelection.model, nextOptions),
    );
  }

  async function activatePrimaryAction() {
    "background only";
    if (isRunningComposerSession(sessionStatus)) {
      setSendError(null);
      setIsStopping(true);
      try {
        await dispatchSynaraCommand(
          buildComposerTurnInterruptCommand({
            activeTurnId,
            commandId: createComposerDispatchId("command"),
            createdAt: new Date().toISOString(),
            threadId,
          }),
        );
      } catch (error) {
        console.error("[slice] failed to interrupt turn", error);
        setSendError("Unable to stop the current response.");
      } finally {
        setIsStopping(false);
      }
      return;
    }

    const nativeEditor = await readNativeEditorSnapshot(draft);
    if (!nativeEditor) {
      setSendError("Unable to read the current draft. Try again.");
      return;
    }
    if (nativeEditor.isComposing) {
      setSendError("Finish the current text composition before sending.");
      return;
    }
    nativeSelectionRef.current = {
      selectionStart: nativeEditor.selectionStart,
      selectionEnd: nativeEditor.selectionEnd,
    };
    nativeEditorSnapshotRef.current = nativeEditor;
    const projectedEditor = applyNativeComposerDisplayEdit({
      projection: draftProjectionRef.current,
      displayText: nativeEditor.value,
      displaySelectionStart: nativeEditor.selectionStart,
      displaySelectionEnd: nativeEditor.selectionEnd,
    });
    if (projectedEditor.canonicalText !== draft) {
      setPrompt(brandedThreadId, projectedEditor.canonicalText);
      setMentions(brandedThreadId, projectedEditor.mentions);
      setSkills(brandedThreadId, projectedEditor.skills);
      setTerminalContexts(brandedThreadId, projectedEditor.terminalContexts);
    }
    const text = buildComposerSendText({
      prompt: projectedEditor.canonicalText,
      pastedTexts,
      fileComments,
      terminalContexts: projectedEditor.terminalContexts,
    });
    if (
      (!text && files.length === 0 && images.length === 0 && fileComments.length === 0) ||
      sendInFlightRef.current ||
      !activeModelSelection ||
      !runtimeMode ||
      !interactionMode
    ) {
      return;
    }

    sendInFlightRef.current = true;
    setIsSending(true);
    setSendError(null);
    try {
      await runComposerSendTransaction({
        prepare: () =>
          onBeforeSend?.({
            interactionMode,
            modelSelection: activeModelSelection,
            runtimeMode,
            text: text || "Review the attachment.",
          }),
        dispatch: async () => {
          const stagedFiles = await stageNativeComposerFiles({
            files: [...images, ...files],
            threadId,
          });
          const assistantDeliveryMode = await resolveNativeAssistantDeliveryMode();
          await stagedFiles.runWithDispatch((attachments) =>
            dispatchSynaraCommand(
              buildComposerTurnStartCommand({
                assistantDeliveryMode,
                attachments: [...attachments, ...assistantSelections],
                commandId: createComposerDispatchId("command"),
                createdAt: new Date().toISOString(),
                interactionMode,
                messageId: createComposerDispatchId("message"),
                modelSelection: activeModelSelection as never,
                runtimeMode,
                text: text || "Review the attachment.",
                threadId,
                mentions: projectedEditor.mentions,
                skills: projectedEditor.skills,
              }),
            ),
          );
          await Promise.all(
            [...images, ...files].map((file) => releasePickedComposerFile(file.token)),
          );
        },
        clearDraft: clearDraftAfterSend,
        onSucceeded: onSendSucceeded,
      });
    } catch (error) {
      console.error("[slice] failed to send composer turn", error);
      setSendError("Unable to send. Your draft is still here.");
    } finally {
      sendInFlightRef.current = false;
      setIsSending(false);
    }
  }

  async function setPlanMode(enabled: boolean) {
    "background only";
    setSendError(null);
    try {
      const nextInteractionMode = enabled ? "plan" : "default";
      if (onSetInteractionMode) {
        await onSetInteractionMode(nextInteractionMode);
        return;
      }
      await dispatchSynaraCommand(
        buildComposerInteractionModeSetCommand({
          commandId: createComposerDispatchId("command"),
          createdAt: new Date().toISOString(),
          interactionMode: nextInteractionMode,
          threadId,
        }),
      );
    } catch (error) {
      console.error("[slice] failed to update composer interaction mode", error);
      setSendError("Unable to update plan mode.");
    }
  }

  async function setRuntimeMode(nextRuntimeMode: RuntimeMode) {
    "background only";
    setSendError(null);
    try {
      if (onSetRuntimeMode) {
        await onSetRuntimeMode(nextRuntimeMode);
        return;
      }
      await dispatchSynaraCommand(
        buildComposerRuntimeModeSetCommand({
          commandId: createComposerDispatchId("command"),
          createdAt: new Date().toISOString(),
          runtimeMode: nextRuntimeMode,
          threadId,
        }),
      );
    } catch (error) {
      console.error("[slice] failed to update composer runtime mode", error);
      setSendError("Unable to update permissions.");
    }
  }

  const startVoiceRecording = voice.start;
  const cancelVoiceRecording = voice.cancel;
  const submitVoiceRecording = voice.submit;

  const isRunning = isRunningComposerSession(sessionStatus);
  const isConnecting = isConnectingComposerSession(sessionStatus);
  const sendDisabled =
    isSending ||
    isConnecting ||
    (draft.trim().length === 0 &&
      pastedTexts.length === 0 &&
      files.length === 0 &&
      images.length === 0) ||
    !activeModelSelection ||
    !runtimeMode ||
    !interactionMode;

  return (
    <ComposerInputSurfaceComposition focused={focused}>
      <ComposerEditorRegionComposition>
        {composerTrigger?.kind === "slash-command" ? (
          <ComposerCommandMenuComposition
            items={composerMenuItems}
            resolvedTheme={resolvedTheme}
            isLoading={providerSkillsPending}
            triggerKind="slash-command"
            activeItemId={activeComposerMenuItemId}
            onHighlightedItemChange={setComposerHighlightedItemId}
            onSelect={(item) => {
              "background only";
              if (item.type === "skill") selectSkill(item);
              else selectSlashCommand(item);
            }}
          />
        ) : composerTrigger?.kind === "skill" ? (
          <ComposerCommandMenuComposition
            items={skillItems}
            resolvedTheme={resolvedTheme}
            isLoading={providerSkillsPending}
            triggerKind="skill"
            activeItemId={activeComposerMenuItemId}
            onHighlightedItemChange={setComposerHighlightedItemId}
            onSelect={(item) => {
              "background only";
              selectSkill(item);
            }}
          />
        ) : composerTrigger?.kind === "mention" ? (
          <ComposerCommandMenuComposition
            items={composerMenuItems}
            resolvedTheme={resolvedTheme}
            isLoading={false}
            triggerKind="mention"
            activeItemId={activeComposerMenuItemId}
            onHighlightedItemChange={setComposerHighlightedItemId}
            onSelect={(item) => {
              "background only";
              if (item.type === "agent") selectAgentMention(item);
              else if (item.type === "path") selectPathMention(item);
              else selectThreadMention(item);
            }}
          />
        ) : null}
        <ComposerReferenceAttachmentsComposition
          assistantSelections={assistantSelections}
          fileComments={fileComments}
          pastedTexts={pastedTexts}
          files={files}
          images={images}
          nonPersistedImageIdSet={nonPersistedImageIdSet}
          onExpandImage={setExpandedImage}
          onRemoveAssistantSelections={() => removeAssistantSelections(brandedThreadId)}
          onRemoveFileComments={() => removeFileComments(brandedThreadId)}
          onRemovePastedText={(pastedTextId) => {
            "background only";
            removePastedTextFromDraft(pastedTextId);
          }}
          onShowPastedTextInField={(pastedTextId) => {
            "background only";
            showPastedTextInField(pastedTextId);
          }}
          onRemoveFile={removeNativeComposerFile}
          onRemoveImage={removeNativeComposerImage}
        />
        <ExpandedImageOverlay
          expandedImage={expandedImage}
          onClose={() => {
            "background only";
            setExpandedImage(null);
            restoreNativeFocus();
          }}
          onNavigate={navigateExpandedImage}
        />
        {auxiliaryTokens.length > 0 ? (
          <scroll-view className="ComposerTokenPreview" scroll-orientation="horizontal">
            <view className="ComposerTokenRow">
              {auxiliaryTokens.map((segment, index) => (
                <ComposerChip
                  key={`${segment.type}:${segmentLabel(segment)}:${index}`}
                  segment={segment}
                />
              ))}
            </view>
          </scroll-view>
        ) : null}
        <view
          ref={editorRegionRef}
          className={`ComposerProjectedEditorFlow${
            draftProjection.displayText.length === 0 ? " ComposerProjectedEditorFlow--empty" : ""
          }`}
          style={
            {
              "--type-composer-editor-size": `${normalizedChatFontSizePx}px`,
              "--composer-empty-editor-height": `${emptyEditorMinHeightPx}px`,
            } as Record<string, string>
          }
          capture-bindtap={restoreNativeFocus}
          bindtap={restoreNativeFocus}
        >
          {draftProjection.displayTokens.length > 0 ? (
            <ComposerProjectedVisualContent
              fontSizePx={normalizedChatFontSizePx}
              projection={draftProjection}
            />
          ) : null}
          <textarea
            key={nativeEditorFocusEpoch}
            ref={textareaRef}
            className={`ComposerTextarea${
              draftProjection.displayTokens.length > 0 ? " ComposerTextarea--projected" : ""
            }${draftProjection.displayText.length === 0 ? " ComposerTextarea--empty" : ""}`}
            style={{ fontSize: `${normalizedChatFontSizePx}px` }}
            aria-label="Message composer"
            accessibility-element={true}
            accessibility-label="Message composer"
            focusable={true}
            default-value={draftProjection.displayText}
            placeholder={placeholder}
            maxlength={8000}
            maxlines={nativeEditorMaxLines}
            enable-scroll-bar={true}
            confirm-type="send"
            bindconfirm={() => {
              "background only";
              if (composerMenuItems.length === 0 && !nativeEditorSnapshotRef.current.isComposing) {
                void activatePrimaryAction();
              }
            }}
            catchkeydown={handleComposerMenuKey}
            bindfocus={() => {
              "background only";
              claimComposerInputOwnership();
              setFocused(true);
            }}
            bindblur={() => {
              "background only";
              releaseComposerInputOwnership();
              setFocused(false);
            }}
            bindselection={(event) => {
              "background only";
              nativeSelectionRef.current = {
                selectionStart: event.detail.selectionStart,
                selectionEnd: event.detail.selectionEnd,
              };
              nativeEditorSnapshotRef.current = {
                ...nativeEditorSnapshotRef.current,
                selectionStart: event.detail.selectionStart,
                selectionEnd: event.detail.selectionEnd,
              };
            }}
            bindinput={(event) => {
              "background only";
              const previousNativeEditor = nativeEditorSnapshotRef.current;
              nativeEditorSnapshotRef.current = {
                value: event.detail.value,
                selectionStart: event.detail.selectionStart,
                selectionEnd: event.detail.selectionEnd,
                isComposing: event.detail.isComposing,
              };
              if (pendingNativeValueRef.current !== null) {
                const pendingNativeValue = pendingNativeValueRef.current;
                pendingNativeValueRef.current = null;
                const nativeValueAck = consumeComposerNativeValueAck({
                  eventValue: event.detail.value,
                  pending: pendingNativeValue,
                });
                if (nativeValueAck.matched) {
                  setComposerTrigger(nativeValueAck.triggerAfterAck);
                  return;
                }
              }
              if (event.detail.isComposing) {
                compositionHistorySnapshotRef.current ??=
                  captureEditorHistorySnapshot(previousNativeEditor);
              } else if (compositionHistorySnapshotRef.current) {
                editorHistoryRef.current = pushComposerEditorHistory({
                  state: editorHistoryRef.current,
                  snapshot: compositionHistorySnapshotRef.current,
                });
                compositionHistorySnapshotRef.current = null;
              } else {
                recordEditorHistory(previousNativeEditor);
              }
              nativeSelectionRef.current = {
                selectionStart: event.detail.selectionStart,
                selectionEnd: event.detail.selectionEnd,
              };
              const currentPrompt =
                useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]?.prompt ?? "";
              const projected = applyNativeComposerDisplayEdit({
                projection: draftProjectionRef.current,
                displayText: event.detail.value,
                displaySelectionStart: event.detail.selectionStart,
                displaySelectionEnd: event.detail.selectionEnd,
              });
              const transition = resolveComposerInputTransition({
                previousPrompt: currentPrompt,
                nextPrompt: projected.canonicalText,
                selectionStart: projected.canonicalSelectionStart,
                selectionEnd: projected.canonicalSelectionEnd,
                isComposing: event.detail.isComposing,
              });
              setPrompt(brandedThreadId, transition.prompt);
              setMentions(brandedThreadId, projected.mentions);
              setSkills(brandedThreadId, projected.skills);
              setTerminalContexts(brandedThreadId, projected.terminalContexts);
              if (transition.kind === "collapsed-paste") {
                addPastedText(
                  brandedThreadId,
                  createPastedTextDraft({
                    id: `lynx-paste-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    createdAt: new Date().toISOString(),
                    text: transition.pastedText,
                  }),
                );
                setNativeValue(
                  transition.prompt,
                  transition.selectionStart,
                  transition.selectionEnd,
                );
                setComposerTrigger(null);
                return;
              }
              setComposerTrigger(
                event.detail.isComposing
                  ? null
                  : detectComposerTrigger(transition.prompt, transition.selectionStart),
              );
            }}
          />
        </view>
      </ComposerEditorRegionComposition>
      <ComposerFooterRowComposition compact={compactFooter}>
        <ComposerFooterContentComposition
          compact={compactFooter}
          voiceBusy={isVoiceRecording || isVoiceTranscribing}
          leading={
            <>
              <ComposerExtrasMenuComposition
                interactionMode={interactionMode ?? "default"}
                supportsFastMode={supportsFastMode}
                fastModeEnabled={activeTraitSelection?.fastModeEnabled ?? false}
                imageAttachmentsAvailable={true}
                onPickAttachments={() => {
                  "background only";
                  void pickNativeComposerFiles();
                }}
                onAddPhotos={() => {
                  "background only";
                  void pickNativeComposerFiles();
                }}
                onToggleFastMode={toggleFastMode}
                onSetPlanMode={(enabled) => {
                  "background only";
                  void setPlanMode(enabled);
                }}
              />
              {!isVoiceRecording && !isVoiceTranscribing ? (
                <ComposerRuntimeModeControlComposition
                  hideLabel={compactFooter}
                  runtimeMode={runtimeMode}
                  onRuntimeModeChange={(nextRuntimeMode) => {
                    "background only";
                    void setRuntimeMode(nextRuntimeMode);
                  }}
                />
              ) : null}
              {sendError ? <text className="ComposerSendError">{sendError}</text> : null}
            </>
          }
          actions={
            <>
              {!isVoiceRecording &&
              !isVoiceTranscribing &&
              !compactFooter &&
              contextWindowDisplay ? (
                <ComposerContextWindowMeterElement
                  display={contextWindowDisplay}
                  usage={contextWindow}
                  cumulativeCostUsd={cumulativeCostUsd}
                />
              ) : null}
              {isVoiceRecording || isVoiceTranscribing ? (
                <ComposerVoiceRecorderBar
                  durationLabel={`${Math.floor(voiceDurationMs / 60000)}:${Math.floor(
                    (voiceDurationMs % 60000) / 1000,
                  )
                    .toString()
                    .padStart(2, "0")}`}
                  waveformLevels={voiceWaveformLevels}
                  transcribing={isVoiceTranscribing}
                  onCancel={() => {
                    if (isVoiceRecording) {
                      void submitVoiceRecording();
                      return;
                    }
                    cancelVoiceRecording();
                  }}
                  onSubmit={() => void submitVoiceRecording()}
                />
              ) : null}
              {!isVoiceRecording && !isVoiceTranscribing && activeModelSelection ? (
                <ComposerModelPicker
                  hideModelLabel={compactFooter}
                  hideStatusLabel={compactFooter}
                  modelSelection={activeModelSelection as never}
                  lockedProvider={emptyLanding ? null : (lockedProvider ?? null)}
                  catalogProvider={discoveryProvider ?? activeModelSelection.provider}
                  rememberedSelectionFor={(provider) =>
                    draftModelSelectionByProvider?.[provider] as ModelSelection | undefined
                  }
                  initialOpen={Boolean(initialModelMenuProvider)}
                  runtimeModels={runtimeModelCatalog?.models ?? []}
                  modelsLoading={
                    runtimeModelsPending || (runtimeModelsFetching && !runtimeModelCatalog)
                  }
                  providers={providerStatuses ?? serverConfig?.providers ?? []}
                  onCatalogProviderChange={(provider) => {
                    "background only";
                    setModelCatalogProvider(provider);
                  }}
                  onModelSelectionChange={(nextModelSelection) => {
                    "background only";
                    setModelSelection(brandedThreadId, nextModelSelection);
                    setModelCatalogProvider(null);
                  }}
                  onOpenProviderSettings={onOpenProviderSettings}
                />
              ) : null}
              {!isVoiceRecording && !isVoiceTranscribing && showVoiceNotesControl ? (
                <ComposerVoiceButton
                  disabled={isSending || isConnecting || !workspaceRoot}
                  onActivate={() => void startVoiceRecording()}
                />
              ) : null}
              {!isVoiceRecording && !isVoiceTranscribing ? (
                <ComposerPrimaryActionComposition
                  mode={isRunning ? "stop" : isSending || isConnecting ? "sending" : "send"}
                  accessibleLabel={isConnecting ? "Connecting" : undefined}
                  disabled={!isRunning && sendDisabled}
                  onActivate={() => {
                    "background only";
                    void activatePrimaryAction();
                  }}
                />
              ) : null}
            </>
          }
        />
      </ComposerFooterRowComposition>
      <ComposerLifecycleStatus
        operation={sendError ? "error" : isStopping ? "stopping" : isSending ? "sending" : "idle"}
        sessionStatus={sessionStatus}
        errorMessage={sendError}
      />
    </ComposerInputSurfaceComposition>
  );
}
