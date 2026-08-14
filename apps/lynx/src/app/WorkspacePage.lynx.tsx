import { useEffect, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import {
  useWorkspaceStore,
  workspaceThreadId,
} from '@synara-web/workspaceStore';
import type { SettingsAppearanceValues } from '@synara-web/components/settings/SettingsAppearanceComposition.logic';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input.lynx';
import { fetchPluginLibraryServerConfig } from './queries';
import { ThreadTerminal } from './ThreadTerminal.lynx';
import { deleteWorkspaceWithTerminalCleanup } from './workspaceDeletion.logic';
import { platformTerminal } from '../platform/terminal';
import './workspace-page.css';

export function WorkspacePage({
  appearance,
  workspaceId,
  navigate,
}: {
  readonly appearance: Pick<
    SettingsAppearanceValues,
    'terminalFontFamily' | 'terminalFontSizePx'
  >;
  readonly workspaceId: string;
  readonly navigate: (to: string) => void;
}) {
  const workspacePages = useWorkspaceStore((state) => state.workspacePages);
  const workspace = workspacePages.find((entry) => entry.id === workspaceId);
  const fallbackWorkspaceId = workspacePages[0]?.id ?? null;
  const ensureWorkspacePage = useWorkspaceStore(
    (state) => state.ensureWorkspacePage
  );
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);
  const [renaming, setRenaming] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [draftTitle, setDraftTitle] = useState(workspace?.title ?? 'Workspace');
  const { data: serverConfig } = useQuery({
    queryKey: ['server-config'],
    queryFn: fetchPluginLibraryServerConfig,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (workspace) return;
    if (fallbackWorkspaceId) {
      navigate(`/workspace/${fallbackWorkspaceId}`);
      return;
    }
    ensureWorkspacePage(workspaceId);
  }, [
    ensureWorkspacePage,
    fallbackWorkspaceId,
    navigate,
    workspace,
    workspaceId,
  ]);

  useEffect(() => {
    if (workspace && !renaming) setDraftTitle(workspace.title);
  }, [renaming, workspace?.title]);

  if (!workspace) {
    return (
      <view className="WorkspacePage WorkspacePageState">
        <text className="WorkspacePageStateTitle">Opening workspace…</text>
      </view>
    );
  }

  const commitRename = () => {
    'background only';
    renameWorkspace(workspace.id, draftTitle);
    setRenaming(false);
  };
  const removeWorkspace = async () => {
    'background only';
    await deleteWorkspaceWithTerminalCleanup({
      workspaceId: workspace.id,
      closeTerminal: platformTerminal.close,
      deleteWorkspace,
      writeTerminalExit: platformTerminal.write,
    });
    const nextWorkspaceId = useWorkspaceStore.getState().workspacePages[0]?.id;
    navigate(nextWorkspaceId ? `/workspace/${nextWorkspaceId}` : '/');
  };

  return (
    <view className="WorkspacePage">
      <view className="WorkspacePageHeader AppWindowDragRegion">
        {renaming ? (
          <Input
            nativeInput
            className="WorkspacePageTitleInput"
            accessibility-label="Workspace name"
            value={draftTitle}
            onInput={setDraftTitle}
            onConfirm={commitRename}
            onBlur={commitRename}
          />
        ) : (
          <Button
            className="WorkspacePageTitleButton"
            variant="ghost"
            onClick={() => setRenaming(true)}
          >
            {workspace.title}
          </Button>
        )}
        <view className="WorkspacePageHeaderSpacer" />
        <Button
          variant="outline"
          size="xs"
          onClick={() => setTerminalOpen(true)}
        >
          Terminal
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => void removeWorkspace()}
        >
          Delete workspace
        </Button>
      </view>
      {serverConfig?.homeDir && terminalOpen ? (
        <ThreadTerminal
          autoOpen
          fontFamily={appearance.terminalFontFamily}
          fontSizePx={appearance.terminalFontSizePx}
          open
          presentationMode="workspace"
          terminalId="default"
          threadId={workspaceThreadId(workspace.id)}
          workspaceRoot={serverConfig.homeDir}
          onOpenChange={setTerminalOpen}
        />
      ) : serverConfig?.homeDir ? (
        <view className="WorkspacePageState">
          <text className="WorkspacePageStateTitle">
            This workspace has no open terminals
          </text>
          <text className="WorkspacePageStateCopy">
            Open a fresh terminal rooted in your home directory and start from
            there.
          </text>
          <Button
            className="WorkspacePageStateAction"
            onClick={() => setTerminalOpen(true)}
          >
            New terminal
          </Button>
        </view>
      ) : (
        <view className="WorkspacePageState">
          <text className="WorkspacePageStateTitle">Loading workspace</text>
          <text className="WorkspacePageStateCopy">
            Waiting for the renderer to resolve your home directory.
          </text>
        </view>
      )}
    </view>
  );
}
