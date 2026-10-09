import { useCallback, useMemo, useRef, useState } from "@lynx-js/react";
import type { ProjectId } from "@synara/contracts";

import {
  KanbanOverviewFilterRow,
  KanbanOverviewHeaderContext,
} from "../adapters/KanbanRouteHeaderCompositionElements.lynx";
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
import { useSidebarSnapshot } from "./sidebarSnapshot.lynx";
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

import { buildCanonicalSliceKanbanBoard, selectKanbanProjectBoard } from "./FeatureListsPage.logic";
import {
  resolveKanbanOverviewRouteState,
  resolveKanbanProjectRouteState,
} from "./kanbanRouteState.logic";
import { KanbanNewTaskDialog } from "./KanbanNewTaskDialog.lynx";
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
      <KanbanOverviewHeaderContext.Provider value={true}>
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
      </KanbanOverviewHeaderContext.Provider>
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
          <KanbanOverviewFilterRow />
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
