// FILE: SidebarProjectsState.logic.ts
// Purpose: Portable loading/error/empty/ready state for the Projects sidebar section.
// Exports: Shared section-state resolver plus the legacy Web empty-state projection.

export type SidebarProjectsSectionState = "ready" | "loading" | "error" | "empty";
export type ProjectEmptyState = "loading" | "empty" | null;

export function resolveSidebarProjectsSectionState(input: {
  readonly loading: boolean;
  readonly error: boolean;
  readonly projectCount: number;
  readonly shouldShowProjectPathEntry?: boolean | undefined;
}): SidebarProjectsSectionState {
  if (input.projectCount > 0 || input.shouldShowProjectPathEntry) return "ready";
  if (input.loading) return "loading";
  if (input.error) return "error";
  return "empty";
}

// Keep Web's initial shell bootstrap visually distinct from a genuinely empty project list.
export function resolveProjectEmptyState(input: {
  readonly projectCount: number;
  readonly shouldShowProjectPathEntry: boolean;
  readonly threadsHydrated: boolean;
}): ProjectEmptyState {
  const state = resolveSidebarProjectsSectionState({
    loading: !input.threadsHydrated,
    error: false,
    projectCount: input.projectCount,
    shouldShowProjectPathEntry: input.shouldShowProjectPathEntry,
  });
  return state === "loading" || state === "empty" ? state : null;
}
