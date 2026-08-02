// FILE: KanbanView.tsx
// Purpose: Kanban control-center page shell — header chrome plus the nested
//          overview (all projects) / single-project board navigation.
// Layer: Kanban route surface
// Exports: KanbanView (default)

import type { ProjectId } from "@synara/contracts";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { RouteInsetSurface } from "../RouteInsetSurface";
import {
  useDesktopTopBarTrafficLightGutterClassName,
  useDesktopTopBarWindowControlsGutterClassName,
} from "~/hooks/useDesktopTopBarGutter";
import { useNowMs } from "~/hooks/useNowMs";
import { splitShortcutLabel } from "~/keybindings";
import { cn, isMacPlatform } from "~/lib/utils";

const NEW_TASK_SHORTCUT_LABEL = isMacPlatform(getNavigatorPlatform()) ? "⌥⌘T" : "Ctrl+Alt+T";
const NEW_TASK_SHORTCUT_PARTS = splitShortcutLabel(NEW_TASK_SHORTCUT_LABEL);

function isNewTaskShortcut(event: KeyboardEvent): boolean {
  if (event.code !== "KeyT" || event.repeat || event.shiftKey || !event.altKey) {
    return false;
  }
  return isMacPlatform(getNavigatorPlatform())
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
}
import { useStore } from "../../store";
import { CHAT_BACKGROUND_CLASS_NAME } from "../chat/composerPickerStyles";
import { KanbanNewTaskDialog } from "./KanbanNewTaskDialog";
import { KanbanOverview } from "./KanbanOverview";
import { KanbanProjectBoardView } from "./KanbanProjectBoardView";
import { KanbanRouteHeaderComposition } from "./KanbanRouteHeaderComposition";
import { useKanbanBoard } from "./useKanbanBoard";
import { useKanbanCardContextMenu } from "./useKanbanCardContextMenu";
import type { KanbanCard } from "./kanban.logic";

import { getNavigatorPlatform } from "~/platform/env";
import { addWindowEventListener, removeWindowEventListener } from "~/platform/events";
export default function KanbanView({ projectId }: { projectId: string | null }) {
  const navigate = useNavigate();
  const board = useKanbanBoard();
  const threadsHydrated = useStore((state) => state.threadsHydrated);
  const desktopTopBarTrafficLightGutterClassName = useDesktopTopBarTrafficLightGutterClassName();
  const desktopTopBarWindowControlsGutterClassName =
    useDesktopTopBarWindowControlsGutterClassName();

  const projectBoard =
    projectId === null
      ? null
      : (board.projects.find((candidate) => candidate.projectId === projectId) ?? null);
  const hasActiveCardWork = board.projects.some((project) =>
    project.inProgress.some((card) => card.activeWorkStartedAt !== null),
  );
  const nowMs = useNowMs(hasActiveCardWork);

  const [newTaskDialog, setNewTaskDialog] = useState<{
    key: number;
    projectId: ProjectId | null;
    sendAsDraft: boolean;
  } | null>(null);
  const handleNewTask = (
    targetProjectId: ProjectId | null,
    options?: { sendAsDraft?: boolean },
  ) => {
    setNewTaskDialog({
      key: Date.now(),
      projectId: targetProjectId,
      sendAsDraft: options?.sendAsDraft ?? false,
    });
  };
  const projectBoardId = projectBoard?.projectId ?? null;
  const handleNewTaskInProjectBoard = () => {
    handleNewTask(projectBoardId);
  };
  // The Draft column's "+" implies "add a card here" — seed the dialog's
  // "Send as draft" toggle so the task parks in Draft instead of dispatching.
  const handleNewDraftInProjectBoard = () => {
    handleNewTask(projectBoardId, { sendAsDraft: true });
  };
  const newTaskProjectOptions = board.projects.map((project) => ({
    id: project.projectId,
    name: project.projectName,
  }));

  // Kanban-scoped ⌥⌘T: open the New task dialog targeting the current board (or
  // unscoped on the overview). A ref mirrors the open state so a repeat press
  // doesn't remount an already-open dialog and wipe a half-typed prompt — and so
  // the listener stays registered once instead of re-binding on every open/close.
  const isNewTaskDialogOpenRef = useRef(false);
  useEffect(() => {
    isNewTaskDialogOpenRef.current = newTaskDialog !== null;
  }, [newTaskDialog]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isNewTaskShortcut(event) || isNewTaskDialogOpenRef.current) {
        return;
      }
      if (newTaskProjectOptions.length === 0) {
        return;
      }
      event.preventDefault();
      handleNewTask(projectBoardId);
    }
    addWindowEventListener("keydown", onKeyDown);
    return () => {
      removeWindowEventListener("keydown", onKeyDown);
    };
  }, [handleNewTask, newTaskProjectOptions.length, projectBoardId]);

  useEffect(() => {
    // Unknown/stale project id (deleted project, old link): fall back to the overview
    // instead of a blank board — but only once hydration can tell stale from loading.
    if (projectId !== null && projectBoard === null && threadsHydrated) {
      void navigate({ to: "/kanban", replace: true });
    }
  }, [navigate, projectBoard, projectId, threadsHydrated]);

  const handleOpenCard = (card: KanbanCard) => {
    void navigate({ to: "/$threadId", params: { threadId: card.threadId } });
  };

  const { onCardContextMenu, renameDialog } = useKanbanCardContextMenu(handleOpenCard);

  const handleOpenProject = (targetProjectId: ProjectId) => {
    void navigate({ to: "/kanban/$projectId", params: { projectId: targetProjectId } });
  };

  const handleBackToOverview = () => {
    void navigate({ to: "/kanban" });
  };

  return (
    <RouteInsetSurface>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          CHAT_BACKGROUND_CLASS_NAME,
        )}
      >
        <KanbanRouteHeaderComposition
          title={projectBoard ? projectBoard.projectName : "Kanban"}
          taskCount={projectBoard ? projectBoard.totalCount : board.totalCount}
          backAvailable={projectBoard !== null}
          onBack={handleBackToOverview}
          newTaskDisabled={newTaskProjectOptions.length === 0}
          newTaskShortcutParts={NEW_TASK_SHORTCUT_PARTS}
          onNewTask={handleNewTaskInProjectBoard}
          hostClassName={cn(
            desktopTopBarTrafficLightGutterClassName,
            desktopTopBarWindowControlsGutterClassName,
          )}
        />

        <div className="min-h-0 min-w-0 flex-1 pt-3">
          {projectBoard ? (
            <KanbanProjectBoardView
              board={projectBoard}
              onOpenCard={handleOpenCard}
              onCardContextMenu={onCardContextMenu}
              onNewTask={handleNewDraftInProjectBoard}
              nowMs={nowMs}
            />
          ) : (
            <KanbanOverview
              board={board}
              onOpenProject={handleOpenProject}
              onOpenCard={handleOpenCard}
              onCardContextMenu={onCardContextMenu}
              onNewTask={handleNewTask}
              nowMs={nowMs}
            />
          )}
        </div>
      </div>

      {newTaskDialog ? (
        <KanbanNewTaskDialog
          key={newTaskDialog.key}
          onOpenChange={(open) => {
            if (!open) {
              setNewTaskDialog(null);
            }
          }}
          projectOptions={newTaskProjectOptions}
          initialProjectId={newTaskDialog.projectId}
          initialSendAsDraft={newTaskDialog.sendAsDraft}
        />
      ) : null}
      {renameDialog}
    </RouteInsetSurface>
  );
}
