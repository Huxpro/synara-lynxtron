export type SidebarPrimarySurface = "threads" | "studio";

export function resolveSidebarPrimarySurface(input: {
  readonly isOnStudio: boolean;
}): SidebarPrimarySurface {
  return input.isOnStudio ? "studio" : "threads";
}

export function isProjectsSidebarSurface(input: {
  readonly isOnSettings: boolean;
  readonly isOnStudio: boolean;
}): boolean {
  return !input.isOnSettings && !input.isOnStudio;
}
