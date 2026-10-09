import { useCallback, useMemo, useRef, useState } from "@lynx-js/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ProjectId,
  PullRequestDetailInput,
  PullRequestActionInput,
  PullRequestInvolvement,
  PullRequestListEntry,
  PullRequestState,
} from "@synara/contracts";

import { KanbanColumnComposition } from "@synara-web/components/kanban/KanbanColumnComposition";
import { KanbanOverviewComposition } from "@synara-web/components/kanban/KanbanOverviewComposition";
import { KanbanRouteHeaderComposition } from "@synara-web/components/kanban/KanbanRouteHeaderComposition";
import {
  KanbanStateComposition,
  type KanbanStateKind,
} from "@synara-web/components/kanban/KanbanStateComposition";
import type { KanbanCard, KanbanColumnKey } from "@synara-web/components/kanban/kanban.logic";
import {
  KANBAN_DND_COPY,
  resolveKanbanCrossColumnDropPolicy,
  resolveKanbanDragColumn,
  type KanbanDragRect,
} from "@synara-web/components/kanban/kanbanDnd.logic";
import {
  PullRequestListComposition,
  PullRequestListEmptyComposition,
  PullRequestListLoadingComposition,
} from "@synara-web/components/pullRequest/PullRequestListComposition";
import {
  PullRequestRouteFiltersComposition,
  PullRequestRouteHeaderComposition,
} from "@synara-web/components/pullRequest/PullRequestRouteControlsComposition";
import { PullRequestSummaryComposition } from "@synara-web/components/pullRequest/PullRequestSummaryComposition";
import {
  PullRequestDetailCapabilityComposition,
  PullRequestDetailTabsComposition,
} from "@synara-web/components/pullRequest/PullRequestDetailTabsComposition";
import { PullRequestDetailCloseComposition } from "@synara-web/components/pullRequest/PullRequestDetailCloseComposition";
import {
  PULL_REQUEST_DIFF_INITIAL_LINE_COUNT,
  PULL_REQUEST_DIFF_MORE_LINE_COUNT,
  PullRequestCodeComposition,
  PullRequestCodeStateComposition,
} from "@synara-web/components/pullRequest/PullRequestCodeComposition";
import { buildPullRequestCodeView } from "@synara-web/components/pullRequest/pullRequestCode.logic";
import { PullRequestTimelineComposition } from "@synara-web/components/pullRequest/PullRequestTimelineComposition";
import { resolvePullRequestPrimaryAction } from "@synara-web/components/pullRequest/pullRequestDetail.logic";
import type { PullRequestDetailTab } from "@synara-web/components/pullRequest/PullRequestDetailTabsComposition";
import { pullRequestPinToggleInputs } from "@synara-web/components/pullRequest/pullRequestList.logic";
import {
  fetchPullRequestDetail,
  fetchPullRequestDiff,
  fetchPullRequests,
  performPullRequestAction,
  queryClient,
  setPullRequestPinned,
} from "./queries";
import { useSidebarSnapshot } from "./sidebarSnapshot.lynx";
import { Button } from "../components/ui/button";
import {
  projectLynxKanbanComposerDrafts,
  useComposerDraftStore,
} from "../adapters/composerDraftStore.lynx";
import {
  createNativeKanbanDragSession,
  moveNativeKanbanDragSession,
  readNativeKanbanPointer,
  shouldCancelNativeKanbanDragKey,
  type NativeKanbanDragSession,
  type NativeKanbanPointerEvent,
} from "./kanbanDnd.logic";

import {
  buildCanonicalSliceKanbanBoard,
  buildCanonicalSlicePullRequestList,
  createPullRequestActionGate,
  selectKanbanProjectBoard,
} from "./FeatureListsPage.logic";
import {
  resolveKanbanOverviewRouteState,
  resolveKanbanProjectRouteState,
} from "./kanbanRouteState.logic";
import { ResizableRightPanel } from "./ResizableRightPanel.lynx";
import { KanbanNewTaskDialog } from "./KanbanNewTaskDialog.lynx";
import { PullRequestsUnavailableState } from "../adapters/PullRequestsUnavailableState.lynx";
import { PullRequestDetailExternalButtonElement } from "../adapters/PullRequestDetailCloseCompositionElements.lynx";
import { PullRequestWarningBanner } from "../adapters/PullRequestWarningBanner.lynx";
import { useNativeKanbanCardActions } from "./useNativeKanbanCardActions.lynx";

export function ProjectsPage({ navigate }: { readonly navigate: (to: string) => void }) {
  const [newTaskProjectId, setNewTaskProjectId] = useState<ProjectId | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const lynxDraftsByThreadId = useComposerDraftStore((store) => store.draftsByThreadId);
  const composerDraftByThreadId = useMemo(
    () => projectLynxKanbanComposerDrafts(lynxDraftsByThreadId),
    [lynxDraftsByThreadId],
  );
  const { data, error, isPending, isFetching, refetch } = useSidebarSnapshot();
  const board = useMemo(
    () => buildCanonicalSliceKanbanBoard(data, composerDraftByThreadId),
    [composerDraftByThreadId, data],
  );
  const projects = useMemo(
    () =>
      board.projects.flatMap((projectBoard) => {
        const project = data?.projects.find((candidate) => candidate.id === projectBoard.projectId);
        return project ? [project] : [];
      }),
    [board.projects, data?.projects],
  );
  const routeState = resolveKanbanOverviewRouteState({
    hasSnapshot: data !== undefined,
    isPending,
    error,
  });
  const cardActions = useNativeKanbanCardActions({
    projectWorkspaceRoot: (projectId) =>
      data?.projects.find((candidate) => candidate.id === projectId)?.workspaceRoot ?? null,
  });
  return (
    <view className="FeaturePage FeaturePage--overview">
      <KanbanRouteHeaderComposition
        title="Kanban"
        taskCount={board.totalCount}
        navigationAvailable={false}
        backAvailable={false}
        onBack={() => {}}
        newTaskDisabled={projects.length === 0}
        newTaskShortcutParts={[]}
        onNewTask={() => {
          setNewTaskProjectId(null);
          setNewTaskOpen(true);
        }}
      />
      {cardActions.actionPanels}
      {routeState.kind === "loading" ? (
        <KanbanStateComposition kind="loading-overview" />
      ) : routeState.kind === "offline" || routeState.kind === "error" ? (
        <KanbanStateComposition
          kind={routeState.kind}
          retrying={isFetching}
          onRetry={() => void refetch()}
        />
      ) : (
        <view className="FeatureOverviewBody">
          {routeState.refreshIssue ? (
            <KanbanStateComposition
              kind={`stale-${routeState.refreshIssue}` as KanbanStateKind}
              retrying={isFetching}
              onRetry={() => void refetch()}
            />
          ) : null}
          <KanbanOverviewComposition
            board={board}
            onOpenProject={(projectId) => navigate(`/kanban/${projectId}`)}
            onOpenCard={(card) => navigate(`/thread/${card.threadId}`)}
            onCardContextMenu={cardActions.openCardContextMenu}
            onNewTask={(projectId) => {
              setNewTaskProjectId(projectId);
              setNewTaskOpen(true);
            }}
          />
        </view>
      )}
      {newTaskOpen ? (
        <KanbanNewTaskDialog
          initialProjectId={newTaskProjectId}
          projects={projects}
          onOpenChange={setNewTaskOpen}
          onTaskCreated={() => void refetch()}
        />
      ) : null}
    </view>
  );
}

const KANBAN_COLUMNS: readonly KanbanColumnKey[] = ["draft", "inProgress", "done"];

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
  event: KanbanColumnLayoutEvent,
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

export function KanbanProjectPage({
  navigate,
  projectId,
}: {
  readonly navigate: (to: string) => void;
  readonly projectId: string;
}) {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const lynxDraftsByThreadId = useComposerDraftStore((store) => store.draftsByThreadId);
  const composerDraftByThreadId = useMemo(
    () => projectLynxKanbanComposerDrafts(lynxDraftsByThreadId),
    [lynxDraftsByThreadId],
  );
  const kanbanColumnRectsRef = useRef<Partial<Record<KanbanColumnKey, KanbanDragRect>>>({});
  const nativeDragRef = useRef<NativeKanbanDragSession | null>(null);
  const [nativeDrag, setNativeDrag] = useState<NativeKanbanDragSession | null>(null);
  const { data, error, isPending, isFetching, refetch } = useSidebarSnapshot();
  const projectBoard = useMemo(
    () =>
      selectKanbanProjectBoard(
        buildCanonicalSliceKanbanBoard(data, composerDraftByThreadId),
        projectId,
      ),
    [composerDraftByThreadId, data, projectId],
  );
  const project = data?.projects.find((candidate) => candidate.id === projectId);
  const cardActions = useNativeKanbanCardActions({
    projectWorkspaceRoot: () => project?.workspaceRoot ?? null,
  });
  const routeState = resolveKanbanProjectRouteState({
    hasSnapshot: data !== undefined,
    projectFound: projectBoard !== null,
    isPending,
    error,
  });

  const setNativeDragSession = useCallback((session: NativeKanbanDragSession | null) => {
    nativeDragRef.current = session;
    setNativeDrag(session);
  }, []);

  const cancelNativeKanbanDrag = useCallback(
    (notice?: string) => {
      "background only";
      setNativeDragSession(null);
      if (notice) cardActions.showNotice(notice);
    },
    [cardActions.showNotice, setNativeDragSession],
  );

  const startNativeKanbanDrag = useCallback(
    (card: KanbanCard, point: { readonly x: number; readonly y: number }) => {
      "background only";
      if (nativeDragRef.current || cardActions.mutationPending) return;
      setNativeDragSession(createNativeKanbanDragSession(card, point, Date.now()));
    },
    [cardActions.mutationPending, setNativeDragSession],
  );

  const moveNativeKanbanDrag = useCallback(
    (event: NativeKanbanPointerEvent) => {
      "background only";
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
      if (result.kind === "ended-missed-mouseup") {
        cancelNativeKanbanDrag(KANBAN_DND_COPY.missedMouseUp);
      } else if (result.kind === "moved") {
        setNativeDragSession(result.session);
      }
    },
    [cancelNativeKanbanDrag, setNativeDragSession],
  );

  const endNativeKanbanDrag = useCallback(
    (event: NativeKanbanPointerEvent) => {
      "background only";
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
      if (policy.kind === "dispatch") {
        void cardActions.startCard(current.card, current.card.draftPrompt);
        return;
      }
      if (policy.kind === "prompt-required") {
        void cardActions.selectAction(current.card, "start");
        return;
      }
      if (policy.kind === "invalid") cancelNativeKanbanDrag(policy.label);
    },
    [
      cancelNativeKanbanDrag,
      cardActions.selectAction,
      cardActions.startCard,
      navigate,
      setNativeDragSession,
    ],
  );

  const nativeDragTargetColumn = nativeDrag?.activated
    ? resolveKanbanDragColumn(
        nativeDrag.currentPoint,
        KANBAN_COLUMNS.flatMap((column) => {
          const rect = kanbanColumnRectsRef.current[column];
          return rect ? [rect] : [];
        }),
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
        title={projectBoard?.projectName ?? "Kanban"}
        taskCount={projectBoard?.totalCount ?? 0}
        navigationAvailable={false}
        backAvailable
        onBack={() => navigate("/kanban")}
        newTaskDisabled={!project}
        newTaskShortcutParts={[]}
        onNewTask={() => setNewTaskOpen(true)}
      />
      {cardActions.actionPanels}
      {routeState.kind === "loading" ? (
        <KanbanStateComposition kind="loading-project" />
      ) : routeState.kind === "offline" ||
        routeState.kind === "error" ||
        routeState.kind === "not-found" ? (
        <KanbanStateComposition
          kind={routeState.kind}
          retrying={isFetching}
          onRetry={routeState.kind === "not-found" ? undefined : () => void refetch()}
        />
      ) : (
        <scroll-view className="KanbanScroller" scroll-orientation="horizontal">
          {routeState.refreshIssue ? (
            <KanbanStateComposition
              kind={`stale-${routeState.refreshIssue}` as KanbanStateKind}
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
                columnPolicy?.kind === "dispatch" || columnPolicy?.kind === "prompt-required";
              const columnIsInvalid = columnPolicy?.kind === "invalid";
              const columnIsHovered = nativeDragTargetColumn === column;
              return (
                <view
                  className={`KanbanColumnHost${
                    columnIsValid ? " KanbanColumnHost--drag-valid" : ""
                  }${columnIsInvalid ? " KanbanColumnHost--drag-invalid" : ""}${
                    columnIsHovered ? " KanbanColumnHost--drag-hover" : ""
                  }`}
                  key={column}
                  bindlayoutchange={(event: KanbanColumnLayoutEvent) => {
                    "background only";
                    const rect = kanbanDragRectFromLayout(column, event);
                    if (rect) kanbanColumnRectsRef.current[column] = rect;
                  }}
                >
                  <KanbanColumnComposition
                    columnKey={column}
                    cards={projectBoard?.[column] ?? []}
                    onNewCard={column === "draft" ? () => setNewTaskOpen(true) : undefined}
                    onOpenCard={(card) => navigate(`/thread/${card.threadId}`)}
                    onCardContextMenu={cardActions.openCardContextMenu}
                    onCardDragPointerStart={startNativeKanbanDrag}
                    dragSourceCardId={nativeDrag?.activated ? nativeDrag.card.cardId : null}
                    showDispatchTarget={columnIsValid}
                    dispatchTargetLabel={columnPolicy?.label}
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
            "background only";
            if (shouldCancelNativeKanbanDragKey(keyEvent.key)) {
              cancelNativeKanbanDrag(KANBAN_DND_COPY.cancelled);
            }
          }}
        >
          {nativeDrag.activated ? (
            <view
              className={`KanbanDragGhost KanbanDragGhost--${nativeDrag.policy?.kind ?? "invalid"}`}
              style={{
                left: `${nativeDrag.currentPoint.x + 12}px`,
                top: `${nativeDrag.currentPoint.y + 12}px`,
              }}
            >
              <text className="KanbanDragGhostTitle" text-maxline="1">
                {nativeDrag.card.title}
              </text>
              <text className="KanbanDragGhostStatus" text-maxline="2">
                {nativeDrag.policy?.label ?? KANBAN_DND_COPY.dragging}
              </text>
            </view>
          ) : null}
        </view>
      ) : null}
      {newTaskOpen && project ? (
        <KanbanNewTaskDialog
          initialProjectId={project.id as ProjectId}
          initialSendAsDraft
          projects={[project]}
          onOpenChange={setNewTaskOpen}
          onTaskCreated={() => void refetch()}
        />
      ) : null}
    </view>
  );
}

export function PullRequestsPage() {
  const [involvement, setInvolvement] = useState<PullRequestInvolvement>("all");
  const [state, setState] = useState<PullRequestState>("open");
  const [projectId, setProjectId] = useState<ProjectId | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInput, setSelectedInput] = useState<PullRequestDetailInput | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<PullRequestDetailTab>("summary");
  const [expandedDiffFileKeys, setExpandedDiffFileKeys] = useState<string[]>([]);
  const [visibleDiffLineCounts, setVisibleDiffLineCounts] = useState<Record<string, number>>({});
  const [rawVisibleLineCount, setRawVisibleLineCount] = useState(
    PULL_REQUEST_DIFF_INITIAL_LINE_COUNT,
  );
  const [routeBodyWidth, setRouteBodyWidth] = useState(0);
  const [lastFailedAction, setLastFailedAction] = useState<PullRequestActionInput | null>(null);
  const actionGateRef = useRef(createPullRequestActionGate());
  const { data: sidebarData } = useSidebarSnapshot();
  const { data, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ["pull-requests", state, projectId ?? null],
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
    isFetching: selectedDetailFetching,
    isPending: selectedDetailPending,
    refetch: refetchSelectedDetail,
  } = useQuery({
    queryKey: [
      "pull-request-detail",
      selectedInput?.projectId ?? null,
      selectedInput?.repository ?? null,
      selectedInput?.number ?? null,
    ],
    queryFn: () => {
      if (!selectedInput) {
        throw new Error("Pull request detail identity is unavailable.");
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
      "pull-request-diff",
      selectedInput?.projectId ?? null,
      selectedInput?.repository ?? null,
      selectedInput?.number ?? null,
    ],
    queryFn: () => {
      if (!selectedInput) {
        throw new Error("Pull request diff identity is unavailable.");
      }
      return fetchPullRequestDiff(selectedInput);
    },
    enabled: selectedInput !== null && activeDetailTab === "code",
    retry: false,
  });
  const pinMutation = useMutation({
    mutationFn: async (entry: PullRequestListEntry) => {
      const inputs = pullRequestPinToggleInputs(entry, projectId === undefined);
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
    [data, involvement, searchQuery],
  );
  const truncatedRepositoryCount =
    data?.repositoryBatches.filter((batch) => batch.truncated).length ?? 0;
  const codeView = useMemo(
    () =>
      buildPullRequestCodeView(
        selectedDiff?.patch,
        selectedInput
          ? `pull-request:${selectedInput.projectId}:${selectedInput.number}`
          : "pull-request:inactive",
      ),
    [selectedDiff?.patch, selectedInput],
  );
  const projects = useMemo(
    () =>
      (sidebarData?.projects ?? [])
        .filter((project) => project.kind === "project")
        .map((project) => [project.id as ProjectId, project.title] as const)
        .sort((left, right) => left[1].localeCompare(right[1])),
    [sidebarData],
  );
  const scopedProjectName = projectId
    ? projects.find(([candidateId]) => candidateId === projectId)?.[1]
    : undefined;
  const primaryAction = selectedDetail
    ? resolvePullRequestPrimaryAction(selectedDetail.state, selectedDetail.isDraft)
    : null;
  const reviewingNonOpen = involvement === "reviewing" && state !== "open";
  const pinErrorMessage =
    pinMutation.error instanceof Error ? pinMutation.error.message : "The pin could not be saved.";
  const resetDetailUi = () => {
    setActiveDetailTab("summary");
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
    setLastFailedAction(null);
    setSelectedInput({
      projectId: entry.projectId,
      repository: entry.repository,
      number: entry.number,
    });
    resetDetailUi();
  };
  const runPullRequestAction = (input: PullRequestActionInput) => {
    "background only";
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
        className={`SharedPrRouteBody${selectedInput ? " SharedPrRouteBody--detail-open" : ""}`}
        bindlayoutchange={(event: { readonly detail?: { readonly width?: number } }) => {
          const width = event.detail?.width;
          if (typeof width === "number" && width > 0) setRouteBodyWidth(width);
        }}
      >
        <scroll-view className="SharedPrRouteScroller" scroll-orientation="vertical">
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
              <view className="SharedPrMutationRecovery">
                <text className="SharedPrMutationError">
                  Could not update pull request pin. {pinErrorMessage}
                </text>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pinMutation.isPending || !pinMutation.variables}
                  onClick={() => {
                    if (pinMutation.variables) {
                      pinMutation.mutate(pinMutation.variables);
                    }
                  }}
                >
                  {pinMutation.isPending ? "Retrying…" : "Retry"}
                </Button>
              </view>
            ) : null}
            {isPending ? (
              <PullRequestListLoadingComposition />
            ) : error && data === undefined ? (
              <PullRequestsUnavailableState
                error={error}
                retrying={isFetching}
                onRetry={() => void refetch()}
              />
            ) : list.entries.length === 0 ? (
              <PullRequestListEmptyComposition
                title={
                  reviewingNonOpen
                    ? "Review requests only apply to open pull requests"
                    : "No pull requests found"
                }
                description={
                  reviewingNonOpen
                    ? "Select Open to see pull requests currently awaiting your review."
                    : "Try another involvement, state, project, or search filter."
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
            {data && truncatedRepositoryCount > 0 ? (
              <text className="SharedPrListFootnote">
                Showing the first 50 matching pull requests for {truncatedRepositoryCount}{" "}
                {truncatedRepositoryCount === 1 ? "repository" : "repositories"}.
              </text>
            ) : null}
            {data?.errors.length ? (
              <PullRequestWarningBanner shape="callout">
                {data.errors.length} project{" "}
                {data.errors.length === 1 ? "repository was" : "repositories were"} unavailable.
                Healthy repositories are still shown.
              </PullRequestWarningBanner>
            ) : null}
            {error && data ? (
              <PullRequestWarningBanner shape="callout">
                The latest background refresh failed. Showing the last available pull requests.
              </PullRequestWarningBanner>
            ) : null}
          </view>
        </scroll-view>
        {selectedInput ? (
          <ResizableRightPanel
            availableWidth={routeBodyWidth}
            className="SharedPrDetailDock"
            defaultWidth={routeBodyWidth > 0 ? Math.round(routeBodyWidth / 2) : 512}
            minimumMainWidth={320}
            minWidth={416}
            resizable
          >
            <view className="SharedPrDetailDockHeader">
              <PullRequestDetailTabsComposition
                activeTab={activeDetailTab}
                availableTabs={["summary", "timeline", "code"]}
                onSelectTab={setActiveDetailTab}
              />
              <view className="SharedPrDetailDockActions">
                {selectedDetail && primaryAction ? (
                  <Button
                    size="sm"
                    className="SharedPrHeaderPrimaryAction"
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
                    {actionMutation.isPending ? primaryAction.pendingLabel : primaryAction.label}
                  </Button>
                ) : null}
                {selectedDetail ? (
                  <PullRequestDetailExternalButtonElement url={selectedDetail.url} />
                ) : null}
                <PullRequestDetailCloseComposition onClose={closeDetail} />
              </view>
            </view>
            <PullRequestDetailCapabilityComposition
              availableTabs={["summary", "timeline", "code"]}
            />
            {selectedDetailError && selectedDetail ? (
              <PullRequestWarningBanner>
                Could not refresh pull request details. Showing saved data.
              </PullRequestWarningBanner>
            ) : null}
            {lastFailedAction ? (
              <view className="SharedPrActionRecovery">
                <text className="SharedPrActionError">
                  Pull request action failed. The current state was kept.
                </text>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionMutation.isPending}
                  onClick={() => runPullRequestAction(lastFailedAction)}
                >
                  Retry
                </Button>
              </view>
            ) : null}
            <scroll-view className="SharedPrDetailDockScroller" scroll-orientation="vertical">
              {activeDetailTab === "code" ? (
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
                          : [...current, fileKey],
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
                        (current) => current + PULL_REQUEST_DIFF_MORE_LINE_COUNT,
                      )
                    }
                  />
                )
              ) : selectedDetailPending ? (
                <view className="SharedPrDetailLoading">
                  <PullRequestListLoadingComposition
                    rowCount={4}
                    label="Loading pull request details…"
                  />
                </view>
              ) : selectedDetailError && !selectedDetail ? (
                <PullRequestsUnavailableState
                  error={selectedDetailError}
                  retrying={selectedDetailFetching}
                  onRetry={() => void refetchSelectedDetail()}
                />
              ) : selectedDetail ? (
                activeDetailTab === "timeline" ? (
                  <PullRequestTimelineComposition detail={selectedDetail} />
                ) : (
                  <PullRequestSummaryComposition detail={selectedDetail} commentingAvailable />
                )
              ) : null}
            </scroll-view>
          </ResizableRightPanel>
        ) : null}
      </view>
    </view>
  );
}
