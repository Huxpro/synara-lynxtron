import { useMemo, useRef } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type { ModelSelection } from '@synara/contracts';
import { getDefaultModel } from '@synara/shared/model';
import { PanelStateMessage } from '@synara-web/components/chat/PanelStateMessage';

import { queryClient } from '../../app/queries';
import {
  dispatchSynaraCommand,
  fetchServerConfig,
  fetchSynaraSidebarShellSnapshot,
} from '../../data/synaraClient.lynx';
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

async function loadLandingBootstrap() {
  'background only';
  const [snapshot, config] = await Promise.all([
    fetchSynaraSidebarShellSnapshot(),
    fetchServerConfig(),
  ]);
  const existing = snapshot.projects.find((project) => project.kind === 'chat');
  if (existing) return existing;

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
    const created = (await fetchSynaraSidebarShellSnapshot()).projects.find(
      (project) => project.id === projectId
    );
    if (!created) throw new Error('The new chat workspace was not persisted.');
    return created;
  } catch (error) {
    const recovered = (await fetchSynaraSidebarShellSnapshot()).projects.find(
      (project) => project.kind === 'chat'
    );
    if (recovered) return recovered;
    throw error;
  }
}

export function LandingComposer(props: {
  readonly onThreadCreated: (threadId: string) => void;
}) {
  const threadIdRef = useRef(landingId('thread'));
  const threadCreationRef = useRef<LandingThreadCreationState>({
    created: false,
    inFlight: null,
  });
  const { data, error, isFetching, isPending, refetch } = useQuery({
    queryKey: ['landing-composer-bootstrap'],
    queryFn: loadLandingBootstrap,
    staleTime: 30_000,
  });
  const modelSelection = useMemo<ModelSelection>(() => {
    if (data?.defaultModelSelection) return data.defaultModelSelection;
    return {
      provider: 'codex',
      model: getDefaultModel('codex'),
    };
  }, [data?.defaultModelSelection]);

  async function ensureThread(input: {
    readonly interactionMode: 'default' | 'plan';
    readonly modelSelection: ModelSelection;
    readonly runtimeMode: 'full-access' | 'approval-required';
  }): Promise<void> {
    'background only';
    if (!data) throw new Error('The new chat workspace is not ready.');
    const threadId = threadIdRef.current;
    await ensureLandingThreadCreated({
      state: threadCreationRef.current,
      create: async () => {
        await dispatchSynaraCommand({
          type: 'thread.create',
          commandId: landingId('command'),
          threadId,
          projectId: data.id,
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
        interactionMode="default"
        sessionStatus={null}
        activeTurnId={null}
        workspaceRoot={data.workspaceRoot}
        onBeforeSend={ensureThread}
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
    </view>
  );
}
