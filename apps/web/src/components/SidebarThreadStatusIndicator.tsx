import {
  SidebarThreadStatusCompletedElement,
  SidebarThreadStatusDotElement,
  SidebarThreadStatusRunningElement,
} from "~/components/SidebarThreadStatusIndicatorElements";

export interface SidebarThreadStatusPresentation {
  readonly label:
    | "Pending Approval"
    | "Awaiting Input"
    | "Working"
    | "Connecting"
    | "Plan Ready"
    | "Completed"
    // Upstream statuses the shared indicator shows with its default glyph until ported.
    | "Preparing worktree"
    | "In Background"
    | "Reminder";
  readonly colorClass: string;
  readonly dotClass: string;
  readonly pulse: boolean;
}

export function SidebarThreadStatusIndicator({
  status,
}: {
  readonly status: SidebarThreadStatusPresentation;
}) {
  if (status.label === "Completed") {
    return <SidebarThreadStatusCompletedElement colorClass={status.colorClass} />;
  }
  if (status.pulse) {
    return <SidebarThreadStatusRunningElement label={status.label} />;
  }
  return (
    <SidebarThreadStatusDotElement
      label={status.label}
      colorClass={status.colorClass}
      dotClass={status.dotClass}
    />
  );
}
