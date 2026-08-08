import { useCallback, useEffect, useMemo, useRef, useState } from '@lynx-js/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  ProjectId,
  PullRequestDetailInput,
  PullRequestActionInput,
  PullRequestInvolvement,
  PullRequestListEntry,
  PullRequestState,
} from '@synara/contracts';

import { KanbanColumnComposition } from '@synara-web/components/kanban/KanbanColumnComposition';
import { KanbanOverviewComposition } from '@synara-web/components/kanban/KanbanOverviewComposition';
import { KanbanRouteHeaderComposition } from '@synara-web/components/kanban/KanbanRouteHeaderComposition';
import {
  KanbanStateComposition,
  type KanbanStateKind,
} from '@synara-web/components/kanban/KanbanStateComposition';
import type {
  KanbanCard,
  KanbanColumnKey,
} from '@synara-web/components/kanban/kanban.logic';
import {
  KANBAN_DND_COPY,
  resolveKanbanCrossColumnDropPolicy,
  resolveKanbanDragColumn,
  type KanbanDragRect,
} from '@synara-web/components/kanban/kanbanDnd.logic';
import {
  KANBAN_MUTATION_COPY,
  createKanbanMutationGate,
  resolveKanbanMutationActions,
  type KanbanMutationActionId,
} from '@synara-web/components/kanban/kanbanMutation.logic';
import {
  PullRequestListComposition,
  PullRequestListEmptyComposition,
  PullRequestListLoadingComposition,
} from '@synara-web/components/pullRequest/PullRequestListComposition';
import {
  PullRequestRouteFiltersComposition,
  PullRequestRouteHeaderComposition,
} from '@synara-web/components/pullRequest/PullRequestRouteControlsComposition';
import { PullRequestSummaryComposition } from '@synara-web/components/pullRequest/PullRequestSummaryComposition';
import {
  PullRequestDetailCapabilityComposition,
  PullRequestDetailTabsComposition,
} from '@synara-web/components/pullRequest/PullRequestDetailTabsComposition';
import { PullRequestDetailCloseComposition } from '@synara-web/components/pullRequest/PullRequestDetailCloseComposition';
import {
  PULL_REQUEST_DIFF_INITIAL_LINE_COUNT,
  PULL_REQUEST_DIFF_MORE_LINE_COUNT,
  PullRequestCodeComposition,
  PullRequestCodeStateComposition,
} from '@synara-web/components/pullRequest/PullRequestCodeComposition';
import { buildPullRequestCodeView } from '@synara-web/components/pullRequest/pullRequestCode.logic';
import { PullRequestTimelineComposition } from '@synara-web/components/pullRequest/PullRequestTimelineComposition';
import { resolvePullRequestPrimaryAction } from '@synara-web/components/pullRequest/pullRequestDetail.logic';
import type { PullRequestDetailTab } from '@synara-web/components/pullRequest/PullRequestDetailTabsComposition';
import { pullRequestPinToggleInputs } from '@synara-web/components/pullRequest/pullRequestList.logic';
import {
  fetchPullRequestDetail,
  fetchPullRequestDiff,
  fetchPullRequests,
  fetchSidebarSnapshot,
  fetchThreadHeaderSummary,
  performPullRequestAction,
  queryClient,
  setPullRequestPinned,
} from './queries';
import { Button } from '../components/ui/button';
import {
  buildNativeKanbanArchiveCommand,
  buildNativeKanbanRenameCommand,
  buildNativeKanbanStartCommand,
  resolveNativeKanbanMutationError,
} from './kanbanMutation.logic';
import {
  createNativeKanbanDragSession,
  moveNativeKanbanDragSession,
  readNativeKanbanPointer,
  shouldCancelNativeKanbanDragKey,
  type NativeKanbanDragSession,
  type NativeKanbanPointerEvent,
} from './kanbanDnd.logic';

import {
  buildCanonicalSliceKanbanBoard,
  buildCanonicalSlicePullRequestList,
  createPullRequestActionGate,
  selectKanbanProjectBoard,
} from './FeatureListsPage.logic';
import {
  resolveKanbanOverviewRouteState,
  resolveKanbanProjectRouteState,
} from './kanbanRouteState.logic';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';

export function ProjectsPage({ navigate }: { readonly navigate: (to: string) => void }) {
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: fetchSidebarSnapshot,
    refetchInterval: 5_000,
  });
  const board = useMemo(() => buildCanonicalSliceKanbanBoard(data), [data]);
  const routeState = resolveKanbanOverviewRouteState({
    hasSnapshot: data !== undefined,
    isPending,
    error,
  });
  return (
    <view className="FeaturePage FeaturePage--overview">
      <KanbanRouteHeaderComposition
        title="Kanban"
        taskCount={board.totalCount}
        navigationAvailable={false}
        backAvailable={false}
        newTaskDisabled
        newTaskShortcutParts={[]}
        onNewTask={() => {}}
      />
      {routeState.kind === 'loading' ? (
        <KanbanStateComposition kind="loading-overview" />
      ) : routeState.kind === 'offline' || routeState.kind === 'error' ? (
        <KanbanStateComposition
          kind={routeState.kind}
          retrying={isFetching}
          onRetry={() => void refetch()}
        />
      ) : (
        <view className="FeatureOverviewBody">
          {routeState.refreshIssue ? (
            <KanbanStateComposition
              kind={
                `stale-${routeState.refreshIssue}` as KanbanStateKind
              }
              retrying={isFetching}
              onRetry={() => void refetch()}
            />
          ) : null}
          <KanbanOverviewComposition
            board={board}
            onOpenProject={(projectId) =>
              navigate(`/kanban/${projectId}`)
            }
            onOpenCard={(card) => navigate(`/thread/${card.threadId}`)}
          />
        </view>
      )}
    </view>
  );
}

const KANBAN_COLUMNS: readonly KanbanColumnKey[] = [
  'draft',
  'inProgress',
  'done',
];

interface KanbanMutationTarget {
  readonly action: KanbanMutationActionId;
  readonly card: KanbanCard;
  readonly value: string;
  readonly error: string | null;
}

interface KanbanColumnLayoutEvent {
  readonly detail?: {
    readonly bottom?: number;
    readonly height?: number;
    readonly left?: number;
    readonly right?: number;
    readonly top?: number;
    readonly width?: number;
  };
  readonly params?: {
    readonly bottom?: number;
    readonly height?: number;
    readonly left?: number;
    readonly right?: number;
    readonly top?: number;
    readonly width?: number;
  };
}

function kanbanDragRectFromLayout(
  column: KanbanColumnKey,
  event: KanbanColumnLayoutEvent
): KanbanDragRect | null {
  const rect = event.detail ?? event.params;
  if (!rect) return null;
  const left = rect.left;
  const top = rect.top;
  const right = rect.right ?? (left ?? 0) + (rect.width ?? 0);
  const bottom = rect.bottom ?? (top ?? 0) + (rect.height ?? 0);
  if (
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    !Number.isFinite(right) ||
    !Number.isFinite(bottom) ||
    right <= left! ||
    bottom <= top!
  ) {
    return null;
  }
  return { column, left: left!, top: top!, right, bottom };
}

function newKanbanCommandId(kind: string): string {
  return `lynx-kanban-${kind}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

export function KanbanProjectPage({
  navigate,
  projectId,
}: {
  readonly navigate: (to: string) => void;
  readonly projectId: string;
}) {
  const [mutationTarget, setMutationTarget] =
    useState<KanbanMutationTarget | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationNotice, setMutationNotice] = useState<string | null>(null);
  const [mutationChooserCard, setMutationChooserCard] =
    useState<KanbanCard | null>(null);
  const mutationGateRef = useRef(createKanbanMutationGate());
  const mutationTextareaRef = useRef<React.ElementRef<'textarea'>>(null);
  const kanbanColumnRectsRef = useRef<Partial<Record<KanbanColumnKey, KanbanDragRect>>>({});
  const nativeDragRef = useRef<NativeKanbanDragSession | null>(null);
  const [nativeDrag, setNativeDrag] = useState<NativeKanbanDragSession | null>(null);
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: fetchSidebarSnapshot,
    refetchInterval: 2_000,
  });
  const projectBoard = useMemo(
    () =>
      selectKanbanProjectBoard(
        buildCanonicalSliceKanbanBoard(data),
        projectId
      ),
    [data, projectId]
  );
  const routeState = resolveKanbanProjectRouteState({
    hasSnapshot: data !== undefined,
    projectFound: projectBoard !== null,
    isPending,
    error,
  });

  const executeKanbanMutation = async (target: KanbanMutationTarget) => {
    'background only';
    const { card, action } = target;
    if (!mutationGateRef.current.tryAcquire(card.threadId)) return;
    setMutationPending(true);
    setMutationTarget({ ...target, error: null });
    try {
      const { dispatchSynaraCommand } = await import(
        /* webpackMode: "eager" */ '../data/synaraClient'
      );
      let command;
      if (action === 'start') {
        const text = target.value.trim();
        if (text.length === 0) {
          throw new Error('Write a prompt before starting this task.');
        }
        const summary = await fetchThreadHeaderSummary(card.threadId);
        if (!summary) throw new Error('This task is no longer available.');
        const createdAt = new Date().toISOString();
        command = buildNativeKanbanStartCommand({
          commandId: newKanbanCommandId('start'),
          createdAt,
          interactionMode: summary.interactionMode,
          messageId: newKanbanCommandId('message'),
          modelSelection: summary.modelSelection,
          runtimeMode: summary.runtimeMode,
          text,
          threadId: card.threadId,
        });
      } else if (action === 'rename') {
        const title = target.value.trim();
        if (title.length === 0) throw new Error('Task name cannot be empty.');
        command = buildNativeKanbanRenameCommand({
          commandId: newKanbanCommandId('rename'),
          threadId: card.threadId,
          title,
        });
      } else {
        command = buildNativeKanbanArchiveCommand({
          commandId: newKanbanCommandId('archive'),
          threadId: card.threadId,
        });
      }
      await dispatchSynaraCommand(command);
      await queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] });
      setMutationNotice(KANBAN_MUTATION_COPY[action].success);
      setMutationTarget(null);
    } catch (mutationError) {
      setMutationTarget({
        ...target,
        error: resolveNativeKanbanMutationError(mutationError),
      });
    } finally {
      mutationGateRef.current.release(card.threadId);
      setMutationPending(false);
    }
  };

  const selectKanbanMutationAction = async (
    card: KanbanCard,
    action: KanbanMutationActionId
  ) => {
    'background only';
    setMutationChooserCard(null);
    setMutationNotice(null);
    if (action === 'archive') {
      const { dialogs } = await import(
        /* webpackMode: "eager" */ '../platform/dialogs'
      );
      const confirmed = await dialogs.confirm(
        [
          `Archive task "${card.title}"?`,
          'Archived tasks leave this board and can be restored later.',
        ].join('\n')
      );
      if (!confirmed) return;
      const target = { action, card, value: '', error: null } as const;
      setMutationTarget(target);
      await executeKanbanMutation(target);
      return;
    }
    setMutationTarget({
      action,
      card,
      value: action === 'rename' ? card.title : '',
      error: null,
    });
  };

  const openKanbanCardMenu = async (card: KanbanCard, event: React.MouseEvent) => {
    'background only';
    event.preventDefault();
    event.stopPropagation();
    await (async () => {
      const actions = resolveKanbanMutationActions(card, {
        canSupplyStartPrompt: true,
      });
      if (actions.length === 0) return;
      const { showContextMenu } = await import(
        /* webpackMode: "eager" */ '../platform/contextMenu'
      );
      const action = await showContextMenu(
        actions.map((candidate, index) => ({
          id: candidate.id,
          label: candidate.label,
          ...(candidate.destructive ? { destructive: true } : {}),
          ...(index > 0 ? { separatorBefore: true } : {}),
        })),
        { x: event.clientX, y: event.clientY }
      );
      if (!action) return;
      await selectKanbanMutationAction(card, action);
    })();
  };

  const mutationCopy = mutationTarget
    ? KANBAN_MUTATION_COPY[mutationTarget.action]
    : null;

  useEffect(() => {
    'background only';
    if (
      !mutationTarget ||
      (mutationTarget.action !== 'start' && mutationTarget.action !== 'rename')
    ) {
      return;
    }
    const value = mutationTarget.value;
    mutationTextareaRef.current
      ?.invoke({ method: 'setValue', params: { value } })
      .exec();
    mutationTextareaRef.current
      ?.invoke({
        method: 'setSelectionRange',
        params: { selectionStart: value.length, selectionEnd: value.length },
      })
      .exec();
  }, [mutationTarget?.action, mutationTarget?.card.threadId]);

  const setNativeDragSession = useCallback((session: NativeKanbanDragSession | null) => {
    nativeDragRef.current = session;
    setNativeDrag(session);
  }, []);

  const cancelNativeKanbanDrag = useCallback((notice?: string) => {
    'background only';
    setNativeDragSession(null);
    if (notice) setMutationNotice(notice);
  }, [setNativeDragSession]);

  const startNativeKanbanDrag = useCallback((
    card: KanbanCard,
    point: { readonly x: number; readonly y: number }
  ) => {
    'background only';
    if (nativeDragRef.current || mutationPending) return;
    setMutationTarget(null);
    setMutationChooserCard(null);
    setMutationNotice(null);
    setNativeDragSession(createNativeKanbanDragSession(card, point, Date.now()));
  }, [mutationPending, setNativeDragSession]);

  const moveNativeKanbanDrag = useCallback((event: NativeKanbanPointerEvent) => {
    'background only';
    const current = nativeDragRef.current;
    if (!current) return;
    const point = readNativeKanbanPointer(event);
    const rects = KANBAN_COLUMNS.flatMap((column) => {
      const rect = kanbanColumnRectsRef.current[column];
      return rect ? [rect] : [];
    });
    const targetColumn = point ? resolveKanbanDragColumn(point, rects) : null;
    const policy = resolveKanbanCrossColumnDropPolicy(current.card, targetColumn, {
      canSupplyStartPrompt: true,
    });
    const result = moveNativeKanbanDragSession({
      event,
      now: Date.now(),
      policy,
      session: current,
    });
    if (result.kind === 'ended-missed-mouseup') {
      cancelNativeKanbanDrag(KANBAN_DND_COPY.missedMouseUp);
    } else if (result.kind === 'moved') {
      setNativeDragSession(result.session);
    }
  }, [cancelNativeKanbanDrag, setNativeDragSession]);

  const endNativeKanbanDrag = useCallback((event: NativeKanbanPointerEvent) => {
    'background only';
    const current = nativeDragRef.current;
    if (!current) return;
    const finalPoint = readNativeKanbanPointer(event) ?? current.currentPoint;
    const rects = KANBAN_COLUMNS.flatMap((column) => {
      const rect = kanbanColumnRectsRef.current[column];
      return rect ? [rect] : [];
    });
    const targetColumn = resolveKanbanDragColumn(finalPoint, rects);
    const policy = resolveKanbanCrossColumnDropPolicy(current.card, targetColumn, {
      canSupplyStartPrompt: true,
    });
    setNativeDragSession(null);
    if (!current.activated) {
      navigate(`/thread/${current.card.threadId}`);
      return;
    }
    if (policy.kind === 'dispatch') {
      const target = {
        action: 'start',
        card: current.card,
        value: current.card.draftPrompt,
        error: null,
      } as const;
      setMutationTarget(target);
      void executeKanbanMutation(target);
      return;
    }
    if (policy.kind === 'prompt-required') {
      void selectKanbanMutationAction(current.card, 'start');
      return;
    }
    if (policy.kind === 'invalid') setMutationNotice(policy.label);
  }, [navigate, setNativeDragSession]);

  const nativeDragTargetColumn = nativeDrag?.activated
    ? resolveKanbanDragColumn(
        nativeDrag.currentPoint,
        KANBAN_COLUMNS.flatMap((column) => {
          const rect = kanbanColumnRectsRef.current[column];
          return rect ? [rect] : [];
        })
      )
    : null;

  return (
    <view
      className="FeaturePage FeaturePage--fixed"
      bindmousemove={moveNativeKanbanDrag}
      bindmouseup={endNativeKanbanDrag}
      bindtouchmove={moveNativeKanbanDrag}
      bindtouchend={endNativeKanbanDrag}
      bindtouchcancel={() => cancelNativeKanbanDrag(KANBAN_DND_COPY.cancelled)}
    >
      <KanbanRouteHeaderComposition
        title={projectBoard?.projectName ?? 'Kanban'}
        taskCount={projectBoard?.totalCount ?? 0}
        navigationAvailable={false}
        backAvailable
        onBack={() => navigate('/kanban')}
        newTaskDisabled
        newTaskShortcutParts={[]}
        onNewTask={() => {}}
      />
      {mutationNotice ? (
        <view
          className="KanbanMutationNotice"
          accessibility-element
          accessibility-label={mutationNotice}
        >
          <text className="KanbanMutationNoticeText">{mutationNotice}</text>
        </view>
      ) : null}
      {mutationChooserCard ? (
        <view
          className="KanbanMutationPanel"
          accessibility-element
          accessibility-label={`Actions for ${mutationChooserCard.title}`}
        >
          <view className="KanbanMutationPanelHeader">
            <text className="KanbanMutationPanelTitle">Task actions</text>
            <text className="KanbanMutationPanelTask" maxlines={1}>
              {mutationChooserCard.title}
            </text>
          </view>
          <view className="KanbanMutationActions KanbanMutationActions--chooser">
            {resolveKanbanMutationActions(mutationChooserCard, {
              canSupplyStartPrompt: true,
            }).map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant={action.destructive ? 'destructive-outline' : 'outline'}
                onClick={() =>
                  void selectKanbanMutationAction(mutationChooserCard, action.id)
                }
              >
                {action.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMutationChooserCard(null)}
            >
              Cancel
            </Button>
          </view>
        </view>
      ) : null}
      {mutationTarget ? (
        <view
          className="KanbanMutationPanel"
          accessibility-element
          accessibility-label={`${mutationTarget.action} ${mutationTarget.card.title}`}
        >
          <view className="KanbanMutationPanelHeader">
            <text className="KanbanMutationPanelTitle">
              {mutationTarget.action === 'start'
                ? 'Start task'
                : mutationTarget.action === 'rename'
                  ? 'Rename task'
                  : mutationPending
                    ? mutationCopy?.pending
                    : mutationCopy?.error}
            </text>
            <text className="KanbanMutationPanelTask" maxlines={1}>
              {mutationTarget.card.title}
            </text>
          </view>
          {mutationTarget.action === 'start' || mutationTarget.action === 'rename' ? (
            <textarea
              ref={mutationTextareaRef}
              key={`${mutationTarget.action}:${mutationTarget.card.threadId}`}
              className={`KanbanMutationTextarea${
                mutationTarget.error ? ' KanbanMutationTextarea--invalid' : ''
              }`}
              default-value={mutationTarget.value}
              readonly={mutationPending}
              placeholder={
                mutationTarget.action === 'start'
                  ? 'What should the agent do?'
                  : 'Task name'
              }
              maxlength={8000}
              maxlines={4}
              bindinput={(inputEvent) => {
                'background only';
                setMutationTarget((current) =>
                  current
                    ? { ...current, value: inputEvent.detail.value, error: null }
                    : current
                );
              }}
            />
          ) : null}
          {mutationTarget.error ? (
            <text className="KanbanMutationError">{mutationTarget.error}</text>
          ) : null}
          <view className="KanbanMutationActions">
            <Button
              size="sm"
              variant="ghost"
              disabled={mutationPending}
              onClick={() => setMutationTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={
                mutationPending ||
                ((mutationTarget.action === 'start' ||
                  mutationTarget.action === 'rename') &&
                  mutationTarget.value.trim().length === 0)
              }
              onClick={() => void executeKanbanMutation(mutationTarget)}
            >
              {mutationPending
                ? mutationCopy?.pending
                : mutationTarget.error
                  ? KANBAN_MUTATION_COPY.retry
                  : mutationTarget.action === 'start'
                    ? 'Start'
                    : mutationTarget.action === 'rename'
                      ? 'Save'
                      : KANBAN_MUTATION_COPY.retry}
            </Button>
          </view>
        </view>
      ) : null}
      {routeState.kind === 'loading' ? (
        <KanbanStateComposition kind="loading-project" />
      ) : routeState.kind === 'offline' ||
        routeState.kind === 'error' ||
        routeState.kind === 'not-found' ? (
        <KanbanStateComposition
          kind={routeState.kind}
          retrying={isFetching}
          onRetry={
            routeState.kind === 'not-found'
              ? undefined
              : () => void refetch()
          }
        />
      ) : (
        <scroll-view
          className="KanbanScroller"
          scroll-orientation="horizontal"
        >
          {routeState.refreshIssue ? (
            <KanbanStateComposition
              kind={
                `stale-${routeState.refreshIssue}` as KanbanStateKind
              }
              retrying={isFetching}
              onRetry={() => void refetch()}
            />
          ) : null}
          <view className="KanbanColumns">
            {KANBAN_COLUMNS.map((column) => {
              const columnPolicy = nativeDrag?.activated
                ? resolveKanbanCrossColumnDropPolicy(nativeDrag.card, column, {
                    canSupplyStartPrompt: true,
                  })
                : null;
              const columnIsValid =
                columnPolicy?.kind === 'dispatch' ||
                columnPolicy?.kind === 'prompt-required';
              const columnIsInvalid =
                columnPolicy?.kind === 'invalid';
              const columnIsHovered = nativeDragTargetColumn === column;
              return (
              <view
                className={`KanbanColumnHost${
                  columnIsValid ? ' KanbanColumnHost--drag-valid' : ''
                }${columnIsInvalid ? ' KanbanColumnHost--drag-invalid' : ''}${
                  columnIsHovered ? ' KanbanColumnHost--drag-hover' : ''
                }`}
                key={column}
                bindlayoutchange={(event: KanbanColumnLayoutEvent) => {
                  'background only';
                  const rect = kanbanDragRectFromLayout(column, event);
                  if (rect) kanbanColumnRectsRef.current[column] = rect;
                }}
              >
                <KanbanColumnComposition
                  columnKey={column}
                  cards={projectBoard?.[column] ?? []}
                  onOpenCard={(card) => navigate(`/thread/${card.threadId}`)}
                  onCardContextMenu={openKanbanCardMenu}
                  onCardDragPointerStart={startNativeKanbanDrag}
                  dragSourceCardId={
                    nativeDrag?.activated ? nativeDrag.card.cardId : null
                  }
                  showDispatchTarget={columnIsValid}
                  dispatchTargetLabel={columnPolicy?.label}
                  onCardActions={(card) => {
                    setMutationTarget(null);
                    setMutationNotice(null);
                    setMutationChooserCard(card);
                  }}
                />
              </view>
              );
            })}
          </view>
        </scroll-view>
      )}
      {nativeDrag ? (
        <view
          className="KanbanDragOverlay"
          bindmousemove={moveNativeKanbanDrag}
          bindmouseup={endNativeKanbanDrag}
          bindtouchmove={moveNativeKanbanDrag}
          bindtouchend={endNativeKanbanDrag}
          bindtouchcancel={() => cancelNativeKanbanDrag(KANBAN_DND_COPY.cancelled)}
          global-bindkeydown={(keyEvent: { readonly key: string }) => {
            'background only';
            if (shouldCancelNativeKanbanDragKey(keyEvent.key)) {
              cancelNativeKanbanDrag(KANBAN_DND_COPY.cancelled);
            }
          }}
        >
          {nativeDrag.activated ? (
            <view
              className={`KanbanDragGhost KanbanDragGhost--${
                nativeDrag.policy?.kind ?? 'invalid'
              }`}
              style={{
                left: `${nativeDrag.currentPoint.x + 12}px`,
                top: `${nativeDrag.currentPoint.y + 12}px`,
              }}
            >
              <text className="KanbanDragGhostTitle" maxlines={1}>
                {nativeDrag.card.title}
              </text>
              <text className="KanbanDragGhostStatus" maxlines={2}>
                {nativeDrag.policy?.label ?? KANBAN_DND_COPY.dragging}
              </text>
            </view>
          ) : null}
        </view>
      ) : null}
    </view>
  );
}

export function PullRequestsPage() {
  const [involvement, setInvolvement] =
    useState<PullRequestInvolvement>('all');
  const [state, setState] = useState<PullRequestState>('open');
  const [projectId, setProjectId] = useState<ProjectId | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInput, setSelectedInput] =
    useState<PullRequestDetailInput | null>(null);
  const [activeDetailTab, setActiveDetailTab] =
    useState<PullRequestDetailTab>('summary');
  const [expandedDiffFileKeys, setExpandedDiffFileKeys] = useState<string[]>([]);
  const [visibleDiffLineCounts, setVisibleDiffLineCounts] = useState<
    Record<string, number>
  >({});
  const [rawVisibleLineCount, setRawVisibleLineCount] = useState(
    PULL_REQUEST_DIFF_INITIAL_LINE_COUNT
  );
  const [routeBodyWidth, setRouteBodyWidth] = useState(0);
  const [lastFailedAction, setLastFailedAction] =
    useState<PullRequestActionInput | null>(null);
  const actionGateRef = useRef(createPullRequestActionGate());
  const { data: sidebarData } = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: fetchSidebarSnapshot,
    refetchInterval: 60_000,
  });
  const { data, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ['pull-requests', state, projectId ?? null],
    queryFn: () =>
      fetchPullRequests({
        state,
        projectId: projectId ?? null,
      }),
    refetchInterval: 60_000,
    retry: false,
  });
  const {
    data: selectedDetail,
    error: selectedDetailError,
    isPending: selectedDetailPending,
    refetch: refetchSelectedDetail,
  } = useQuery({
    queryKey: [
      'pull-request-detail',
      selectedInput?.projectId ?? null,
      selectedInput?.repository ?? null,
      selectedInput?.number ?? null,
    ],
    queryFn: () => {
      if (!selectedInput) {
        throw new Error('Pull request detail identity is unavailable.');
      }
      return fetchPullRequestDetail(selectedInput);
    },
    enabled: selectedInput !== null,
    retry: false,
  });
  const {
    data: selectedDiff,
    error: selectedDiffError,
    isPending: selectedDiffPending,
    isFetching: selectedDiffFetching,
    refetch: refetchSelectedDiff,
  } = useQuery({
    queryKey: [
      'pull-request-diff',
      selectedInput?.projectId ?? null,
      selectedInput?.repository ?? null,
      selectedInput?.number ?? null,
    ],
    queryFn: () => {
      if (!selectedInput) {
        throw new Error('Pull request diff identity is unavailable.');
      }
      return fetchPullRequestDiff(selectedInput);
    },
    enabled: selectedInput !== null && activeDetailTab === 'code',
    retry: false,
  });
  const pinMutation = useMutation({
    mutationFn: async (entry: PullRequestListEntry) => {
      const inputs = pullRequestPinToggleInputs(
        entry,
        projectId === undefined
      );
      for (const input of inputs) {
        await setPullRequestPinned(input);
      }
    },
    onSuccess: () => {
      void refetch();
    },
  });
  const actionMutation = useMutation({
    mutationFn: performPullRequestAction,
    onSuccess: () => {
      setLastFailedAction(null);
      void refetchSelectedDetail();
      void refetch();
    },
    onError: (_error, input) => {
      setLastFailedAction(input);
    },
  });
  const list = useMemo(
    () => buildCanonicalSlicePullRequestList(data, involvement, searchQuery),
    [data, involvement, searchQuery]
  );
  const codeView = useMemo(
    () =>
      buildPullRequestCodeView(
        selectedDiff?.patch,
        selectedInput
          ? `pull-request:${selectedInput.projectId}:${selectedInput.number}`
          : 'pull-request:inactive'
      ),
    [selectedDiff?.patch, selectedInput]
  );
  const projects = useMemo(
    () =>
      (sidebarData?.projects ?? [])
        .filter((project) => project.kind === 'project')
        .map(
          (project) =>
            [project.id as ProjectId, project.title] as const
        )
        .sort((left, right) => left[1].localeCompare(right[1])),
    [sidebarData]
  );
  const scopedProjectName = projectId
    ? projects.find(([candidateId]) => candidateId === projectId)?.[1]
    : undefined;
  const primaryAction = selectedDetail
    ? resolvePullRequestPrimaryAction(
        selectedDetail.state,
        selectedDetail.isDraft
      )
    : null;
  const reviewingNonOpen = involvement === 'reviewing' && state !== 'open';
  const resetDetailUi = () => {
    setActiveDetailTab('summary');
    setExpandedDiffFileKeys([]);
    setVisibleDiffLineCounts({});
    setRawVisibleLineCount(PULL_REQUEST_DIFF_INITIAL_LINE_COUNT);
  };
  const closeDetail = () => {
    setSelectedInput(null);
    setLastFailedAction(null);
    resetDetailUi();
  };
  const selectPullRequest = (entry: PullRequestListEntry) => {
    setSelectedInput({
      projectId: entry.projectId,
      repository: entry.repository,
      number: entry.number,
    });
    resetDetailUi();
  };
  const runPullRequestAction = (input: PullRequestActionInput) => {
    'background only';
    if (!actionGateRef.current.tryAcquire()) return;
    setLastFailedAction(null);
    void actionMutation
      .mutateAsync(input)
      .catch(() => {
        // onError owns the retained-input recovery state.
      })
      .finally(() => {
        actionGateRef.current.release();
      });
  };
  return (
    <view className="FeaturePage SharedPrRoutePage">
      <PullRequestRouteHeaderComposition
        scopedProjectName={scopedProjectName}
        refreshDisabled={isFetching}
        refreshing={isFetching}
        onRefresh={() => void refetch()}
      />
      <view
        className={`SharedPrRouteBody${
          selectedInput ? ' SharedPrRouteBody--detail-open' : ''
        }`}
        bindlayoutchange={(event: {
          readonly detail?: { readonly width?: number };
        }) => {
          const width = event.detail?.width;
          if (typeof width === 'number' && width > 0) setRouteBodyWidth(width);
        }}
      >
        <scroll-view
          className="SharedPrRouteScroller"
          scroll-orientation="vertical"
        >
          <view className="FeaturePageInner FeaturePageInner--pullRequests">
            <PullRequestRouteFiltersComposition
              involvement={involvement}
              state={state}
              projectId={projectId}
              projects={projects}
              searchQuery={searchQuery}
              searchCapability="editable"
              onSearchChange={(value) => {
                closeDetail();
                setSearchQuery(value);
              }}
              onInvolvementChange={(nextInvolvement) => {
                closeDetail();
                setInvolvement(nextInvolvement);
              }}
              onStateChange={(nextState) => {
                closeDetail();
                setState(nextState);
              }}
              onProjectChange={(nextProjectId) => {
                closeDetail();
                setProjectId(nextProjectId);
              }}
            />
            {pinMutation.isError ? (
              <text className="SharedPrMutationError">
                Pin update failed. Refresh and try again.
              </text>
            ) : null}
            {isPending ? (
              <PullRequestListLoadingComposition />
            ) : error && data === undefined ? (
              <PullRequestListEmptyComposition
                title="Pull requests unavailable"
                description="Check your connection and try again."
                intent="alert"
              />
            ) : list.entries.length === 0 ? (
              <PullRequestListEmptyComposition
                title={
                  reviewingNonOpen
                    ? 'Review requests only apply to open pull requests'
                    : 'No pull requests found'
                }
                description={
                  reviewingNonOpen
                    ? 'Select Open to see pull requests currently awaiting your review.'
                    : 'Try another involvement, state, project, or search filter.'
                }
              />
            ) : (
              <PullRequestListComposition
                entries={list.entries}
                grouped={list.grouped}
                selectedProjectId={selectedInput?.projectId}
                selectedRepo={selectedInput?.repository}
                selectedNumber={selectedInput?.number}
                showProjectTitle={projectId === undefined}
                onSelect={selectPullRequest}
                onTogglePinned={(entry) => {
                  if (!pinMutation.isPending) {
                    pinMutation.mutate(entry);
                  }
                }}
              />
            )}
          </view>
        </scroll-view>
        {selectedInput ? (
          <ResizableRightPanel
            availableWidth={routeBodyWidth}
            className="SharedPrDetailDock"
            defaultWidth={
              routeBodyWidth > 0 ? Math.round(routeBodyWidth / 2) : 512
            }
            minimumMainWidth={320}
            minWidth={416}
            resizable
          >
            <view className="SharedPrDetailDockHeader">
              <PullRequestDetailTabsComposition
                activeTab={activeDetailTab}
                availableTabs={['summary', 'timeline', 'code']}
                onSelectTab={setActiveDetailTab}
              />
              <PullRequestDetailCloseComposition
                onClose={closeDetail}
              />
            </view>
            <PullRequestDetailCapabilityComposition
              availableTabs={['summary', 'timeline', 'code']}
            />
            {selectedDetail && primaryAction ? (
              <view className="SharedPrActionBar">
                <Button
                  disabled={actionMutation.isPending}
                  onClick={() =>
                    runPullRequestAction({
                      projectId: selectedDetail.projectId,
                      repository: selectedDetail.repository,
                      number: selectedDetail.number,
                      action: primaryAction.action,
                    })
                  }
                >
                  {actionMutation.isPending
                    ? primaryAction.pendingLabel
                    : primaryAction.label}
                </Button>
                {lastFailedAction ? (
                  <view className="SharedPrActionRecovery">
                    <text className="SharedPrActionError">
                      Pull request action failed. The current state was kept.
                    </text>
                    <Button
                      variant="outline"
                      disabled={actionMutation.isPending}
                      onClick={() => runPullRequestAction(lastFailedAction)}
                    >
                      Retry
                    </Button>
                  </view>
                ) : null}
              </view>
            ) : null}
            <scroll-view
              className="SharedPrDetailDockScroller"
              scroll-orientation="vertical"
            >
              {activeDetailTab === 'code' ? (
                selectedDiffPending ? (
                  <PullRequestCodeStateComposition kind="loading" />
                ) : selectedDiffError ? (
                  <PullRequestCodeStateComposition
                    kind="error"
                    retrying={selectedDiffFetching}
                    onRetry={() => void refetchSelectedDiff()}
                  />
                ) : (
                  <PullRequestCodeComposition
                    view={codeView}
                    truncated={selectedDiff?.truncated ?? false}
                    expandedFileKeys={expandedDiffFileKeys}
                    visibleLineCounts={visibleDiffLineCounts}
                    rawVisibleLineCount={rawVisibleLineCount}
                    onToggleFile={(fileKey) =>
                      setExpandedDiffFileKeys((current) =>
                        current.includes(fileKey)
                          ? current.filter((key) => key !== fileKey)
                          : [...current, fileKey]
                      )
                    }
                    onShowMoreFile={(fileKey) =>
                      setVisibleDiffLineCounts((current) => ({
                        ...current,
                        [fileKey]:
                          (current[fileKey] ?? PULL_REQUEST_DIFF_INITIAL_LINE_COUNT) +
                          PULL_REQUEST_DIFF_MORE_LINE_COUNT,
                      }))
                    }
                    onShowMoreRaw={() =>
                      setRawVisibleLineCount(
                        (current) => current + PULL_REQUEST_DIFF_MORE_LINE_COUNT
                      )
                    }
                  />
                )
              ) : selectedDetailPending ? (
                <PullRequestListLoadingComposition
                  rowCount={4}
                  label="Loading pull request details…"
                />
              ) : selectedDetailError ? (
                <PullRequestListEmptyComposition
                  title="Pull request unavailable"
                  description="The detail could not be loaded. Close the panel and try again."
                  intent="alert"
                />
              ) : selectedDetail ? (
                activeDetailTab === 'timeline' ? (
                  <PullRequestTimelineComposition detail={selectedDetail} />
                ) : (
                  <PullRequestSummaryComposition
                    detail={selectedDetail}
                    commentingAvailable={false}
                  />
                )
              ) : null}
            </scroll-view>
          </ResizableRightPanel>
        ) : null}
      </view>
    </view>
  );
}
