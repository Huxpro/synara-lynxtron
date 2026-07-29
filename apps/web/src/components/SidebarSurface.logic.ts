export type SidebarPrimarySurface = "threads" | "studio" | "workspace";

export function resolveSidebarPrimarySurface(input: {
  readonly isOnStudio: boolean;
  readonly isOnWorkspace: boolean;
}): SidebarPrimarySurface {
  return input.isOnWorkspace ? "workspace" : input.isOnStudio ? "studio" : "threads";
}

export function isProjectsSidebarSurface(input: {
  readonly isOnSettings: boolean;
  readonly isOnStudio: boolean;
  readonly isOnWorkspace: boolean;
}): boolean {
  return !input.isOnSettings && !input.isOnStudio && !input.isOnWorkspace;
}
