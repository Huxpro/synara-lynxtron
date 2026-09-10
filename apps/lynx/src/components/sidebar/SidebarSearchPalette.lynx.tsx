import { useMemo, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_MODEL_BY_PROVIDER, type ProviderKind } from '@synara/contracts';

import {
  SidebarSearchPalette,
  type SidebarSearchPaletteMode,
  type ImportProviderKind,
} from '@synara-web/components/SidebarSearchPalette';
import { newCommandId } from '@synara-web/lib/utils';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
} from '@synara-web/appSettingsStorageProjection.logic';
import type { SidebarSnapshot } from '../../app/queries';
import { webStorage } from '../../platform/storage';
import {
  buildNativeSearchImportThreadCreateCommand,
  buildNativeSearchProjectCreateCommand,
} from './sidebarSearchActions.logic';
import { buildLynxSidebarSearchActions } from './sidebarSearchSpaceActions.logic';
import { FeedbackDialogLynx } from './FeedbackDialog.lynx';

const IMPORT_PROVIDERS: readonly ImportProviderKind[] = [
  'codex',
  'claudeAgent',
  'cursor',
  'kilo',
  'opencode',
];

export function SidebarSearchPaletteLynx(props: {
  readonly open: boolean;
  readonly activeThreadId?: string | null;
  readonly initialQuery?: string;
  readonly snapshot: SidebarSnapshot | undefined;
  readonly searchStatus: 'ready' | 'loading' | 'error';
  readonly searchErrorMessage?: string | null;
  readonly onRetrySearch: () => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onOpenProject: (projectId: string) => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onCreateThread: () => void;
  readonly onCreateProjectThread: (projectId: string) => void;
  readonly onCreateSpace: () => void;
  readonly onOpenSettings: (section?: 'usage') => void;
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  );
  const [mode, setMode] = useState<SidebarSearchPaletteMode>('search');
  const actions = useMemo(
    () => buildLynxSidebarSearchActions(props.onCreateSpace),
    [props.onCreateSpace]
  );
  const projects = useMemo(
    () =>
      (props.snapshot?.searchProjects ?? []).filter((project) =>
        (props.snapshot?.projects ?? []).some(
          (source) => source.id === project.id && source.kind === 'project'
        )
      ),
    [props.snapshot]
  );
  const threads = props.snapshot?.searchThreads ?? [];
  const newThreadProjectId =
    props.snapshot?.projects.find((project) => project.kind === 'project')?.id ??
    null;
  const { data: importProviders = [] } = useQuery({
    queryKey: ['sidebar-search-import-providers'],
    queryFn: async () => {
      'background only';
      const { fetchProviderComposerCapabilities } = await import(
        /* webpackMode: "eager" */ '../../data/synaraClient.lynx'
      );
      const capabilities = await Promise.all(
        IMPORT_PROVIDERS.map(async (provider) => ({
          provider,
          capabilities: await fetchProviderComposerCapabilities(provider).catch(
            () => null
          ),
        }))
      );
      return capabilities
        .filter((entry) => entry.capabilities?.supportsThreadImport === true)
        .map((entry) => entry.provider);
    },
    staleTime: 60_000,
  });

  const addProjectPath = async (
    workspaceRoot: string,
    options?: { createIfMissing?: boolean }
  ) => {
    'background only';
    const { dispatchSynaraCommand } = await import(
      /* webpackMode: "eager" */ '../../data/synaraClient.lynx'
    );
    const command = buildNativeSearchProjectCreateCommand({
      workspaceRoot,
      createIfMissing: options?.createIfMissing === true,
      defaultProvider: generalSettings.defaultProvider,
    });
    await dispatchSynaraCommand(command);
    props.onOpenProject(command.projectId);
  };

  const importThread = async (
    provider: ImportProviderKind,
    externalId: string
  ) => {
    'background only';
    const { dispatchSynaraCommand, importSynaraThread } = await import(
      /* webpackMode: "eager" */ '../../data/synaraClient.lynx'
    );
    const target = props.snapshot?.projects.find(
      (project) => project.kind === 'project'
    );
    if (!target) throw new Error('Add a project before importing a thread.');
    const model = DEFAULT_MODEL_BY_PROVIDER[provider as ProviderKind];
    if (!model) throw new Error(`No default model is available for ${provider}.`);
    const command = buildNativeSearchImportThreadCreateCommand({
      projectId: target.id,
      provider,
      model,
      externalId,
      envMode: generalSettings.defaultThreadEnvMode,
    });
    let created = false;
    try {
      await dispatchSynaraCommand(command);
      created = true;
      await importSynaraThread({
        threadId: command.threadId,
        externalId: externalId.trim(),
      });
      props.onOpenThread(command.threadId);
    } catch (error) {
      if (created) {
        await dispatchSynaraCommand({
          type: 'thread.delete',
          commandId: newCommandId(),
          threadId: command.threadId,
        }).catch(() => undefined);
      }
      throw error;
    }
  };

  const activeThread = props.snapshot?.threads.find(
    (thread) => thread.id === props.activeThreadId
  );
  const activeProject = activeThread
    ? props.snapshot?.projects.find(
        (project) => project.id === activeThread.projectId
      )
    : null;
  const feedbackContext = useMemo(
    () => ({
      provider: activeThread?.provider ?? null,
      model: null,
      projectKind: activeProject?.kind ?? null,
      environmentMode: null,
      runtimeMode: null,
      interactionMode: null,
      sessionStatus: activeThread?.sessionStatus ?? null,
      latestTurnState: activeThread?.latestTurnState ?? null,
      messageCount: activeThread?.messageCount ?? 0,
      activityCount: 0,
      hasPendingApproval: activeThread?.hasPendingApprovals === true,
      hasPendingUserInput: activeThread?.hasPendingUserInput === true,
      hasThreadError: false,
    }),
    [activeProject?.kind, activeThread]
  );

  return (
    <>
      <SidebarSearchPalette
      open={props.open}
      initialQuery={props.initialQuery}
      mode={mode}
      onModeChange={setMode}
      onOpenChange={props.onOpenChange}
      actions={actions}
      projects={projects}
      threads={threads}
      searchStatus={props.searchStatus}
      searchErrorMessage={props.searchErrorMessage}
      onRetrySearch={props.onRetrySearch}
      onCreateChat={props.onCreateThread}
      onCreateThread={() => {
        if (newThreadProjectId) props.onCreateProjectThread(newThreadProjectId);
        else props.onCreateThread();
      }}
      onAddProjectPath={addProjectPath}
      homeDir={null}
      onOpenSettings={props.onOpenSettings}
      onOpenFeedback={() => setFeedbackOpen(true)}
      onOpenUsageSettings={() => props.onOpenSettings('usage')}
      onOpenProject={props.onOpenProject}
      onOpenThread={props.onOpenThread}
      importProviders={importProviders}
      onImportThread={importThread}
      onBrowseFilesystem={async (partialPath) => {
        'background only';
        const { browseFilesystem } = await import(
          /* webpackMode: "eager" */ '../../data/synaraClient.lynx'
        );
        return browseFilesystem({ partialPath }).catch(() => null);
      }}
      filesystemBrowseEnabled
      appearanceEnabled
      />
      <FeedbackDialogLynx
        activeThreadId={props.activeThreadId}
        open={feedbackOpen}
        fallbackContext={feedbackContext}
        onOpenChange={setFeedbackOpen}
      />
    </>
  );
}
