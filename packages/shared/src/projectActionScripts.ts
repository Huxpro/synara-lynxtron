import type { ProjectScript, ProjectScriptIcon } from '@synara/contracts';

export interface ProjectActionDraft {
  readonly command: string;
  readonly icon: ProjectScriptIcon;
  readonly name: string;
  readonly runOnWorktreeCreate: boolean;
}

function clearOtherSetupActions(
  scripts: readonly ProjectScript[],
  keepSetupActionId: string | null
): ProjectScript[] {
  return scripts.map((script) =>
    script.runOnWorktreeCreate && script.id !== keepSetupActionId
      ? { ...script, runOnWorktreeCreate: false }
      : script
  );
}

export function addProjectAction(
  scripts: readonly ProjectScript[],
  id: string,
  draft: ProjectActionDraft
): ProjectScript[] {
  const existing = draft.runOnWorktreeCreate
    ? clearOtherSetupActions(scripts, null)
    : [...scripts];
  return [...existing, { id, ...draft }];
}

export function updateProjectAction(
  scripts: readonly ProjectScript[],
  id: string,
  draft: ProjectActionDraft
): ProjectScript[] {
  const normalized = draft.runOnWorktreeCreate
    ? clearOtherSetupActions(scripts, id)
    : [...scripts];
  return normalized.map((script) =>
    script.id === id ? { ...script, ...draft } : script
  );
}

export function deleteProjectAction(
  scripts: readonly ProjectScript[],
  id: string
): ProjectScript[] {
  return scripts.filter((script) => script.id !== id);
}
