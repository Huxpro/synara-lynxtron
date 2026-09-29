import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";

import { SIDEBAR_TRAILING_ICON_CLASS } from "./sidebarGlyphs";
import { ThreadRunningSpinner } from "./ThreadRunningSpinner";

export function SidebarThreadStatusCompletedElement({
  colorClass,
}: {
  readonly colorClass: string;
}) {
  return (
    <CentralIcon
      name="circle-check"
      variant="fill"
      className={cn(SIDEBAR_TRAILING_ICON_CLASS, colorClass)}
    />
  );
}

export function SidebarThreadStatusRunningElement({ label }: { readonly label: string }) {
  return (
    <span aria-label={label}>
      <ThreadRunningSpinner />
    </span>
  );
}

export function SidebarThreadStatusDotElement({
  label,
  dotClass,
}: {
  readonly label: string;
  readonly colorClass: string;
  readonly dotClass: string;
}) {
  return <span aria-label={label} className={cn("size-1.5 shrink-0 rounded-full", dotClass)} />;
}
