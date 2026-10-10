// FILE: sidebar/sidebarStatusGlyph.logic.ts
// Purpose: The accessible name upstream's `SidebarStatusTrailingGlyph` gives a thread status
//   in the sidebar's trailing slot, and the status as the shared trailing cluster takes it.
// Layer: Lynx sidebar logic

import type { ThreadStatusPill } from "@synara-web/components/Sidebar.logic";
import type { SidebarThreadStatusPresentation } from "@synara-web/components/SidebarThreadStatusIndicator";

export const SNOOZE_REMINDER_GLYPH_LABEL = "Snooze reminder";
export const IN_BACKGROUND_GLYPH_LABEL_PREFIX = "In background";

/** Upstream's label for the glyph: the status label, except Reminder and In Background. */
export function sidebarStatusGlyphLabel(
  status: Pick<ThreadStatusPill, "label" | "backgroundTaskCount">,
): string {
  if (status.label === "Reminder") return SNOOZE_REMINDER_GLYPH_LABEL;
  if (status.label === "In Background") {
    const count = status.backgroundTaskCount ?? 0;
    return count > 0
      ? `${IN_BACKGROUND_GLYPH_LABEL_PREFIX} · ${count} ${count === 1 ? "task" : "tasks"}`
      : IN_BACKGROUND_GLYPH_LABEL_PREFIX;
  }
  return status.label;
}

/**
 * The status for `SidebarThreadTrailingCluster`. The shared indicator hands its element only
 * the label, so the glyph's accessible name (which carries the background task count)
 * travels in it; the Lynx status elements pick the glyph from that name.
 */
export function sidebarTrailingClusterStatus(
  status: ThreadStatusPill | null | undefined,
): SidebarThreadStatusPresentation | null {
  if (!status) return null;
  return {
    label: sidebarStatusGlyphLabel(status) as SidebarThreadStatusPresentation["label"],
    colorClass: status.colorClass,
    dotClass: status.dotClass,
    pulse: status.pulse,
  };
}

/**
 * Upstream's thread rows (components/Sidebar.tsx): a thread waiting on an approval shows
 * a "Pending" word after its title, in the status' tone.
 */
export function sidebarPendingApprovalColorClass(
  status: Pick<ThreadStatusPill, "label" | "colorClass"> | null | undefined,
): string | null {
  return status?.label === "Pending Approval" ? status.colorClass : null;
}
