export type SidebarView = "threads" | "studio" | "workspace";

/** The optimistic segment follows a destination click and clears when the user returns. */
export function resolvePendingSidebarViewSelection(
  activeView: SidebarView,
  selectedView: SidebarView,
): SidebarView | null {
  return selectedView === activeView ? null : selectedView;
}
