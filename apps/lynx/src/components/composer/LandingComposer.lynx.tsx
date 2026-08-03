import { useMemo, useRef, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type { ModelSelection } from '@synara/contracts';
import { getDefaultModel } from '@synara/shared/model';
import { PanelStateMessage } from '@synara-web/components/chat/PanelStateMessage';
import { FolderIcon } from '@synara-web/lib/icons';

import { queryClient } from '../../app/queries';
import {
  dispatchSynaraCommand,
  fetchServerConfig,
  fetchSynaraSidebarShellSnapshot,
} from '../../data/synaraClient.lynx';
import { Button } from '../ui/button';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '../ui/menu.lynx';
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
  const [snapshot, config] = await Promise.all([
    fetchSynaraSidebarShellSnapshot(),
    fetchServerConfig(),
  ]);
  const existing = snapshot.projects.find((project) => project.kind === 'chat');
  if (existing) {
    return {
      homeProject: existing,
      projects: snapshot.projects.filter((project) => project.kind === 'project'),
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
    return {
      homeProject: created,
      projects: refreshed.projects.filter((project) => project.kind === 'project'),
    };
  } catch (error) {
    const refreshed = await fetchSynaraSidebarShellSnapshot();
    const recovered = refreshed.projects.find(
      (project) => project.kind === 'chat'
    );
    if (recovered) {
      return {
        homeProject: recovered,
        projects: refreshed.projects.filter((project) => project.kind === 'project'),
      };
    }
    throw error;
  }
}

export function LandingComposer(props: {
  readonly initialProjectId?: string | null;
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
  const { data, error, isFetching, isPending, refetch } = useQuery({
    queryKey: ['landing-composer-bootstrap'],
    queryFn: loadLandingBootstrap,
    staleTime: 30_000,
  });
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
  const selectedProjectLabel = selectedProject
    ? projectWorkspaceLabel(selectedProject.workspaceRoot)
    : 'Work in a project';
  const targetProject = selectedProject ?? data?.homeProject;

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
        threadId={threadIdRef.current}
        modelSelection={modelSelection}
        runtimeMode="full-access"
        interactionMode={interactionMode}
        sessionStatus={null}
        activeTurnId={null}
        workspaceRoot={targetProject.workspaceRoot}
        emptyLanding={true}
        onBeforeSend={ensureThread}
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
        <Menu>
          <MenuTrigger
            className="LandingComposerProjectTrigger"
            ariaLabel={selectedProjectLabel}
          >
            <FolderIcon className="LandingComposerProjectIcon" />
            <text className="LandingComposerProjectLabel">
              {selectedProjectLabel}
            </text>
          </MenuTrigger>
          <MenuPopup
            className="LandingComposerProjectPopup"
            side="top"
            align="start"
            sideOffset={6}
          >
            <MenuItem onClick={() => setSelectedProjectId(null)}>
              Don't work in a project
            </MenuItem>
            {data.projects.map((project) => (
              <MenuItem
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
              >
                {projectWorkspaceLabel(project.workspaceRoot)}
              </MenuItem>
            ))}
          </MenuPopup>
        </Menu>
      </view>
    </view>
  );
}
