import { useState, type ReactNode } from "react";
import { resolveIndependentTabRowPresentation } from "@synara/shared/independentTabs";

import { IconButton } from "~/components/ui/icon-button";
import { ChevronLeftIcon, ChevronRightIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";

export function IndependentTabRow(props: {
  actionPlacement?: "start" | "end";
  actions: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  owner?: "chat" | "terminal-pane" | "terminal-groups";
  tabs: ReactNode;
  tabsClassName?: string;
}) {
  const [collapsed, setCollapsed] = useState(props.defaultCollapsed ?? false);
  const presentation = resolveIndependentTabRowPresentation(collapsed);
  const actionPlacement = props.actionPlacement ?? "end";
  const ToggleIcon =
    actionPlacement === "start"
      ? collapsed
        ? ChevronRightIcon
        : ChevronLeftIcon
      : collapsed
        ? ChevronLeftIcon
        : ChevronRightIcon;
  const actionLane = (
    <div className="flex shrink-0 items-center gap-0.5" data-independent-tab-actions>
      {presentation.showActions ? props.actions : null}
      <IconButton
        label={presentation.toggleLabel}
        title={presentation.toggleLabel}
        size="icon-xs"
        variant="chrome"
        className="size-6 shrink-0"
        onClick={() => setCollapsed((current) => !current)}
      >
        <ToggleIcon className="size-3.5" />
      </IconButton>
    </div>
  );

  return (
    <div
      className={cn("flex min-w-0 items-center gap-1", props.className)}
      data-tab-row-owner={props.owner}
      data-tab-row-mode={presentation.mode}
    >
      {actionPlacement === "start" ? actionLane : null}
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          props.tabsClassName,
        )}
        data-independent-tab-scroller
      >
        {props.tabs}
      </div>
      {actionPlacement === "end" ? actionLane : null}
    </div>
  );
}
