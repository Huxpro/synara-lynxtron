export type SidebarView = "threads" | "studio";

export interface SidebarSurfacePickerCopy {
  readonly title: string;
  readonly description: string;
}

/** Title and one-line description for each sidebar surface in the header picker. */
export const SIDEBAR_SURFACE_PICKER_COPY: Readonly<Record<SidebarView, SidebarSurfacePickerCopy>> =
  {
    threads: { title: "Synara", description: "Build, debug, and ship" },
    studio: { title: "Studio", description: "Open-ended agent work" },
  };

/** Surfaces offered by the picker, in menu order. Studio is listed only while it is visible. */
export function resolveSidebarSurfacePickerViews(studioVisible: boolean): SidebarView[] {
  return studioVisible ? ["threads", "studio"] : ["threads"];
}
