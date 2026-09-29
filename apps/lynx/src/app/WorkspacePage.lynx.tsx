import { useEffect, useInitData, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore, workspaceThreadId } from "@synara-web/workspaceStore";
import {
  WORKSPACE_LAYOUT_PRESETS,
  type WorkspaceLayoutPresetId,
} from "@synara-web/workspaceTerminalLayoutPresets";
import type { SettingsAppearanceValues } from "@synara-web/components/settings/SettingsAppearanceComposition.logic";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input.lynx";
import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../components/ui/dialog.lynx";
import { fetchPluginLibraryServerConfig } from "./queries";
import { ThreadTerminal } from "./ThreadTerminal.lynx";
import { deleteWorkspaceWithTerminalCleanup } from "./workspaceDeletion.logic";
import { platformTerminal } from "../platform/terminal";
import { workspaceTerminalIdsForPreset } from "./workspaceLayout.logic";
import { PlusIcon, SettingsIcon, Trash2 } from "../lib/icons.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import "./workspace-page.css";

export function WorkspacePage({
  appearance,
  workspaceId,
  navigate,
}: {
  readonly appearance: Pick<SettingsAppearanceValues, "terminalFontFamily" | "terminalFontSizePx">;
  readonly workspaceId: string;
  readonly navigate: (to: string) => void;
}) {
  const { svgColors } = useTheme();
  const workspacePages = useWorkspaceStore((state) => state.workspacePages);
  const workspace = workspacePages.find((entry) => entry.id === workspaceId);
  const fallbackWorkspaceId = workspacePages[0]?.id ?? null;
  const ensureWorkspacePage = useWorkspaceStore((state) => state.ensureWorkspacePage);
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);
  const setWorkspaceLayoutPreset = useWorkspaceStore((state) => state.setWorkspaceLayoutPreset);
  const [renaming, setRenaming] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const initData = useInitData() as {
    readonly initialWorkspaceSettingsOpen?: unknown;
  };
  const [settingsOpen, setSettingsOpen] = useState(initData.initialWorkspaceSettingsOpen === true);
  const [draftTitle, setDraftTitle] = useState(workspace?.title ?? "Workspace");
  const { data: serverConfig } = useQuery({
    queryKey: ["server-config"],
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
  }, [ensureWorkspacePage, fallbackWorkspaceId, navigate, workspace, workspaceId]);

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
    "background only";
    renameWorkspace(workspace.id, draftTitle);
    setRenaming(false);
  };
  const terminalIds = workspaceTerminalIdsForPreset(workspace.layoutPresetId);
  const removeWorkspace = async () => {
    "background only";
    await deleteWorkspaceWithTerminalCleanup({
      workspaceId: workspace.id,
      terminalIds,
      closeTerminal: platformTerminal.close,
      deleteWorkspace,
      writeTerminalExit: platformTerminal.write,
    });
    const nextWorkspaceId = useWorkspaceStore.getState().workspacePages[0]?.id;
    navigate(nextWorkspaceId ? `/workspace/${nextWorkspaceId}` : "/");
  };

  return (
    <view className="WorkspacePage">
      <view className="WorkspacePageHeader AppWindowDragRegion chat-surface-divider">
        <view className="WorkspacePageTitleRow">
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
        </view>
        <view className="WorkspacePageHeaderSpacer" />
        <view className="WorkspacePageActions">
          <Button
            className="WorkspacePageHeaderAction"
            variant="outline"
            size="xs"
            aria-label="New terminal"
            onClick={() => setTerminalOpen(true)}
          >
            <PlusIcon
              className="WorkspacePageHeaderActionIcon"
              color={svgColors.foreground80}
              size={12}
            />
            <text className="LxButton__text WorkspacePageHeaderActionText">Terminal</text>
          </Button>
          <Button
            className="WorkspacePageHeaderAction"
            variant="outline"
            size="xs"
            aria-label="Workspace settings"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon
              className="WorkspacePageHeaderActionIcon"
              color={svgColors.foreground80}
              size={12}
            />
            <text className="LxButton__text WorkspacePageHeaderActionText">Settings</text>
          </Button>
          <Button
            className="WorkspacePageHeaderAction"
            variant="outline"
            size="xs"
            aria-label="Delete workspace"
            onClick={() => void removeWorkspace()}
          >
            <Trash2
              className="WorkspacePageHeaderActionIcon"
              color={svgColors.foreground80}
              size={12}
            />
            <text className="LxButton__text WorkspacePageHeaderActionText">Delete workspace</text>
          </Button>
        </view>
      </view>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogPopup className="WorkspaceSettingsDialog">
          <DialogTitle>Workspace settings</DialogTitle>
          <DialogDescription>
            Choose how terminals are arranged inside {workspace.title}.
          </DialogDescription>
          <DialogPanel className="WorkspaceSettingsPanel">
            <view className="WorkspaceSettingsIntro">
              <text className="WorkspaceSettingsLabel">Layout preset</text>
              <text className="WorkspaceSettingsCopy">
                Changes apply immediately. Extra terminals stay available as tabs.
              </text>
            </view>
            <view className="WorkspacePageLayoutChoices">
              {WORKSPACE_LAYOUT_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  className="WorkspaceSettingsPreset"
                  variant={workspace.layoutPresetId === preset.id ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() =>
                    setWorkspaceLayoutPreset(workspace.id, preset.id as WorkspaceLayoutPresetId)
                  }
                >
                  {preset.title} · {preset.slotCount} {preset.slotCount === 1 ? "pane" : "panes"}
                </Button>
              ))}
            </view>
          </DialogPanel>
        </DialogPopup>
      </Dialog>
      {serverConfig?.homeDir && terminalOpen ? (
        <view
          className={`WorkspaceTerminalGrid WorkspaceTerminalGrid--${workspace.layoutPresetId}`}
        >
          {terminalIds.map((terminalId, terminalIndex) => (
            <view
              key={terminalId}
              className={`WorkspaceTerminalPane${
                terminalIndex === 0 ? " WorkspaceTerminalPane--primary" : ""
              }`}
            >
              <ThreadTerminal
                active={terminalIndex === 0}
                autoOpen
                fontFamily={appearance.terminalFontFamily}
                fontSizePx={appearance.terminalFontSizePx}
                open
                presentationMode="workspace"
                terminalId={terminalId}
                threadId={workspaceThreadId(workspace.id)}
                workspaceRoot={serverConfig.homeDir}
                onOpenChange={(open) => {
                  if (!open && terminalIds.length === 1) {
                    setTerminalOpen(false);
                  }
                }}
              />
            </view>
          ))}
        </view>
      ) : serverConfig?.homeDir ? (
        <view className="WorkspacePageState">
          <text className="WorkspacePageStateTitle">This workspace has no open terminals</text>
          <text className="WorkspacePageStateCopy">
            Open a fresh terminal rooted in your home directory and start from there.
          </text>
          <Button className="WorkspacePageStateAction" onClick={() => setTerminalOpen(true)}>
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
