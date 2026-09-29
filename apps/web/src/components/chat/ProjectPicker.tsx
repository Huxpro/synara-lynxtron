// FILE: ProjectPicker.tsx
// Purpose: Folder selector beneath the new-chat composer that groups active folders and home
//          folders while always creating chats as rows inside the shared Chats container.
// Layer: Chat / empty-state entrypoint

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { type ProjectDirectoryEntry, type ProjectId, type SpaceId } from "@synara/contracts";
import { readNativeApi } from "../../nativeApi";
import { useStore } from "../../store";
import { createSidebarDisplayThreadsSelector } from "../../storeSelectors";
import { getLocalFoldersGroupLabel } from "~/lib/localFoldersGroupLabel";
import { spaceDisplayName } from "~/lib/spaceGrouping";
import { useWorkspaceStore } from "../../workspaceStore";
import { useSpacesUiStore } from "../../spacesUiStore";

import { dialogs } from "~/platform/dialogs";
import { ComposerProjectPickerComposition } from "./ComposerProjectPickerComposition";
import { buildComposerProjectPickerModel } from "./ComposerProjectPicker.logic";
interface ProjectPickerProps {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  selectionMode?: "workspace-root" | "project";
  showResetToHome?: boolean;
  selectedProjectId?: ProjectId | null;
  selectedWorkspaceRoot?: string | null;
  onSelectProject?: ((projectId: ProjectId) => void | Promise<void>) | undefined;
  onSelectWorkspaceRoot?: ((workspaceRoot: string) => void) | undefined;
  onCreateProjectFromPath?: ((workspaceRoot: string) => void | Promise<void>) | undefined;
  onResetToHome?: (() => void | Promise<void>) | undefined;
  /** Class override for the trigger button (e.g. tighter height in the composer tray). */
  triggerClassName?: string;
  /** Copy overrides for folder-tagging contexts (e.g. Studio) where picking never creates a project. */
  emptyTriggerLabel?: string;
  addActionLabel?: string;
  resetActionLabel?: string;
  searchPlaceholder?: string;
}

interface ActiveFolderOption {
  projectId: ProjectId | null;
  spaceId: SpaceId | null;
  spaceName: string;
  cwd: string;
  primaryLabel: string;
  secondaryLabel: string | null;
}

function basenameOfPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/[\\/]+$/, "");
  const separatorIndex = Math.max(normalized.lastIndexOf("/"), normalized.lastIndexOf("\\"));
  const basename = separatorIndex === -1 ? normalized : normalized.slice(separatorIndex + 1);
  return basename.length > 0 ? basename : null;
}

function joinDirectoryPath(rootPath: string, relativePath: string): string {
  if (!relativePath) return rootPath;
  const separator = rootPath.includes("\\") ? "\\" : "/";
  const normalizedRoot = rootPath.endsWith(separator) ? rootPath.slice(0, -1) : rootPath;
  const normalizedRelative = relativePath.split(/[\\/]+/).join(separator);
  return `${normalizedRoot}${separator}${normalizedRelative}`;
}

function getNavigatorPlatform(): string {
  const navigatorLike = globalThis.navigator as
    | (Navigator & { userAgentData?: { platform?: string } })
    | undefined;
  return [navigatorLike?.platform, navigatorLike?.userAgentData?.platform]
    .filter(Boolean)
    .join(" ");
}

export const ProjectPicker = memo(function ProjectPicker({
  align = "start",
  side = "bottom",
  selectionMode = "workspace-root",
  showResetToHome = false,
  selectedProjectId = null,
  selectedWorkspaceRoot = null,
  onSelectProject,
  onSelectWorkspaceRoot,
  onCreateProjectFromPath,
  onResetToHome,
  triggerClassName,
  emptyTriggerLabel = "Work in a project",
  addActionLabel,
  resetActionLabel = "Don't work in a project",
  searchPlaceholder = "Search projects",
}: ProjectPickerProps) {
  const projects = useStore((state) => state.projects);
  const spaces = useStore((state) => state.spaces);
  const sidebarThreads = useStore(useMemo(() => createSidebarDisplayThreadsSelector(), []));
  const activeSpaceId = useSpacesUiStore((state) => state.activeSpaceId);
  const homeDir = useWorkspaceStore((state) => state.homeDir);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const [isLoadingDirectories, setIsLoadingDirectories] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [directoryErrorMessage, setDirectoryErrorMessage] = useState<string | null>(null);
  const [requestedDirectoryRoot, setRequestedDirectoryRoot] = useState<string | null>(null);
  const [directoryEntries, setDirectoryEntries] = useState<readonly ProjectDirectoryEntry[]>([]);
  const isProjectSelectionMode = selectionMode === "project";

  // Manual memoization kept: this file does not compile under React Compiler (see compile-report).
  const activeFolderOptions = useMemo(() => {
    const seen = new Set<string>();
    const nextOptions: ActiveFolderOption[] = [];
    const projectById = new Map(projects.map((project) => [project.id, project] as const));
    const getSpaceName = (spaceId: SpaceId | null) => spaceDisplayName(spaceId, spaces);

    for (const project of projects.filter((project) => project.kind === "project")) {
      const folderName = basenameOfPath(project.cwd) ?? project.folderName ?? project.name;
      if (!folderName || folderName.startsWith(".") || seen.has(project.cwd)) {
        continue;
      }
      seen.add(project.cwd);
      const primaryLabel = project.localName?.trim() || folderName;
      const secondaryLabel =
        project.localName?.trim() && project.localName.trim() !== folderName ? folderName : null;
      const spaceId = project.spaceId ?? null;
      nextOptions.push({
        projectId: project.id,
        spaceId,
        spaceName: getSpaceName(spaceId),
        cwd: project.cwd,
        primaryLabel,
        secondaryLabel,
      });
    }

    if (!isProjectSelectionMode) {
      for (const thread of sidebarThreads) {
        const workspaceRoot = thread.worktreePath ?? null;
        const folderName = basenameOfPath(workspaceRoot);
        if (
          !workspaceRoot ||
          !folderName ||
          folderName.startsWith(".") ||
          seen.has(workspaceRoot)
        ) {
          continue;
        }
        seen.add(workspaceRoot);
        const spaceId = projectById.get(thread.projectId)?.spaceId ?? null;
        nextOptions.push({
          projectId: null,
          spaceId,
          spaceName: getSpaceName(spaceId),
          cwd: workspaceRoot,
          primaryLabel: folderName,
          secondaryLabel: null,
        });
      }
    }

    const selectedFolderName = basenameOfPath(selectedWorkspaceRoot);
    if (
      !isProjectSelectionMode &&
      selectedWorkspaceRoot &&
      selectedFolderName &&
      !selectedFolderName.startsWith(".") &&
      !seen.has(selectedWorkspaceRoot)
    ) {
      nextOptions.unshift({
        projectId: null,
        spaceId: activeSpaceId,
        spaceName: getSpaceName(activeSpaceId),
        cwd: selectedWorkspaceRoot,
        primaryLabel: selectedFolderName,
        secondaryLabel: null,
      });
    }

    return nextOptions;
  }, [
    activeSpaceId,
    isProjectSelectionMode,
    projects,
    selectedWorkspaceRoot,
    sidebarThreads,
    spaces,
  ]);
  const activeFolderPathSet = useMemo(
    () => new Set(activeFolderOptions.map((entry) => entry.cwd)),
    [activeFolderOptions],
  );
  const localFolderOptions = useMemo(() => {
    if (isProjectSelectionMode) return [];
    return directoryEntries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => ({
        absolutePath: homeDir ? joinDirectoryPath(homeDir, entry.path) : entry.path,
        entry,
      }))
      .filter((entry) => !activeFolderPathSet.has(entry.absolutePath));
  }, [activeFolderPathSet, directoryEntries, homeDir, isProjectSelectionMode]);
  const localFoldersGroupLabel = useMemo(
    () => getLocalFoldersGroupLabel(homeDir, getNavigatorPlatform()),
    [homeDir],
  );

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setErrorMessage(null);
    }
  }, []);

  useEffect(() => {
    if (
      isProjectSelectionMode ||
      !open ||
      !homeDir ||
      requestedDirectoryRoot === homeDir ||
      isLoadingDirectories
    ) {
      return;
    }
    // Timeout-0 keeps every state write asynchronous (no wasted pre-paint
    // render), which also keeps this component eligible for React Compiler.
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      const api = readNativeApi();
      if (!api) {
        setRequestedDirectoryRoot(homeDir);
        setDirectoryErrorMessage("App is still connecting. Try again in a moment.");
        return;
      }

      setRequestedDirectoryRoot(homeDir);
      setIsLoadingDirectories(true);
      setDirectoryErrorMessage(null);
      void api.projects
        .listDirectories({ cwd: homeDir })
        .then((result) => {
          setDirectoryEntries(
            result.entries.flatMap((entry) =>
              entry.kind === "directory"
                ? [
                    {
                      path: entry.path,
                      name: entry.name,
                      hasChildren: entry.hasChildren ?? false,
                      ...(entry.parentPath ? { parentPath: entry.parentPath } : {}),
                    } satisfies ProjectDirectoryEntry,
                  ]
                : [],
            ),
          );
        })
        .catch((error) => {
          setDirectoryErrorMessage(
            error instanceof Error ? error.message : "Unable to load folders.",
          );
        })
        .finally(() => {
          setIsLoadingDirectories(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [homeDir, isLoadingDirectories, isProjectSelectionMode, open, requestedDirectoryRoot]);

  const handleSelectActiveFolder = useCallback(
    (folder: ActiveFolderOption) => {
      try {
        // Existing projects should switch the draft into that project; raw paths stay workspace roots.
        const selection =
          folder.projectId && onSelectProject
            ? onSelectProject(folder.projectId)
            : isProjectSelectionMode
              ? undefined
              : onSelectWorkspaceRoot?.(folder.cwd);
        void Promise.resolve(selection)
          .then(() => {
            setOpen(false);
          })
          .catch((error) => {
            setErrorMessage(error instanceof Error ? error.message : "Unable to select project.");
          });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to select project.");
      }
    },
    [isProjectSelectionMode, onSelectProject, onSelectWorkspaceRoot],
  );

  const handleAddNewProject = useCallback(async () => {
    if (isPicking) return;
    const api = readNativeApi();
    if (!api) {
      setErrorMessage("App is still connecting. Try again in a moment.");
      return;
    }

    setIsPicking(true);
    setErrorMessage(null);
    try {
      const pickedPath = await dialogs.pickFolder();
      if (!pickedPath) {
        setIsPicking(false);
        return;
      }
      if (onCreateProjectFromPath) {
        await onCreateProjectFromPath(pickedPath);
      } else {
        onSelectWorkspaceRoot?.(pickedPath);
      }
      setIsPicking(false);
      setOpen(false);
    } catch (error) {
      setIsPicking(false);
      setErrorMessage(error instanceof Error ? error.message : "Unable to open the folder picker.");
    }
  }, [isPicking, onCreateProjectFromPath, onSelectWorkspaceRoot]);

  const handleResetToHome = useCallback(() => {
    try {
      void Promise.resolve(onResetToHome?.())
        .then(() => {
          setOpen(false);
        })
        .catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : "Unable to update project.");
        });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update project.");
    }
  }, [onResetToHome]);

  const addProjectLabel =
    addActionLabel ?? (isProjectSelectionMode ? "New project" : "Add new project");
  const loadingAddProjectLabel = isProjectSelectionMode
    ? "Adding project..."
    : "Opening folder picker...";
  const projectPickerModel = useMemo(
    () =>
      buildComposerProjectPickerModel({
        projects: [
          ...activeFolderOptions.flatMap((folder) => [
            (() => {
              const space = spaces.find((candidate) => candidate.id === folder.spaceId);
              return {
                id: folder.projectId ? `project:${folder.projectId}` : `folder:${folder.cwd}`,
                kind: folder.projectId ? ("project" as const) : ("folder" as const),
                projectId: folder.projectId,
                workspaceRoot: folder.cwd,
                primaryLabel: folder.primaryLabel,
                secondaryLabel: folder.secondaryLabel,
                spaceId: folder.spaceId,
                spaceName: folder.spaceName,
                spaceIcon: space?.icon ?? null,
                ...(space?.sortOrder === undefined ? {} : { spaceSortOrder: space.sortOrder }),
              };
            })(),
          ]),
          ...localFolderOptions.map(({ absolutePath, entry }) => ({
            id: `folder:${absolutePath}`,
            kind: "folder" as const,
            projectId: null,
            workspaceRoot: absolutePath,
            primaryLabel: entry.name,
            secondaryLabel: null,
            spaceId: "__local__" as never,
            spaceName: localFoldersGroupLabel,
            spaceIcon: "home" as const,
            spaceSortOrder: Number.MAX_SAFE_INTEGER,
          })),
        ],
        query,
        selectedOptionId: isProjectSelectionMode
          ? selectedProjectId
            ? `project:${selectedProjectId}`
            : null
          : selectedWorkspaceRoot
            ? activeFolderOptions.some(
                (folder) => folder.projectId !== null && folder.cwd === selectedWorkspaceRoot,
              )
              ? `project:${
                  activeFolderOptions.find(
                    (folder) => folder.projectId !== null && folder.cwd === selectedWorkspaceRoot,
                  )?.projectId
                }`
              : `folder:${selectedWorkspaceRoot}`
            : null,
        emptyTriggerLabel,
      }),
    [
      activeFolderOptions,
      emptyTriggerLabel,
      isProjectSelectionMode,
      localFolderOptions,
      localFoldersGroupLabel,
      query,
      selectedProjectId,
      selectedWorkspaceRoot,
      spaces,
    ],
  );

  return (
    <ComposerProjectPickerComposition
      model={projectPickerModel}
      open={open}
      align={align}
      side={side}
      onOpenChange={handleOpenChange}
      onQueryChange={setQuery}
      onSelectOption={(option) => {
        if (option.kind === "project" && option.projectId) {
          const folder = activeFolderOptions.find(
            (candidate) => candidate.projectId === option.projectId,
          );
          if (folder) handleSelectActiveFolder(folder);
          return;
        }
        onSelectWorkspaceRoot?.(option.workspaceRoot);
        setOpen(false);
      }}
      addActionLabel={isPicking ? loadingAddProjectLabel : addProjectLabel}
      addActionBusy={isPicking}
      resetActionLabel={resetActionLabel}
      resetVisible={showResetToHome || isProjectSelectionMode}
      searchPlaceholder={searchPlaceholder}
      errorMessage={
        errorMessage ?? directoryErrorMessage ?? (isLoadingDirectories ? "Loading folders…" : null)
      }
      retryActionLabel={isLoadingDirectories ? "Retrying…" : "Retry"}
      retryActionBusy={isLoadingDirectories}
      {...(directoryErrorMessage
        ? {
            onRetry: () => {
              setDirectoryErrorMessage(null);
              setRequestedDirectoryRoot(null);
            },
          }
        : {})}
      onAddProject={() => void handleAddNewProject()}
      onReset={handleResetToHome}
      {...(triggerClassName === undefined ? {} : { triggerClassName })}
      triggerTestId={isProjectSelectionMode ? "project-picker-trigger" : "workspace-picker-trigger"}
    />
  );
});
