export interface LandingWorkspaceContext {
  readonly workspaceRoot: string;
  readonly worktreePath: string | null;
}

export function resolveLandingWorkspaceContext(input: {
  readonly containerKind: 'chat' | 'studio';
  readonly projectWorkspaceRoot: string;
  readonly studioFolderPath: string | null;
}): LandingWorkspaceContext {
  const studioFolderPath =
    input.containerKind === 'studio'
      ? input.studioFolderPath?.trim() || null
      : null;

  return {
    workspaceRoot: studioFolderPath ?? input.projectWorkspaceRoot,
    worktreePath: studioFolderPath,
  };
}
