import { useEffect, useMemo, useRef, useState } from "@lynx-js/react";
import { serverQueryKeys } from "@synara-web/lib/serverReactQuery";
import { useQuery } from "@tanstack/react-query";
import {
  CommandId,
  ProjectId,
  ThreadId,
  type ModelSelection,
  type ProviderKind,
  type RuntimeMode,
} from "@synara/contracts";
import { PanelStateMessage } from "@synara-web/components/chat/PanelStateMessage";
import { ComposerProjectPickerComposition } from "@synara-web/components/chat/ComposerProjectPickerComposition";
import { buildComposerProjectPickerModel } from "@synara-web/components/chat/ComposerProjectPicker.logic";
import { useStore } from "@synara-web/store";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
} from "@synara-web/appSettingsStorageProjection.logic";

import { queryClient } from "../../app/queries";
import { projectShellSnapshot } from "../../app/sessionShell.lynx";
import { EmptyThreadContextTray } from "../../app/EmptyThreadContextTray.lynx";
import { useComposerDraftStore } from "../../adapters/composerDraftStore.lynx";
import { ensureNativeApi } from "~/nativeApi";
import { dialogs } from "../../platform/dialogs";
import { webStorage } from "../../platform/storage";
import { Button } from "../ui/button";
import { Composer } from "./Composer.lynx";
import {
  ensureLandingThreadCreated,
  type LandingThreadCreationState,
} from "./landingThreadCreation.logic";
import { landingDraftId } from "./landingDraftIdentity.logic";
import { resolveLandingWorkspaceContext } from "./landingStudioFolder.logic";

import "./landing-composer.css";
import { defaultModelSelectionForProvider } from "../../lib/defaultModelSelection";

function landingId(kind: "command"): CommandId;
function landingId(kind: "project"): ProjectId;
function landingId(kind: "thread"): ThreadId;
function landingId(kind: "command" | "project" | "thread"): CommandId | ProjectId | ThreadId {
  "background only";
  const id = `lynx-landing-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  if (kind === "command") return CommandId.makeUnsafe(id);
  return kind === "project" ? ProjectId.makeUnsafe(id) : ThreadId.makeUnsafe(id);
}

function projectWorkspaceLabel(workspaceRoot: string): string {
  const normalized = workspaceRoot.replace(/[\\/]+$/, "");
  const segments = normalized.split(/[\\/]+/);
  return segments.at(-1) || workspaceRoot;
}

function landingBootstrapQueryKey(
  initialModelProvider: ProviderKind,
  containerKind: "chat" | "studio",
) {
  return ["landing-composer-bootstrap", initialModelProvider, containerKind] as const;
}

export async function loadLandingBootstrap(
  initialModelProvider: ProviderKind | null = null,
  containerKind: "chat" | "studio" = "chat",
) {
  "background only";
  const [snapshot, config, serverSettings] = await Promise.all([
    ensureNativeApi().orchestration.getShellSnapshot(),
    ensureNativeApi().server.getConfig(),
    ensureNativeApi()
      .server.getSettings()
      .catch(() => null),
  ]);
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
    serverSettings?.defaultThreadEnvMode,
  );
  // Normalized from the snapshot in hand, not read back from the store: session
  // sync fills the store on its own schedule, and a project created below must
  // be visible in the very next read.
  const normalize = (shell: typeof snapshot) => projectShellSnapshot(useStore.getState(), shell);
  const { spaces, projects: normalizedProjects } = normalize(snapshot);
  const localFolderResult = config.homeDir
    ? await ensureNativeApi()
        .filesystem.browse({
          partialPath: `${config.homeDir.replace(/[\\/]+$/, "")}/`,
        })
        .then((result) => ({
          entries: result.entries,
          errorMessage: null,
        }))
        .catch((error) => ({
          entries: [],
          errorMessage: error instanceof Error ? error.message : "Unable to load folders.",
        }))
    : {
        entries: [],
        errorMessage: "Home folder is not available yet.",
      };
  const existing = snapshot.projects.find((project) => project.kind === containerKind);
  if (existing) {
    return {
      homeProject: existing,
      projects: snapshot.projects.filter((project) => project.kind === "project"),
      normalizedProjects,
      spaces,
      localFolders: localFolderResult.entries,
      localFoldersError: localFolderResult.errorMessage,
      homeDir: config.homeDir ?? null,
      generalSettings,
      serverConfig: config,
    };
  }

  const workspaceRoot =
    containerKind === "studio" ? config.studioWorkspaceRoot?.trim() : config.homeDir?.trim();
  if (!workspaceRoot) {
    throw new Error(
      containerKind === "studio"
        ? "Studio folder is not available yet."
        : "Home folder is not available yet.",
    );
  }
  const projectId = landingId("project");
  try {
    await ensureNativeApi().orchestration.dispatchCommand({
      type: "project.create",
      commandId: landingId("command"),
      projectId,
      kind: containerKind,
      title: containerKind === "studio" ? "Studio" : "Home",
      workspaceRoot,
      createWorkspaceRootIfMissing: containerKind === "studio",
      createdAt: new Date().toISOString(),
    });
    const refreshed = await ensureNativeApi().orchestration.getShellSnapshot();
    const created = refreshed.projects.find((project) => project.id === projectId);
    if (!created) throw new Error("The new chat workspace was not persisted.");
    return {
      homeProject: created,
      projects: refreshed.projects.filter((project) => project.kind === "project"),
      normalizedProjects: normalize(refreshed).projects,
      spaces: normalize(refreshed).spaces,
      localFolders: localFolderResult.entries,
      localFoldersError: localFolderResult.errorMessage,
      homeDir: config.homeDir ?? null,
      generalSettings,
      serverConfig: config,
    };
  } catch (error) {
    const refreshed = await ensureNativeApi().orchestration.getShellSnapshot();
    const recovered = refreshed.projects.find((project) => project.kind === containerKind);
    if (recovered) {
      return {
        homeProject: recovered,
        projects: refreshed.projects.filter((project) => project.kind === "project"),
        normalizedProjects: normalize(refreshed).projects,
        spaces: normalize(refreshed).spaces,
        localFolders: localFolderResult.entries,
        localFoldersError: localFolderResult.errorMessage,
        homeDir: config.homeDir ?? null,
        generalSettings,
        serverConfig: config,
      };
    }
    throw error;
  }
}

export function LandingComposer(props: {
  /** Main-column width, so the footer compacts like the thread composer. */
  readonly availableWidth?: number;
  /** "Add providers" in the model picker: Settings → Providers. */
  readonly onOpenProviderSettings?: () => void;
  readonly branch?: string | null;
  readonly containerKind?: "chat" | "studio";
  readonly envMode?: "local" | "worktree";
  readonly initialModelProvider?: ProviderKind | null;
  readonly initialProjectId?: string | null;
  readonly notes?: string;
  readonly onEnvModeChange?: (envMode: "local" | "worktree") => void;
  readonly onProjectSelectionChange?: (projectId: string | null) => void;
  readonly onTemporaryChange?: () => void;
  readonly onThreadCreated: (threadId: string, options: { readonly temporary: boolean }) => void;
  readonly temporary?: boolean;
}) {
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const draftId = landingDraftId(props.containerKind);
  const initialModelProvider = props.initialModelProvider ?? generalSettings.defaultProvider;
  const threadIdRef = useRef(landingId("thread"));
  const threadCreationRef = useRef<LandingThreadCreationState>({
    created: false,
    inFlight: null,
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    props.initialProjectId ?? null,
  );
  useEffect(() => {
    setSelectedProjectId(props.initialProjectId ?? null);
  }, [props.initialProjectId]);
  const [studioFolderPath, setStudioFolderPath] = useState<string | null>(null);
  const [internalEnvMode, setInternalEnvMode] = useState<"local" | "worktree">(
    generalSettings.defaultThreadEnvMode,
  );
  const [internalTemporary, setInternalTemporary] = useState(false);
  const envMode = props.envMode ?? internalEnvMode;
  const temporary = props.temporary ?? internalTemporary;
  const interactionMode =
    useComposerDraftStore((state) => state.draftsByThreadId[draftId]?.interactionMode) ?? "default";
  const runtimeMode =
    useComposerDraftStore((state) => state.draftsByThreadId[draftId]?.runtimeMode) ?? "full-access";
  const setInteractionMode = useComposerDraftStore((state) => state.setInteractionMode);
  const setRuntimeMode = useComposerDraftStore((state) => state.setRuntimeMode);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectPickerBusy, setProjectPickerBusy] = useState(false);
  const [projectPickerError, setProjectPickerError] = useState<string | null>(null);
  const { data, error, isFetching, isPending, refetch } = useQuery({
    queryKey: landingBootstrapQueryKey(initialModelProvider, props.containerKind ?? "chat"),
    queryFn: () => loadLandingBootstrap(initialModelProvider, props.containerKind ?? "chat"),
    staleTime: 30_000,
  });
  useEffect(() => {
    // Seed only an empty cache: once session sync owns the config query, a
    // bootstrap read may be older than what the server has pushed since.
    if (data?.serverConfig && queryClient.getQueryData(serverQueryKeys.config()) === undefined) {
      queryClient.setQueryData(serverQueryKeys.config(), data.serverConfig);
    }
  }, [data?.serverConfig]);
  useEffect(() => {
    if (props.envMode === undefined && data?.generalSettings.defaultThreadEnvMode) {
      setInternalEnvMode(data.generalSettings.defaultThreadEnvMode);
    }
  }, [data?.generalSettings.defaultThreadEnvMode, props.envMode]);
  const modelSelection = useMemo<ModelSelection>(() => {
    const selectedProject = data?.projects.find((project) => project.id === selectedProjectId);
    if (selectedProject?.defaultModelSelection) {
      return selectedProject.defaultModelSelection;
    }
    if (data?.homeProject.defaultModelSelection) {
      return data.homeProject.defaultModelSelection;
    }
    return defaultModelSelectionForProvider(initialModelProvider);
  }, [data, initialModelProvider, selectedProjectId]);
  const selectedProject = data?.projects.find((project) => project.id === selectedProjectId);
  const targetProject = selectedProject ?? data?.homeProject;
  const workspaceContext = targetProject
    ? resolveLandingWorkspaceContext({
        containerKind: props.containerKind ?? "chat",
        projectWorkspaceRoot: targetProject.workspaceRoot,
        studioFolderPath,
      })
    : null;
  const projectPickerModel = useMemo(
    () =>
      buildComposerProjectPickerModel({
        projects: [
          ...(props.containerKind === "studio"
            ? []
            : (data?.projects ?? []).map((project) => {
                const source = data?.normalizedProjects.find(
                  (candidate) => candidate.id === project.id,
                );
                const space = data?.spaces.find((candidate) => candidate.id === source?.spaceId);
                return {
                  id: `project:${project.id}`,
                  kind: "project" as const,
                  projectId: project.id as never,
                  workspaceRoot: project.workspaceRoot,
                  primaryLabel:
                    source?.localName?.trim() || projectWorkspaceLabel(project.workspaceRoot),
                  secondaryLabel:
                    source?.localName?.trim() &&
                    source.localName.trim() !== projectWorkspaceLabel(project.workspaceRoot)
                      ? projectWorkspaceLabel(project.workspaceRoot)
                      : null,
                  spaceId: source?.spaceId ?? null,
                  spaceName: space?.name ?? null,
                  spaceIcon: space?.icon ?? null,
                  spaceSortOrder: space?.sortOrder,
                };
              })),
          ...(data?.localFolders ?? [])
            .filter(
              (folder) =>
                !folder.name.startsWith(".") &&
                (props.containerKind === "studio" ||
                  !(data?.projects ?? []).some(
                    (project) => project.workspaceRoot === folder.fullPath,
                  )),
            )
            .map((folder) => ({
              id: `folder:${folder.fullPath}`,
              kind: "folder" as const,
              projectId: null,
              workspaceRoot: folder.fullPath,
              primaryLabel: folder.name,
              secondaryLabel: null,
              spaceId: "__local__" as never,
              spaceName: "Folders on this Mac",
              spaceIcon: "home" as const,
              spaceSortOrder: Number.MAX_SAFE_INTEGER,
            })),
        ],
        selectedOptionId:
          props.containerKind === "studio"
            ? studioFolderPath
              ? `folder:${studioFolderPath}`
              : null
            : selectedProjectId
              ? `project:${selectedProjectId}`
              : null,
        query: projectQuery,
        emptyTriggerLabel: props.containerKind === "studio" ? "Use a folder" : undefined,
      }),
    [data, projectQuery, props.containerKind, selectedProjectId, studioFolderPath],
  );

  const handleProjectPickerOpenChange = (open: boolean) => {
    "background only";
    setProjectPickerOpen(open);
    if (!open) {
      setProjectQuery("");
      setProjectPickerError(null);
    }
  };

  const selectProject = (projectId: string | null) => {
    "background only";
    setSelectedProjectId(projectId);
    props.onProjectSelectionChange?.(projectId);
  };

  const handleAddProject = async () => {
    "background only";
    if (projectPickerBusy) return;
    setProjectPickerBusy(true);
    setProjectPickerError(null);
    try {
      const workspaceRoot = await dialogs.pickFolder();
      if (!workspaceRoot) return;
      if (props.containerKind === "studio") {
        setStudioFolderPath(workspaceRoot);
        setProjectPickerOpen(false);
        return;
      }
      const projectId = landingId("project");
      await ensureNativeApi().orchestration.dispatchCommand({
        type: "project.create",
        commandId: landingId("command"),
        projectId,
        title: projectWorkspaceLabel(workspaceRoot),
        workspaceRoot,
        createWorkspaceRootIfMissing: false,
        defaultModelSelection: defaultModelSelectionForProvider(initialModelProvider),
        isPinned: false,
        spaceId: null,
        createdAt: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({
        queryKey: landingBootstrapQueryKey(initialModelProvider, props.containerKind ?? "chat"),
      });
      const refreshed = await loadLandingBootstrap(
        initialModelProvider,
        props.containerKind ?? "chat",
      );
      queryClient.setQueryData(
        landingBootstrapQueryKey(initialModelProvider, props.containerKind ?? "chat"),
        refreshed,
      );
      selectProject(projectId);
      setProjectPickerOpen(false);
    } catch (error) {
      setProjectPickerError(error instanceof Error ? error.message : "Unable to add project.");
    } finally {
      setProjectPickerBusy(false);
    }
  };

  async function ensureThread(input: {
    readonly interactionMode: "default" | "plan";
    readonly modelSelection: ModelSelection;
    readonly runtimeMode: RuntimeMode;
  }): Promise<void> {
    "background only";
    if (!targetProject || !workspaceContext) {
      throw new Error("The new chat workspace is not ready.");
    }
    const threadId = threadIdRef.current;
    await ensureLandingThreadCreated({
      state: threadCreationRef.current,
      create: async () => {
        await ensureNativeApi().orchestration.dispatchCommand({
          type: "thread.create",
          commandId: landingId("command"),
          threadId,
          projectId: targetProject.id,
          title: "New chat",
          modelSelection: input.modelSelection,
          runtimeMode: input.runtimeMode,
          interactionMode: input.interactionMode,
          envMode,
          branch: props.branch ?? null,
          worktreePath: workspaceContext.worktreePath,
          createdAt: new Date().toISOString(),
        });
      },
      recover: async () =>
        (await ensureNativeApi().orchestration.getShellSnapshot()).threads.some(
          (thread) => thread.id === threadId,
        ),
    });
    if ((props.notes ?? "").trim().length > 0) {
      await ensureNativeApi()
        .orchestration.dispatchCommand({
          type: "thread.meta.update",
          commandId: landingId("command"),
          threadId,
          notes: props.notes ?? "",
        })
        .catch(() => undefined);
    }
  }

  if (isPending && !data) {
    return (
      <view className="LandingComposerState">
        <PanelStateMessage intent="status" announcement="Preparing new chat">
          Preparing new chat…
        </PanelStateMessage>
      </view>
    );
  }
  if (!data) {
    return (
      <view className="LandingComposerState">
        <PanelStateMessage intent="alert" announcement="Unable to prepare new chat">
          Unable to prepare a new chat. Your draft will be available after retrying.
        </PanelStateMessage>
        <Button
          variant="outline"
          disabled={isFetching}
          aria-label="Retry preparing new chat"
          onClick={() => void refetch()}
        >
          {isFetching ? "Retrying…" : "Retry"}
        </Button>
      </view>
    );
  }

  const readyProject = targetProject ?? data.homeProject;

  return (
    <view className="LandingComposer">
      {error ? (
        <view className="LandingComposerRefreshIssue">
          <PanelStateMessage intent="alert" announcement="New chat data may be stale">
            Using the last available new-chat settings.
          </PanelStateMessage>
          <Button
            variant="outline"
            disabled={isFetching}
            aria-label="Retry refreshing new chat settings"
            onClick={() => void refetch()}
          >
            {isFetching ? "Retrying…" : "Retry"}
          </Button>
        </view>
      ) : null}
      <EmptyThreadContextTray
        branch={props.branch ?? null}
        className="LandingComposerTray"
        envMode={envMode}
        onEnvModeChange={props.onEnvModeChange ?? setInternalEnvMode}
        onTemporaryChange={
          props.onTemporaryChange ?? (() => setInternalTemporary((current) => !current))
        }
        projectName={readyProject.title}
        temporary={temporary}
        onResetProject={
          selectedProject && props.containerKind !== "studio"
            ? () => selectProject(null)
            : undefined
        }
        projectControl={
          <ComposerProjectPickerComposition
            model={projectPickerModel}
            open={projectPickerOpen}
            align="start"
            side="top"
            onOpenChange={handleProjectPickerOpenChange}
            onQueryChange={setProjectQuery}
            onSelectOption={(option) => {
              "background only";
              if (props.containerKind === "studio") {
                setStudioFolderPath(option.workspaceRoot);
                setProjectPickerOpen(false);
                return;
              }
              if (option.projectId) {
                selectProject(option.projectId);
                setProjectPickerOpen(false);
                return;
              }
              void (async () => {
                setProjectPickerBusy(true);
                setProjectPickerError(null);
                try {
                  const existing = data.projects.find(
                    (project) => project.workspaceRoot === option.workspaceRoot,
                  );
                  if (existing) {
                    selectProject(existing.id);
                    setProjectPickerOpen(false);
                    return;
                  }
                  const projectId = landingId("project");
                  await ensureNativeApi().orchestration.dispatchCommand({
                    type: "project.create",
                    commandId: landingId("command"),
                    projectId,
                    title: option.primaryLabel,
                    workspaceRoot: option.workspaceRoot,
                    createWorkspaceRootIfMissing: false,
                    defaultModelSelection: defaultModelSelectionForProvider(initialModelProvider),
                    isPinned: false,
                    spaceId: null,
                    createdAt: new Date().toISOString(),
                  });
                  const refreshed = await loadLandingBootstrap(
                    initialModelProvider,
                    props.containerKind ?? "chat",
                  );
                  queryClient.setQueryData(
                    landingBootstrapQueryKey(initialModelProvider, props.containerKind ?? "chat"),
                    refreshed,
                  );
                  selectProject(projectId);
                  setProjectPickerOpen(false);
                } catch (selectionError) {
                  setProjectPickerError(
                    selectionError instanceof Error
                      ? selectionError.message
                      : "Unable to select project.",
                  );
                } finally {
                  setProjectPickerBusy(false);
                }
              })();
            }}
            addActionLabel={
              projectPickerBusy
                ? props.containerKind === "studio"
                  ? "Choosing folder..."
                  : "Adding project..."
                : props.containerKind === "studio"
                  ? "Choose a folder"
                  : "New project"
            }
            addActionBusy={projectPickerBusy}
            resetActionLabel={
              props.containerKind === "studio" ? "Don't use a folder" : "Don't work in a project"
            }
            searchPlaceholder={
              props.containerKind === "studio" ? "Search folders" : "Search projects"
            }
            errorMessage={projectPickerError ?? data.localFoldersError}
            retryActionLabel={isFetching ? "Retrying…" : "Retry"}
            retryActionBusy={isFetching}
            onRetry={data.localFoldersError ? () => void refetch() : undefined}
            onAddProject={() => void handleAddProject()}
            onReset={() => {
              "background only";
              if (props.containerKind === "studio") {
                setStudioFolderPath(null);
              } else {
                selectProject(null);
              }
              setProjectPickerOpen(false);
            }}
            triggerClassName="LandingComposerProjectTrigger"
          />
        }
      />
      <Composer
        availableWidth={props.availableWidth}
        voiceInputEnabled
        draftId={draftId}
        threadId={threadIdRef.current}
        modelSelection={modelSelection}
        runtimeMode={runtimeMode}
        interactionMode={interactionMode}
        sessionStatus={null}
        activeTurnId={null}
        workspaceRoot={workspaceContext?.workspaceRoot ?? readyProject.workspaceRoot}
        providerStatuses={data.serverConfig.providers}
        emptyLanding={true}
        onOpenProviderSettings={props.onOpenProviderSettings}
        onBeforeSend={ensureThread}
        onSetInteractionMode={(nextInteractionMode) =>
          setInteractionMode(draftId, nextInteractionMode)
        }
        onSetRuntimeMode={(nextRuntimeMode) => setRuntimeMode(draftId, nextRuntimeMode)}
        onSendSucceeded={() => {
          "background only";
          props.onThreadCreated(threadIdRef.current, { temporary });
          void queryClient.invalidateQueries({ queryKey: ["landing-composer-bootstrap"] });
        }}
      />
    </view>
  );
}
