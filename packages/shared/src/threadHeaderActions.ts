export interface ThreadHeaderDiffTotals {
  readonly additions: number;
  readonly deletions: number;
  readonly hasChanges: boolean;
}

export interface ThreadHeaderActionStateInput {
  readonly diffDisabledReason: string | null;
  readonly diffOpen: boolean;
  readonly diffTotals: ThreadHeaderDiffTotals;
  readonly environmentEnabled: boolean;
  readonly hasProject: boolean;
  readonly hasProjectActionSurface: boolean;
  readonly isGitRepo: boolean;
  readonly gitActionsAvailable: boolean;
  readonly surface: {
    readonly kind: "thread" | "editor-rail";
    readonly layout: "single" | "split";
    readonly primary: "chat" | "terminal";
    readonly sidechat: boolean;
  };
}

export interface ThreadHeaderActionState {
  readonly diffDisabled: boolean;
  readonly diffStats: {
    readonly additions: number;
    readonly deletions: number;
  } | null;
  readonly showDiff: boolean;
  readonly showEnvironment: boolean;
  readonly showGitActions: boolean;
  readonly showHandoff: boolean;
  readonly showLegacyOpenIn: boolean;
  readonly showProjectActions: boolean;
  readonly showProviderUsage: boolean;
}

export function resolveThreadHeaderActionState(
  input: ThreadHeaderActionStateInput,
): ThreadHeaderActionState {
  const isEditorRail = input.surface.kind === "editor-rail";
  const suppressHandoffControls =
    isEditorRail || input.surface.primary === "terminal";
  const showEnvironment = input.environmentEnabled;
  const showDiff = !isEditorRail;

  return {
    diffDisabled:
      showDiff &&
      (!input.isGitRepo || (input.diffDisabledReason !== null && !input.diffOpen)),
    diffStats:
      showDiff && input.diffTotals.hasChanges
        ? {
            additions: input.diffTotals.additions,
            deletions: input.diffTotals.deletions,
          }
        : null,
    showDiff,
    showEnvironment,
    showGitActions:
      !showEnvironment && input.hasProject && input.gitActionsAvailable,
    showHandoff: !suppressHandoffControls,
    showLegacyOpenIn: !showEnvironment && input.hasProject,
    showProjectActions: input.hasProjectActionSurface,
    showProviderUsage: !suppressHandoffControls && !showEnvironment,
  };
}
