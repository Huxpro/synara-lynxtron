import { useEffect, useMemo, useRef, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type { ModelSelection, ServerProviderStatus } from '@synara/contracts';
import { getDefaultModel } from '@synara/shared/model';
import { PanelStateMessage } from '@synara-web/components/chat/PanelStateMessage';
import { ComposerProjectPickerComposition } from '@synara-web/components/chat/ComposerProjectPickerComposition';
import { buildComposerProjectPickerModel } from '@synara-web/components/chat/ComposerProjectPicker.logic';
import { useStore } from '@synara-web/store';

import { fetchSidebarSnapshot, queryClient } from '../../app/queries';
import {
  dispatchSynaraCommand,
  browseFilesystem,
  fetchServerConfig,
  fetchSynaraSidebarShellSnapshot,
} from '../../data/synaraClient.lynx';
import { dialogs } from '../../platform/dialogs';
import { Button } from '../ui/button';
import { Composer } from './Composer.lynx';
import {
  ensureLandingThreadCreated,
  type LandingThreadCreationState,
} from './landingThreadCreation.logic';

import './landing-composer.css';

function landingId(kind: 'command' | 'project' | 'thread'): string {
  'background only';
  return `lynx-landing-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function projectWorkspaceLabel(workspaceRoot: string): string {
  const normalized = workspaceRoot.replace(/[\\/]+$/, '');
  const segments = normalized.split(/[\\/]+/);
  return segments.at(-1) || workspaceRoot;
}

async function loadLandingBootstrap() {
  'background only';
  const [snapshot, , config] = await Promise.all([
    fetchSynaraSidebarShellSnapshot(),
    fetchSidebarSnapshot(),
    fetchServerConfig(),
  ]);
  const spaces = useStore.getState().spaces;
  const normalizedProjects = useStore.getState().projects;
  const localFolderResult = config.homeDir
    ? await browseFilesystem({
        partialPath: `${config.homeDir.replace(/[\\/]+$/, '')}/`,
      })
        .then((result) => ({
          entries: result.entries,
          errorMessage: null,
        }))
        .catch((error) => ({
          entries: [],
          errorMessage:
            error instanceof Error ? error.message : 'Unable to load folders.',
        }))
    : {
        entries: [],
        errorMessage: 'Home folder is not available yet.',
      };
  const existing = snapshot.projects.find((project) => project.kind === 'chat');
  if (existing) {
    return {
      homeProject: existing,
      projects: snapshot.projects.filter((project) => project.kind === 'project'),
      normalizedProjects,
      spaces,
      localFolders: localFolderResult.entries,
      localFoldersError: localFolderResult.errorMessage,
      homeDir: config.homeDir ?? null,
      serverConfig: config,
    };
  }

  const workspaceRoot = config.homeDir?.trim();
  if (!workspaceRoot) {
    throw new Error('Home folder is not available yet.');
  }
  const projectId = landingId('project');
  try {
    await dispatchSynaraCommand({
      type: 'project.create',
      commandId: landingId('command'),
      projectId,
      kind: 'chat',
      title: 'Home',
      workspaceRoot,
      createdAt: new Date().toISOString(),
    });
    const refreshed = await fetchSynaraSidebarShellSnapshot();
    const created = refreshed.projects.find(
      (project) => project.id === projectId
    );
    if (!created) throw new Error('The new chat workspace was not persisted.');
    await fetchSidebarSnapshot();
    return {
      homeProject: created,
      projects: refreshed.projects.filter(
        (project) => project.kind === 'project'
      ),
      normalizedProjects: useStore.getState().projects,
      spaces: useStore.getState().spaces,
      localFolders: localFolderResult.entries,
      localFoldersError: localFolderResult.errorMessage,
      homeDir: config.homeDir ?? null,
    };
  } catch (error) {
    const refreshed = await fetchSynaraSidebarShellSnapshot();
    const recovered = refreshed.projects.find(
      (project) => project.kind === 'chat'
    );
    if (recovered) {
      await fetchSidebarSnapshot();
      return {
        homeProject: recovered,
        projects: refreshed.projects.filter(
          (project) => project.kind === 'project'
        ),
        normalizedProjects: useStore.getState().projects,
        spaces: useStore.getState().spaces,
        localFolders: localFolderResult.entries,
        localFoldersError: localFolderResult.errorMessage,
        homeDir: config.homeDir ?? null,
        serverConfig: config,
      };
    }
    throw error;
  }
}

export function LandingComposer(props: {
  readonly initialProjectId?: string | null;
  readonly onProviderStatusesChange?: (
    statuses: readonly ServerProviderStatus[]
  ) => void;
  readonly onThreadCreated: (threadId: string) => void;
}) {
  const threadIdRef = useRef(landingId('thread'));
  const threadCreationRef = useRef<LandingThreadCreationState>({
    created: false,
    inFlight: null,
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    props.initialProjectId ?? null
  );
  const [interactionMode, setInteractionMode] = useState<
    'default' | 'plan'
  >('default');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState('');
  const [projectPickerBusy, setProjectPickerBusy] = useState(false);
  const [projectPickerError, setProjectPickerError] = useState<string | null>(
    null
  );
  const { data, error, isFetching, isPending, refetch } = useQuery({
    queryKey: ['landing-composer-bootstrap'],
    queryFn: loadLandingBootstrap,
    staleTime: 30_000,
  });
  useEffect(() => {
    if (data?.serverConfig) {
      queryClient.setQueryData(['server-config'], data.serverConfig);
      props.onProviderStatusesChange?.(data.serverConfig.providers);
    }
  }, [data?.serverConfig, props.onProviderStatusesChange]);
  const modelSelection = useMemo<ModelSelection>(() => {
    const selectedProject = data?.projects.find(
      (project) => project.id === selectedProjectId
    );
    if (selectedProject?.defaultModelSelection) {
      return selectedProject.defaultModelSelection;
    }
    if (data?.homeProject.defaultModelSelection) {
      return data.homeProject.defaultModelSelection;
    }
    return {
      provider: 'codex',
      model: getDefaultModel('codex'),
    };
  }, [data, selectedProjectId]);
  const selectedProject = data?.projects.find(
    (project) => project.id === selectedProjectId
  );
  const targetProject = selectedProject ?? data?.homeProject;
  const projectPickerModel = useMemo(
    () =>
      buildComposerProjectPickerModel({
        projects: [
          ...(data?.projects ?? []).map((project) => {
            const source = data?.normalizedProjects.find(
              (candidate) => candidate.id === project.id
            );
            const space = data?.spaces.find(
              (candidate) => candidate.id === source?.spaceId
            );
            return {
              id: `project:${project.id}`,
              kind: 'project' as const,
              projectId: project.id as never,
              workspaceRoot: project.workspaceRoot,
              primaryLabel:
                source?.localName?.trim() ||
                projectWorkspaceLabel(project.workspaceRoot),
              secondaryLabel:
                source?.localName?.trim() &&
                source.localName.trim() !==
                  projectWorkspaceLabel(project.workspaceRoot)
                  ? projectWorkspaceLabel(project.workspaceRoot)
                  : null,
              spaceId: source?.spaceId ?? null,
              spaceName: space?.name ?? null,
              spaceIcon: space?.icon ?? null,
              spaceSortOrder: space?.sortOrder,
            };
          }),
          ...(data?.localFolders ?? [])
            .filter(
              (folder) =>
                !folder.name.startsWith('.') &&
                !(data?.projects ?? []).some(
                  (project) => project.workspaceRoot === folder.fullPath
                )
            )
            .map((folder) => ({
              id: `folder:${folder.fullPath}`,
              kind: 'folder' as const,
              projectId: null,
              workspaceRoot: folder.fullPath,
              primaryLabel: folder.name,
              secondaryLabel: null,
              spaceId: '__local__' as never,
              spaceName: 'Folders on this Mac',
              spaceIcon: 'home' as const,
              spaceSortOrder: Number.MAX_SAFE_INTEGER,
            })),
        ],
        selectedOptionId: selectedProjectId
          ? `project:${selectedProjectId}`
          : null,
        query: projectQuery,
      }),
    [data, projectQuery, selectedProjectId]
  );

  const handleProjectPickerOpenChange = (open: boolean) => {
    'background only';
    setProjectPickerOpen(open);
    if (!open) {
      setProjectQuery('');
      setProjectPickerError(null);
    }
  };

  const handleAddProject = async () => {
    'background only';
    if (projectPickerBusy) return;
    setProjectPickerBusy(true);
    setProjectPickerError(null);
    try {
      const workspaceRoot = await dialogs.pickFolder();
      if (!workspaceRoot) return;
      const projectId = landingId('project');
      await dispatchSynaraCommand({
        type: 'project.create',
        commandId: landingId('command'),
        projectId,
        title: projectWorkspaceLabel(workspaceRoot),
        workspaceRoot,
        createWorkspaceRootIfMissing: false,
        defaultModelSelection: {
          provider: 'codex',
          model: getDefaultModel('codex'),
        },
        isPinned: false,
        spaceId: null,
        createdAt: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({
        queryKey: ['landing-composer-bootstrap'],
      });
      const refreshed = await loadLandingBootstrap();
      queryClient.setQueryData(['landing-composer-bootstrap'], refreshed);
      setSelectedProjectId(projectId);
      setProjectPickerOpen(false);
    } catch (error) {
      setProjectPickerError(
        error instanceof Error ? error.message : 'Unable to add project.'
      );
    } finally {
      setProjectPickerBusy(false);
    }
  };

  async function ensureThread(input: {
    readonly interactionMode: 'default' | 'plan';
    readonly modelSelection: ModelSelection;
    readonly runtimeMode: 'full-access' | 'approval-required';
  }): Promise<void> {
    'background only';
    if (!targetProject) throw new Error('The new chat workspace is not ready.');
    const threadId = threadIdRef.current;
    await ensureLandingThreadCreated({
      state: threadCreationRef.current,
      create: async () => {
        await dispatchSynaraCommand({
          type: 'thread.create',
          commandId: landingId('command'),
          threadId,
          projectId: targetProject.id,
          title: 'New chat',
          modelSelection: input.modelSelection,
          runtimeMode: input.runtimeMode,
          interactionMode: input.interactionMode,
          envMode: 'local',
          branch: null,
          worktreePath: null,
          createdAt: new Date().toISOString(),
        });
      },
      recover: async () =>
        (await fetchSynaraSidebarShellSnapshot()).threads.some(
          (thread) => thread.id === threadId
        ),
    });
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
          {isFetching ? 'Retrying…' : 'Retry'}
        </Button>
      </view>
    );
  }

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
            {isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        </view>
      ) : null}
      <Composer
        draftId="lynx-landing-draft"
        threadId={threadIdRef.current}
        modelSelection={modelSelection}
        runtimeMode="full-access"
        interactionMode={interactionMode}
        sessionStatus={null}
        activeTurnId={null}
        workspaceRoot={targetProject.workspaceRoot}
        emptyLanding={true}
        onBeforeSend={ensureThread}
        onProviderStatusesChange={props.onProviderStatusesChange}
        onSetInteractionMode={setInteractionMode}
        onSendSucceeded={() => {
          'background only';
          props.onThreadCreated(threadIdRef.current);
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: ['threads'] }),
            queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] }),
            queryClient.invalidateQueries({ queryKey: ['landing-composer-bootstrap'] }),
          ]);
        }}
      />
      <view className="LandingComposerTray">
        <ComposerProjectPickerComposition
          model={projectPickerModel}
          open={projectPickerOpen}
          align="start"
          side="top"
          onOpenChange={handleProjectPickerOpenChange}
          onQueryChange={setProjectQuery}
          onSelectOption={(option) => {
            'background only';
            if (option.projectId) {
              setSelectedProjectId(option.projectId);
              setProjectPickerOpen(false);
              return;
            }
            void (async () => {
              setProjectPickerBusy(true);
              setProjectPickerError(null);
              try {
                const existing = data.projects.find(
                  (project) => project.workspaceRoot === option.workspaceRoot
                );
                if (existing) {
                  setSelectedProjectId(existing.id);
                  setProjectPickerOpen(false);
                  return;
                }
                const projectId = landingId('project');
                await dispatchSynaraCommand({
                  type: 'project.create',
                  commandId: landingId('command'),
                  projectId,
                  title: option.primaryLabel,
                  workspaceRoot: option.workspaceRoot,
                  createWorkspaceRootIfMissing: false,
                  defaultModelSelection: {
                    provider: 'codex',
                    model: getDefaultModel('codex'),
                  },
                  isPinned: false,
                  spaceId: null,
                  createdAt: new Date().toISOString(),
                });
                const refreshed = await loadLandingBootstrap();
                queryClient.setQueryData(
                  ['landing-composer-bootstrap'],
                  refreshed
                );
                setSelectedProjectId(projectId);
                setProjectPickerOpen(false);
              } catch (selectionError) {
                setProjectPickerError(
                  selectionError instanceof Error
                    ? selectionError.message
                    : 'Unable to select project.'
                );
              } finally {
                setProjectPickerBusy(false);
              }
            })();
          }}
          addActionLabel={
            projectPickerBusy ? 'Adding project...' : 'New project'
          }
          addActionBusy={projectPickerBusy}
          resetActionLabel="Don't work in a project"
          searchPlaceholder="Search projects"
          errorMessage={projectPickerError ?? data.localFoldersError}
          retryActionLabel={isFetching ? 'Retrying…' : 'Retry'}
          retryActionBusy={isFetching}
          onRetry={
            data.localFoldersError ? () => void refetch() : undefined
          }
          onAddProject={() => void handleAddProject()}
          onReset={() => {
            'background only';
            setSelectedProjectId(null);
            setProjectPickerOpen(false);
          }}
          triggerClassName="LandingComposerProjectTrigger"
        />
      </view>
    </view>
  );
}
