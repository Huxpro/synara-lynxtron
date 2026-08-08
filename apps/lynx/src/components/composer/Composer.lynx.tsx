import microphoneSvg from '@synara-central-icons/microphone.svg?raw';
import { useEffect, useMemo, useRef, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type {
  ModelSelection,
  ProviderKind,
  ProviderMentionReference,
  ProviderSkillReference,
  ServerProviderStatus,
} from '@synara/contracts';

import { useComposerDraftStore } from '../../adapters/composerDraftStore.lynx';
import { useTheme } from '../../adapters/useTheme.lynx';
import { colorizeLynxSvg } from '../../lib/themedSvg.lynx';
import { dialogs } from '../../platform/dialogs';
import { onGlobalEvent } from '../../platform/bridge';
import { clipboard as clipboardPort } from '../../platform/clipboard';
import { sleepOnHost } from '../../platform/timer';
import { fetchSidebarSnapshot } from '../../app/queries';
import {
  splitPromptIntoComposerSegments,
  type ComposerPromptSegment,
} from '@synara-web/composer-editor-mentions';
import {
  detectComposerTrigger,
  type ComposerTrigger,
} from '@synara-web/composer-logic';
import {
  ComposerCommandMenuComposition,
  type ComposerCommandItem,
} from '@synara-web/components/chat/ComposerCommandMenuComposition';
import {
  buildThreadMentionComposerItems,
} from '@synara-web/components/chat/ComposerThreadMentionItems';
import {
  ComposerExtrasMenuComposition,
} from '@synara-web/components/chat/ComposerExtrasMenuComposition';
import { getComposerTraitSelection } from '@synara-web/components/chat/composerTraits';
import {
  buildSkillSearchFields,
  rankProviderDiscoveryItems,
} from '@synara-web/lib/providerDiscovery';
import { resolveRuntimeModelDescriptor } from '@synara-web/components/chat/runtimeModelCapabilities';
import { ComposerRuntimeModeControlComposition } from '@synara-web/components/chat/ComposerRuntimeModeControlComposition';
import { ComposerReferenceAttachmentsComposition } from '@synara-web/components/chat/ComposerReferenceAttachmentsComposition';
import {
  ComposerEditorRegionComposition,
  ComposerFooterContentComposition,
  ComposerFooterRowComposition,
  ComposerInputSurfaceComposition,
  ComposerPrimaryActionComposition,
} from '@synara-web/components/chat/ComposerInputComposition';
import { ComposerLifecycleStatus } from '@synara-web/components/chat/ComposerLifecycleStatus';
import {
  formatComposerSkillChipLabel,
  formatComposerSlashCommandChipLabel,
} from '@synara-web/components/composerInlineChip';
import {
  buildModelSelection,
  buildNextProviderOptions,
} from '@synara-web/providerModelOptions';
import {
  appendPastedTextToEditablePrompt,
  appendPastedTextsToPrompt,
  createPastedTextDraft,
  type PastedTextDraft,
} from '@synara-web/lib/composerPastedText';
import {
  dispatchSynaraCommand,
  fetchProviderModels,
  fetchProviderSkills,
  fetchServerConfig,
} from '../../data/synaraClient.lynx';
import {
  buildComposerInteractionModeSetCommand,
  buildComposerRuntimeModeSetCommand,
  buildComposerTurnInterruptCommand,
  buildComposerTurnStartCommand,
  isConnectingComposerSession,
  isRunningComposerSession,
  runComposerSendTransaction,
} from './composerDispatch.logic';
import { resolveComposerInputTransition } from './composerPastedTextInput.logic';
import {
  cutComposerNativeEditorSelection,
  normalizeComposerNativeEditorSnapshot,
  selectAllComposerNativeEditor,
  type ComposerNativeEditorSnapshot,
} from './composerNativeEditor.logic';
import {
  consumeComposerNativeValueAck,
  type ComposerNativeValueAck,
} from './composerNativeValueAck.logic';
import {
  createComposerEditorHistory,
  pushComposerEditorHistory,
  redoComposerEditorHistory,
  undoComposerEditorHistory,
  type ComposerEditorHistorySnapshot,
} from './composerEditorHistory.logic';
import {
  applyNativeComposerDisplayEdit,
  createNativeComposerDraftProjection,
  displayOffsetForCanonicalOffset,
  type NativeComposerDisplayToken,
} from './composerDraftProjection.logic';
import {
  releasePickedComposerFile,
  resolvePickedComposerFiles,
  stageNativeComposerFiles,
  type NativeComposerFileAttachment,
} from './composerAttachments.lynx';
import { ComposerModelControl } from './ComposerModelControl.lynx';
import { Button } from '../ui/button';
import {
  buildLynxSlashCommandItems,
  resolveLynxSkillSelection,
  resolveLynxSlashCommandSelection,
  resolveLynxThreadMentionSelection,
} from './composerCommandMenu.logic';

import './composer.css';

type ComposerTokenSegment = Exclude<ComposerPromptSegment, { readonly type: 'text' }>;
const EMPTY_MENTIONS: ReadonlyArray<
  Extract<ComposerCommandItem, { type: 'thread' }>['mention']
> = [];
const EMPTY_PASTED_TEXTS: ReadonlyArray<PastedTextDraft> = [];
const EMPTY_FILES: ReadonlyArray<NativeComposerFileAttachment> = [];
const EMPTY_SKILLS: ReadonlyArray<ProviderSkillReference> = [];
const EMPTY_NON_PERSISTED_IMAGE_IDS: ReadonlySet<string> = new Set();
interface ComposerEditorHistoryContext {
  readonly mentions: ReadonlyArray<ProviderMentionReference>;
  readonly pastedTexts: ReadonlyArray<PastedTextDraft>;
  readonly skills: ReadonlyArray<ProviderSkillReference>;
}
function segmentLabel(segment: ComposerTokenSegment): string {
  if (segment.type === 'mention') return segment.path.split(/[\\/]/).pop() || segment.path;
  if (segment.type === 'skill') return formatComposerSkillChipLabel(segment.name);
  if (segment.type === 'slash-command') {
    return formatComposerSlashCommandChipLabel(segment.command);
  }
  if (segment.type === 'agent-mention') return `@${segment.alias}`;
  if (segment.type === 'terminal-context') {
    return segment.context?.terminalLabel ?? 'Terminal context';
  }
  return segment.url;
}

function segmentGlyph(segment: ComposerTokenSegment): string {
  if (segment.type === 'mention' || segment.type === 'agent-mention') return '@';
  if (segment.type === 'skill') return '◆';
  if (segment.type === 'slash-command') return '/';
  if (segment.type === 'terminal-context') return '›';
  return '↗';
}

function ComposerChip({
  segment,
}: {
  readonly segment: ComposerTokenSegment;
}) {
  return (
    <view className={`ComposerChip ComposerChip--${segment.type}`}>
      <text className="ComposerChipGlyph">{segmentGlyph(segment)}</text>
      <text className="ComposerChipLabel">{segmentLabel(segment)}</text>
    </view>
  );
}

function ComposerProjectionChip({
  token,
}: {
  readonly token: NativeComposerDisplayToken;
}) {
  return (
    <view className={`ComposerChip ComposerChip--${token.kind}`}>
      <text className="ComposerChipGlyph">
        {token.kind === 'mention' ? '@' : '◆'}
      </text>
      <text className="ComposerChipLabel">{token.label}</text>
    </view>
  );
}

function ComposerProjectedVisualContent({
  projection,
}: {
  readonly projection: ReturnType<typeof createNativeComposerDraftProjection>;
}) {
  return (
    <view className="ComposerProjectedVisualContent" aria-hidden="true">
      {projection.plainSegments.map((plain, index) => (
        <view
          className="ComposerProjectedVisualSegment"
          key={`plain:${index}`}
        >
          {plain ? (
            <text className="ComposerProjectedVisualText">{plain}</text>
          ) : null}
          {projection.displayTokens[index] ? (
            <ComposerProjectionChip
              token={projection.displayTokens[index]!}
            />
          ) : null}
        </view>
      ))}
    </view>
  );
}

interface ComposerProps {
  readonly activeTurnId: string | null;
  readonly interactionMode: 'default' | 'plan' | undefined;
  readonly modelSelection: ModelSelection | undefined;
  readonly runtimeMode: 'full-access' | 'approval-required' | undefined;
  readonly sessionStatus: string | null;
  readonly threadId: string;
  readonly draftId?: string;
  readonly workspaceRoot?: string | null;
  readonly emptyLanding?: boolean;
  readonly onBeforeSend?: (input: {
    readonly interactionMode: 'default' | 'plan';
    readonly modelSelection: ModelSelection;
    readonly runtimeMode: 'full-access' | 'approval-required';
    readonly text: string;
  }) => Promise<void>;
  readonly onProviderStatusesChange?: (
    statuses: readonly ServerProviderStatus[]
  ) => void;
  readonly onSetInteractionMode?: (
    interactionMode: 'default' | 'plan'
  ) => void | Promise<void>;
  readonly onSendSucceeded?: () => void | Promise<void>;
}

function createComposerDispatchId(kind: 'command' | 'message'): string {
  'background only';
  return `lynx-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function Composer({
  activeTurnId,
  interactionMode,
  modelSelection,
  runtimeMode,
  sessionStatus,
  threadId,
  draftId,
  workspaceRoot,
  emptyLanding = false,
  onBeforeSend,
  onProviderStatusesChange,
  onSetInteractionMode,
  onSendSucceeded,
}: ComposerProps) {
  const { resolvedTheme, svgColors } = useTheme();
  const textareaRef = useRef<React.ElementRef<'textarea'>>(null);
  const brandedThreadId = (draftId ?? threadId) as never;
  const draft = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.prompt ?? ''
  );
  const assistantSelections = useComposerDraftStore(
    (state) =>
      state.draftsByThreadId[brandedThreadId]?.assistantSelections ?? []
  );
  const pastedTexts = useComposerDraftStore(
    (state) =>
      state.draftsByThreadId[brandedThreadId]?.pastedTexts ??
      EMPTY_PASTED_TEXTS
  );
  const files = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.files ?? EMPTY_FILES
  );
  const mentions = useComposerDraftStore(
    (state) =>
      state.draftsByThreadId[brandedThreadId]?.mentions ?? EMPTY_MENTIONS
  );
  const skills = useComposerDraftStore(
    (state) => state.draftsByThreadId[brandedThreadId]?.skills ?? EMPTY_SKILLS
  );
  const draftProjection = useMemo(
    () =>
      createNativeComposerDraftProjection({
        canonicalText: draft,
        mentions,
        skills,
      }),
    [draft, mentions, skills]
  );
  const draftModelSelection = useComposerDraftStore(
    (state) =>
      state.draftsByThreadId[brandedThreadId]?.modelSelection
  );
  const addPastedText = useComposerDraftStore((state) => state.addPastedText);
  const addFiles = useComposerDraftStore((state) => state.addFiles);
  const clearDraft = useComposerDraftStore((state) => state.clearDraft);
  const removePastedText = useComposerDraftStore(
    (state) => state.removePastedText
  );
  const removeFile = useComposerDraftStore((state) => state.removeFile);
  const removeAssistantSelections = useComposerDraftStore(
    (state) => state.removeAssistantSelections
  );
  const setPrompt = useComposerDraftStore((state) => state.setPrompt);
  const setModelSelection = useComposerDraftStore(
    (state) => state.setModelSelection
  );
  const setMentions = useComposerDraftStore((state) => state.setMentions);
  const setSkills = useComposerDraftStore((state) => state.setSkills);
  const [focused, setFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const sendInFlightRef = useRef(false);
  const [isStopping, setIsStopping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [composerTrigger, setComposerTrigger] =
    useState<ComposerTrigger | null>(null);
  const [modelCatalogProvider, setModelCatalogProvider] =
    useState<ProviderKind | null>(null);
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
  const editorHistoryRef = useRef(
    createComposerEditorHistory<ComposerEditorHistoryContext>()
  );
  const compositionHistorySnapshotRef = useRef<
    ComposerEditorHistorySnapshot<ComposerEditorHistoryContext> | null
  >(null);
  useEffect(() => {
    'background only';
    const prompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]
        ?.prompt ?? '';
    const current =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId];
    const projection = createNativeComposerDraftProjection({
      canonicalText: prompt,
      mentions: current?.mentions ?? EMPTY_MENTIONS,
      skills: current?.skills ?? EMPTY_SKILLS,
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
    editorHistoryRef.current =
      createComposerEditorHistory<ComposerEditorHistoryContext>();
    compositionHistorySnapshotRef.current = null;
  }, [brandedThreadId]);
  const activeModelSelection = draftModelSelection ?? modelSelection;
  const activeProvider = activeModelSelection?.provider as ProviderKind | undefined;
  const discoveryProvider = modelCatalogProvider ?? activeProvider;
  const { data: mentionSnapshot } = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: fetchSidebarSnapshot,
    refetchInterval: 5_000,
  });
  const {
    data: runtimeModelCatalog,
    isFetching: runtimeModelsFetching,
    isPending: runtimeModelsPending,
  } = useQuery({
    queryKey: [
      'provider-model-catalog',
      discoveryProvider ?? null,
      workspaceRoot ?? null,
    ],
    queryFn: () => {
      'background only';
      if (!discoveryProvider) {
        throw new Error('Provider model discovery requires an active provider.');
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
    queryKey: ['server-config'],
    queryFn: () => {
      'background only';
      return fetchServerConfig();
    },
    staleTime: 30_000,
  });
  useEffect(() => {
    if (serverConfig) {
      onProviderStatusesChange?.(serverConfig.providers);
    }
  }, [onProviderStatusesChange, serverConfig]);
  const {
    data: providerSkillsCatalog,
    isPending: providerSkillsPending,
  } = useQuery({
    queryKey: [
      'provider-skills',
      activeProvider ?? null,
      workspaceRoot ?? null,
      threadId,
    ],
    queryFn: () => {
      'background only';
      if (!activeProvider || !workspaceRoot) {
        throw new Error('Skill discovery requires a provider and workspace.');
      }
      return fetchProviderSkills({
        provider: activeProvider,
        cwd: workspaceRoot,
        threadId,
      });
    },
    enabled:
      composerTrigger?.kind === 'skill' &&
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
    [activeModelSelection, discoveryProvider, runtimeModelCatalog?.models]
  );
  const activeTraitSelection = useMemo(
    () =>
      activeModelSelection
        ? getComposerTraitSelection(
            activeModelSelection.provider,
            activeModelSelection.model,
            draft,
            activeModelSelection.options,
            activeRuntimeModel
          )
        : null,
    [activeModelSelection, activeRuntimeModel, draft]
  );
  const supportsFastMode = Boolean(
    activeTraitSelection &&
      (activeTraitSelection.fastModeDescriptor !== null ||
        activeTraitSelection.caps.supportsFastMode)
  );
  const mentionProjects = useMemo(
    () =>
      (mentionSnapshot?.projects ?? []).map((project) => ({
        id: project.id,
        kind: project.kind,
        name: project.title,
      })),
    [mentionSnapshot]
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
          : []
      ),
    [mentionSnapshot]
  );
  const segments = useMemo(() => splitPromptIntoComposerSegments(draft), [draft]);
  const auxiliaryTokens = segments.filter(
    (segment): segment is ComposerTokenSegment =>
      segment.type !== 'text' &&
      segment.type !== 'mention' &&
      segment.type !== 'skill'
  );
  const slashCommandItems = useMemo(
    () =>
      composerTrigger?.kind === 'slash-command'
        ? buildLynxSlashCommandItems(composerTrigger.query)
        : [],
    [composerTrigger]
  );
  const threadMentionItems = useMemo(
    () =>
      composerTrigger?.kind === 'mention'
        ? buildThreadMentionComposerItems({
            currentThreadId: threadId,
            projects: mentionProjects,
            query: composerTrigger.query,
            threads: mentionThreads,
          })
        : [],
    [composerTrigger, mentionProjects, mentionThreads, threadId]
  );
  const skillItems = useMemo<ComposerCommandItem[]>(() => {
    if (composerTrigger?.kind !== 'skill') return [];
    return rankProviderDiscoveryItems(
      providerSkillsCatalog?.skills ?? [],
      composerTrigger.query,
      buildSkillSearchFields
    )
      .map((skill) => ({
        id: `skill:${skill.path}`,
        type: 'skill' as const,
        skill,
        label: skill.name,
        description: skill.description ?? skill.path,
      }));
  }, [composerTrigger, providerSkillsCatalog?.skills]);

  function setNativeValue(
    canonicalValue: string,
    selectionStart = canonicalValue.length,
    selectionEnd = selectionStart,
    triggerAfterAck: ComposerTrigger | null = null
  ) {
    'background only';
    const current =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId];
    const projection = createNativeComposerDraftProjection({
      canonicalText: canonicalValue,
      mentions: current?.mentions ?? EMPTY_MENTIONS,
      skills: current?.skills ?? EMPTY_SKILLS,
    });
    draftProjectionRef.current = projection;
    const safeCanonicalSelectionStart = Math.max(
      0,
      Math.min(canonicalValue.length, selectionStart)
    );
    const safeCanonicalSelectionEnd = Math.max(
      safeCanonicalSelectionStart,
      Math.min(canonicalValue.length, selectionEnd)
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
      ?.invoke({ method: 'setValue', params: { value: projection.displayText } })
      .exec();
    textareaRef.current
      ?.invoke({ method: 'focus' })
      .exec();
    textareaRef.current
      ?.invoke({ method: 'setSelectionRange', params: nextSelection })
      .exec();
  }

  function restoreNativeFocus() {
    'background only';
    textareaRef.current?.invoke({ method: 'focus' }).exec();
    textareaRef.current
      ?.invoke({ method: 'setSelectionRange', params: nativeSelectionRef.current })
      .exec();
  }

  useEffect(() => {
    'background only';
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
        method: 'setValue',
        params: { value: draftProjection.displayText },
      })
      .exec();
    textareaRef.current
      ?.invoke({ method: 'setSelectionRange', params: selection })
      .exec();
  }, [draftProjection]);

  async function readNativeEditorSnapshot(fallbackPrompt: string): Promise<{
    readonly isComposing: boolean;
    readonly selectionEnd: number;
    readonly selectionStart: number;
    readonly value: string;
  } | null> {
    'background only';
    const fallbackProjection = draftProjectionRef.current.canonicalText === fallbackPrompt
      ? draftProjectionRef.current
      : createNativeComposerDraftProjection({
          canonicalText: fallbackPrompt,
          mentions,
          skills,
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
          method: 'getValue',
          success: (result) => {
            'background only';
            if (
              !result ||
              typeof (result as { value?: unknown }).value !== 'string'
            ) {
              resolve(fallback);
              return;
            }
            resolve(normalizeComposerNativeEditorSnapshot(result));
          },
          fail: () => {
            'background only';
            resolve(fallback);
          },
        })
        .exec();
    });
    return Promise.race([
      nativeSnapshot,
      sleepOnHost(500).then(() => fallback),
    ]);
  }

  function captureEditorHistorySnapshot(
    editor: ComposerNativeEditorSnapshot = nativeEditorSnapshotRef.current
  ): ComposerEditorHistorySnapshot<ComposerEditorHistoryContext> {
    'background only';
    const current =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId];
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
      },
    };
  }

  function recordEditorHistory(
    editor: ComposerNativeEditorSnapshot = nativeEditorSnapshotRef.current
  ) {
    'background only';
    editorHistoryRef.current = pushComposerEditorHistory({
      state: editorHistoryRef.current,
      snapshot: captureEditorHistorySnapshot(editor),
    });
  }

  function restoreEditorHistorySnapshot(
    snapshot: ComposerEditorHistorySnapshot<ComposerEditorHistoryContext>
  ) {
    'background only';
    const current =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId];
    for (const pastedText of current?.pastedTexts ?? EMPTY_PASTED_TEXTS) {
      removePastedText(brandedThreadId, pastedText.id);
    }
    for (const pastedText of snapshot.context.pastedTexts) {
      addPastedText(brandedThreadId, pastedText);
    }
    setMentions(brandedThreadId, snapshot.context.mentions);
    setSkills(brandedThreadId, snapshot.context.skills);
    setPrompt(brandedThreadId, snapshot.value);
    const nextTrigger = detectComposerTrigger(
      snapshot.value,
      snapshot.selectionStart
    );
    setNativeValue(
      snapshot.value,
      snapshot.selectionStart,
      snapshot.selectionEnd,
      nextTrigger
    );
    setComposerTrigger(nextTrigger);
    setSendError(null);
  }

  function activateEditorHistory(direction: 'undo' | 'redo') {
    'background only';
    if (!focused) return;
    const current = captureEditorHistorySnapshot();
    const transition =
      direction === 'undo'
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

  function selectAllNativeEditorText() {
    'background only';
    if (!focused) return;
    const selected = selectAllComposerNativeEditor(
      nativeEditorSnapshotRef.current
    );
    setNativeValue(
      selected.value,
      selected.selectionStart,
      selected.selectionEnd
    );
  }

  async function copyOrCutNativeEditorText(cut: boolean) {
    'background only';
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
      projected.canonicalSelectionEnd
    );
    if (!selectedText) return;
    try {
      await clipboardPort.writeText(selectedText);
    } catch {
      setSendError('Unable to write the selected text to the clipboard.');
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
    const nextTrigger = detectComposerTrigger(
      edit.canonicalText,
      edit.canonicalSelectionStart
    );
    setNativeValue(
      edit.canonicalText,
      edit.canonicalSelectionStart,
      edit.canonicalSelectionEnd,
      nextTrigger
    );
    setComposerTrigger(nextTrigger);
  }

  function selectSlashCommand(item: ComposerCommandItem) {
    'background only';
    if (!composerTrigger) return;
    const currentPrompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]
        ?.prompt ?? '';
    const transition = resolveLynxSlashCommandSelection({
      item,
      prompt: currentPrompt,
      trigger: composerTrigger,
    });
    if (!transition) return;
    recordEditorHistory();
    setPrompt(brandedThreadId, transition.prompt);
    setNativeValue(
      transition.prompt,
      transition.selectionStart,
      transition.selectionEnd
    );
    setComposerTrigger(null);
    if (transition.interactionMode) {
      void setPlanMode(transition.interactionMode === 'plan');
    }
  }

  function selectThreadMention(item: ComposerCommandItem) {
    'background only';
    if (!composerTrigger) return;
    const currentPrompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]
        ?.prompt ?? '';
    const transition = resolveLynxThreadMentionSelection({
      item,
      prompt: currentPrompt,
      trigger: composerTrigger,
    });
    if (!transition) return;
    recordEditorHistory();
    const nextMentions = [
      ...mentions.filter(
        (mention) => mention.name !== transition.mention.name
      ),
      transition.mention,
    ];
    setPrompt(brandedThreadId, transition.prompt);
    setMentions(brandedThreadId, nextMentions);
    setNativeValue(
      transition.prompt,
      transition.selectionStart,
      transition.selectionEnd
    );
    setComposerTrigger(null);
  }

  function selectSkill(item: ComposerCommandItem) {
    'background only';
    if (!composerTrigger || !activeProvider) return;
    const currentPrompt =
      useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]
        ?.prompt ?? '';
    const transition = resolveLynxSkillSelection({
      item,
      prompt: currentPrompt,
      provider: activeProvider,
      trigger: composerTrigger,
    });
    if (!transition) return;
    recordEditorHistory();
    const nextSkills = skills.some(
      (skill) =>
        skill.name === transition.skill.name &&
        skill.path === transition.skill.path
    )
      ? skills
      : [...skills, transition.skill];
    setPrompt(brandedThreadId, transition.prompt);
    setSkills(brandedThreadId, nextSkills);
    setNativeValue(
      transition.prompt,
      transition.selectionStart,
      transition.selectionEnd
    );
    setComposerTrigger(null);
  }

  function clearDraftAfterSend() {
    'background only';
    clearDraft(brandedThreadId);
    setNativeValue('');
    setComposerTrigger(null);
  }

  function removePastedTextFromDraft(pastedTextId: string) {
    'background only';
    recordEditorHistory();
    removePastedText(brandedThreadId, pastedTextId);
  }

  async function pickNativeComposerFiles() {
    'background only';
    setSendError(null);
    try {
      const picked = await dialogs.pickFiles();
      const resolved = resolvePickedComposerFiles({
        existingAttachmentCount: files.length,
        files: picked.files,
      });
      await Promise.all(
        resolved.rejectedTokens.map((token) => releasePickedComposerFile(token))
      );
      if (resolved.files.length > 0) {
        addFiles(brandedThreadId, resolved.files);
      }
      const error =
        resolved.error ?? picked.errors[picked.errors.length - 1] ?? null;
      if (error) setSendError(error);
    } catch (error) {
      setSendError(`Unable to add files: ${String(error)}`);
    } finally {
      restoreNativeFocus();
    }
  }

  async function pasteNativeClipboardText(text: string) {
    'background only';
    if (!focused || !text) return;
    const nativeEditor = nativeEditorSnapshotRef.current;
    if (nativeEditor.isComposing) {
      setSendError('Finish the current text composition before pasting.');
      return;
    }
    recordEditorHistory(nativeEditor);
    const nextDisplay = `${nativeEditor.value.slice(
      0,
      nativeEditor.selectionStart
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
    if (transition.kind === 'collapsed-paste') {
      addPastedText(
        brandedThreadId,
        createPastedTextDraft({
          id: `lynx-paste-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: new Date().toISOString(),
          text: transition.pastedText,
        })
      );
    }
    const nextTrigger = detectComposerTrigger(
      transition.prompt,
      transition.selectionStart
    );
    setNativeValue(
      transition.prompt,
      transition.selectionStart,
      transition.selectionEnd,
      nextTrigger
    );
    setComposerTrigger(nextTrigger);
    setSendError(null);
  }

  useEffect(() => {
    'background only';
    const disposePaste = onGlobalEvent(
      'composer:paste-text',
      (payload: { readonly text?: unknown } | string) => {
        const text =
          typeof payload === 'string'
            ? payload
            : typeof payload?.text === 'string'
              ? payload.text
              : '';
        if (text) void pasteNativeClipboardText(text);
      }
    );
    const disposeUndo = onGlobalEvent('composer:undo', () => {
      activateEditorHistory('undo');
    });
    const disposeRedo = onGlobalEvent('composer:redo', () => {
      activateEditorHistory('redo');
    });
    const disposeSelectAll = onGlobalEvent('composer:select-all', () => {
      selectAllNativeEditorText();
    });
    const disposeCopy = onGlobalEvent('composer:copy', () => {
      void copyOrCutNativeEditorText(false);
    });
    const disposeCut = onGlobalEvent('composer:cut', () => {
      void copyOrCutNativeEditorText(true);
    });
    const disposeShellCommand = onGlobalEvent(
      'shell:command',
      (command: string) => {
        if (command === 'composer.focus.toggle') restoreNativeFocus();
      }
    );
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
    'background only';
    const file = files.find((entry) => entry.id === fileId);
    if (!file) return;
    removeFile(brandedThreadId, fileId);
    void releasePickedComposerFile(file.token);
    restoreNativeFocus();
  }

  function showPastedTextInField(pastedTextId: string) {
    'background only';
    const pastedText = pastedTexts.find((entry) => entry.id === pastedTextId);
    if (!pastedText) return;
    recordEditorHistory();
    const nextPrompt = appendPastedTextToEditablePrompt(draft, pastedText.text);
    setPrompt(brandedThreadId, nextPrompt);
    removePastedText(brandedThreadId, pastedTextId);
    setNativeValue(nextPrompt);
  }

  function toggleFastMode() {
    'background only';
    if (!activeModelSelection || !activeTraitSelection || !supportsFastMode) {
      return;
    }
    const nextOptions = buildNextProviderOptions(
      activeModelSelection.provider,
      activeModelSelection.options,
      { fastMode: !activeTraitSelection.fastModeEnabled }
    );
    setModelSelection(
      brandedThreadId,
      buildModelSelection(
        activeModelSelection.provider,
        activeModelSelection.model,
        nextOptions
      )
    );
  }

  async function activatePrimaryAction() {
    'background only';
    if (isRunningComposerSession(sessionStatus)) {
      setSendError(null);
      setIsStopping(true);
      try {
        await dispatchSynaraCommand(
          buildComposerTurnInterruptCommand({
            activeTurnId,
            commandId: createComposerDispatchId('command'),
            createdAt: new Date().toISOString(),
            threadId,
          })
        );
      } catch (error) {
        console.error('[slice] failed to interrupt turn', error);
        setSendError('Unable to stop the current response.');
      } finally {
        setIsStopping(false);
      }
      return;
    }

    const nativeEditor = await readNativeEditorSnapshot(draft);
    if (!nativeEditor) {
      setSendError('Unable to read the current draft. Try again.');
      return;
    }
    if (nativeEditor.isComposing) {
      setSendError('Finish the current text composition before sending.');
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
    }
    const text = appendPastedTextsToPrompt(
      projectedEditor.canonicalText,
      pastedTexts
    ).trim();
    if (
      (!text && files.length === 0) ||
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
            text: text || 'Review the attached file.',
          }),
        dispatch: async () => {
          const stagedFiles = await stageNativeComposerFiles({
            files,
            threadId,
          });
          await stagedFiles.runWithDispatch((attachments) =>
            dispatchSynaraCommand(
              buildComposerTurnStartCommand({
                attachments: [...attachments, ...assistantSelections],
                commandId: createComposerDispatchId('command'),
                createdAt: new Date().toISOString(),
                interactionMode,
                messageId: createComposerDispatchId('message'),
                modelSelection: activeModelSelection as never,
                runtimeMode,
                text: text || 'Review the attached file.',
                threadId,
                mentions: projectedEditor.mentions,
                skills: projectedEditor.skills,
              })
            )
          );
          await Promise.all(
            files.map((file) => releasePickedComposerFile(file.token))
          );
        },
        clearDraft: clearDraftAfterSend,
        onSucceeded: onSendSucceeded,
      });
    } catch (error) {
      console.error('[slice] failed to send composer turn', error);
      setSendError('Unable to send. Your draft is still here.');
    } finally {
      sendInFlightRef.current = false;
      setIsSending(false);
    }
  }

  async function setPlanMode(enabled: boolean) {
    'background only';
    setSendError(null);
    try {
      const nextInteractionMode = enabled ? 'plan' : 'default';
      if (onSetInteractionMode) {
        await onSetInteractionMode(nextInteractionMode);
        return;
      }
      await dispatchSynaraCommand(
        buildComposerInteractionModeSetCommand({
          commandId: createComposerDispatchId('command'),
          createdAt: new Date().toISOString(),
          interactionMode: nextInteractionMode,
          threadId,
        })
      );
    } catch (error) {
      console.error('[slice] failed to update composer interaction mode', error);
      setSendError('Unable to update plan mode.');
    }
  }

  async function setRuntimeMode(nextRuntimeMode: 'full-access' | 'approval-required') {
    'background only';
    setSendError(null);
    try {
      await dispatchSynaraCommand(
        buildComposerRuntimeModeSetCommand({
          commandId: createComposerDispatchId('command'),
          createdAt: new Date().toISOString(),
          runtimeMode: nextRuntimeMode,
          threadId,
        })
      );
    } catch (error) {
      console.error('[slice] failed to update composer runtime mode', error);
      setSendError('Unable to update permissions.');
    }
  }

  const isRunning = isRunningComposerSession(sessionStatus);
  const isConnecting = isConnectingComposerSession(sessionStatus);
  const sendDisabled =
    isSending ||
    isConnecting ||
    (draft.trim().length === 0 && pastedTexts.length === 0 && files.length === 0) ||
    !activeModelSelection ||
    !runtimeMode ||
    !interactionMode;

  return (
    <ComposerInputSurfaceComposition focused={focused}>
      <ComposerEditorRegionComposition>
        {composerTrigger?.kind === 'slash-command' ? (
          <ComposerCommandMenuComposition
            items={slashCommandItems}
            resolvedTheme={resolvedTheme}
            isLoading={false}
            triggerKind="slash-command"
            activeItemId={slashCommandItems[0]?.id ?? null}
            onHighlightedItemChange={() => undefined}
            onSelect={(item) => {
              'background only';
              selectSlashCommand(item);
            }}
          />
        ) : composerTrigger?.kind === 'skill' ? (
          <ComposerCommandMenuComposition
            items={skillItems}
            resolvedTheme={resolvedTheme}
            isLoading={providerSkillsPending}
            triggerKind="skill"
            activeItemId={skillItems[0]?.id ?? null}
            onHighlightedItemChange={() => undefined}
            onSelect={(item) => {
              'background only';
              selectSkill(item);
            }}
          />
        ) : composerTrigger?.kind === 'mention' ? (
          <ComposerCommandMenuComposition
            items={threadMentionItems}
            resolvedTheme={resolvedTheme}
            isLoading={false}
            triggerKind="mention"
            activeItemId={threadMentionItems[0]?.id ?? null}
            onHighlightedItemChange={() => undefined}
            onSelect={(item) => {
              'background only';
              selectThreadMention(item);
            }}
          />
        ) : null}
        <ComposerReferenceAttachmentsComposition
          assistantSelections={assistantSelections}
          fileComments={[]}
          pastedTexts={pastedTexts}
          files={files}
          images={[]}
          nonPersistedImageIdSet={EMPTY_NON_PERSISTED_IMAGE_IDS}
          onExpandImage={() => undefined}
          onRemoveAssistantSelections={() =>
            removeAssistantSelections(brandedThreadId)
          }
          onRemoveFileComments={() => undefined}
          onRemovePastedText={(pastedTextId) => {
            'background only';
            removePastedTextFromDraft(pastedTextId);
          }}
          onShowPastedTextInField={(pastedTextId) => {
            'background only';
            showPastedTextInField(pastedTextId);
          }}
          onRemoveFile={removeNativeComposerFile}
          onRemoveImage={() => undefined}
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
        <view className="ComposerProjectedEditorFlow">
          {draftProjection.displayTokens.length > 0 ? (
            <ComposerProjectedVisualContent projection={draftProjection} />
          ) : null}
          <textarea
            ref={textareaRef}
            className={`ComposerTextarea${
              draftProjection.displayTokens.length > 0
                ? ' ComposerTextarea--projected'
                : ''
            }`}
            aria-label="Message composer"
            accessibility-element={true}
            accessibility-label="Message composer"
            focusable={true}
            default-value={draftProjection.displayText}
            placeholder={
              emptyLanding
                ? 'Ask for follow-up changes or attach images'
                : 'Ask anything, @mention a path, or use $skill'
            }
            maxlength={8000}
            maxlines={6}
            enable-scroll-bar={true}
            bindfocus={() => {
            'background only';
            setFocused(true);
          }}
            bindblur={() => {
            'background only';
            setFocused(false);
          }}
            bindselection={(event) => {
            'background only';
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
            'background only';
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
              useComposerDraftStore.getState().draftsByThreadId[brandedThreadId]
                ?.prompt ?? '';
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
            if (transition.kind === 'collapsed-paste') {
              addPastedText(
                brandedThreadId,
                createPastedTextDraft({
                  id: `lynx-paste-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  createdAt: new Date().toISOString(),
                  text: transition.pastedText,
                })
              );
              setNativeValue(
                transition.prompt,
                transition.selectionStart,
                transition.selectionEnd
              );
              setComposerTrigger(null);
              return;
            }
            setComposerTrigger(
              event.detail.isComposing
                ? null
                : detectComposerTrigger(
                    transition.prompt,
                    transition.selectionStart
                  )
            );
            }}
          />
        </view>
      </ComposerEditorRegionComposition>
      <ComposerFooterRowComposition>
        <ComposerFooterContentComposition
          leading={
            <>
              <ComposerExtrasMenuComposition
                interactionMode={interactionMode ?? 'default'}
                supportsFastMode={supportsFastMode}
                fastModeEnabled={
                  activeTraitSelection?.fastModeEnabled ?? false
                }
                imageAttachmentsAvailable={true}
                onPickAttachments={() => {
                  'background only';
                  void pickNativeComposerFiles();
                }}
                onAddPhotos={() => undefined}
                onToggleFastMode={toggleFastMode}
                onSetPlanMode={(enabled) => {
                  'background only';
                  void setPlanMode(enabled);
                }}
              />
              <ComposerRuntimeModeControlComposition
                runtimeMode={runtimeMode}
                onRuntimeModeChange={(nextRuntimeMode) => {
                  'background only';
                  void setRuntimeMode(nextRuntimeMode);
                }}
              />
              {sendError ? (
                <text className="ComposerSendError">{sendError}</text>
              ) : null}
            </>
          }
          actions={
            <>
              {activeModelSelection ? (
                <ComposerModelControl
                  modelSelection={activeModelSelection as never}
                  catalogProvider={discoveryProvider ?? activeModelSelection.provider}
                  runtimeModels={runtimeModelCatalog?.models ?? []}
                  modelsLoading={
                    runtimeModelsPending ||
                    (runtimeModelsFetching && !runtimeModelCatalog)
                  }
                  providers={serverConfig?.providers ?? []}
                  splitTraits={emptyLanding}
                  onCatalogProviderChange={(provider) => {
                    'background only';
                    setModelCatalogProvider(provider);
                  }}
                  onModelSelectionChange={(nextModelSelection) => {
                    'background only';
                    setModelSelection(brandedThreadId, nextModelSelection);
                    setModelCatalogProvider(null);
                  }}
                />
              ) : null}
              {emptyLanding ? (
                <view
                  className="ComposerVoiceButtonLynx"
                  aria-label="Record voice note (unavailable in Lynx for Web)"
                  aria-disabled="true"
                >
                  <svg
                    className="ComposerVoiceGlyphLynx"
                    content={colorizeLynxSvg(
                      microphoneSvg,
                      svgColors.mutedForeground
                    )}
                  />
                </view>
              ) : null}
              <ComposerPrimaryActionComposition
                mode={
                  isRunning
                    ? 'stop'
                    : isSending || isConnecting
                      ? 'sending'
                      : 'send'
                }
                accessibleLabel={isConnecting ? 'Connecting' : undefined}
                disabled={!isRunning && sendDisabled}
                onActivate={() => {
                  'background only';
                  void activatePrimaryAction();
                }}
              />
            </>
          }
        />
      </ComposerFooterRowComposition>
      <ComposerLifecycleStatus
        operation={
          sendError
            ? 'error'
            : isStopping
              ? 'stopping'
              : isSending
                ? 'sending'
                : 'idle'
        }
        sessionStatus={sessionStatus}
        errorMessage={sendError}
      />
    </ComposerInputSurfaceComposition>
  );
}
