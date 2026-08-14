import {
  getWorkspaceLayoutPresetSlotCount,
  type WorkspaceLayoutPresetId,
} from '@synara-web/workspaceTerminalLayoutPresets';

const WORKSPACE_TERMINAL_IDS = [
  'default',
  'workspace-2',
  'workspace-3',
  'workspace-4',
] as const;

export function workspaceTerminalIdsForPreset(
  presetId: WorkspaceLayoutPresetId
): readonly string[] {
  return WORKSPACE_TERMINAL_IDS.slice(
    0,
    getWorkspaceLayoutPresetSlotCount(presetId)
  );
}
