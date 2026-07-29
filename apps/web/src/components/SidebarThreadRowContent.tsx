// FILE: SidebarThreadRowContent.tsx
// Purpose: Owns the shared identity and status content rendered by every Sidebar thread row.
// Exports: SidebarThreadRowContent and its terminal-status presentation type.

import { useMemo, type ReactNode } from "react";

import { pluralize } from "@synara/shared/text";

import { createThreadSelector } from "../storeSelectors";
import { useStore } from "../store";
import { resolveThreadHandoffBadgeLabel } from "../lib/threadHandoff";
import { resolveSubagentPresentationForThread } from "../lib/subagentPresentation";
import type { SidebarThreadSummary } from "../types";
import { TerminalIcon } from "../lib/icons";
import { cn } from "../lib/utils";
import { SidebarGlyph } from "./sidebarGlyphs";
import { SidebarThreadSubagentIdentity } from "./SidebarThreadSubagentIdentity";
import {
  SidebarThreadProviderIdentity,
} from "./SidebarThreadProviderIdentity";
import { SidebarThreadRowComposition } from "./SidebarThreadRowComposition";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./ui/tooltip";

export interface SidebarThreadTerminalStatus {
  label: "Terminal input needed" | "Terminal task completed" | "Terminal process running";
  colorClass: string;
  pulse: boolean;
}

function ProviderAvatarWithTerminal({
  thread,
  terminalStatus,
  terminalCount,
}: {
  thread: SidebarThreadSummary;
  terminalStatus: SidebarThreadTerminalStatus | null;
  terminalCount: number;
}) {
  const provider = thread.session?.provider ?? thread.modelSelection.provider;
  const handoffSourceProvider = thread.handoff?.sourceProvider ?? null;
  const handoffTooltip = resolveThreadHandoffBadgeLabel(thread);
  const showBadge = terminalCount > 1 || terminalStatus !== null;
  const badgeTooltip =
    terminalCount > 1
      ? `${terminalCount} ${pluralize(terminalCount, "terminal")} open`
      : (terminalStatus?.label ?? "Terminal open");
  const badgeColorClass = terminalStatus?.colorClass ?? "text-muted-foreground/55";

  const hasHandoff = Boolean(handoffSourceProvider);
  const avatarNode = (
    <SidebarThreadProviderIdentity
      provider={provider}
      handoffSourceProvider={handoffSourceProvider}
    />
  );

  const wrappedAvatar =
    hasHandoff && handoffTooltip ? (
      <Tooltip>
        <TooltipTrigger render={avatarNode} />
        <TooltipPopup side="top">{handoffTooltip}</TooltipPopup>
      </Tooltip>
    ) : (
      avatarNode
    );

  return (
    <span className="relative inline-flex shrink-0 items-center">
      {wrappedAvatar}
      {showBadge ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                aria-label={badgeTooltip}
                className="sidebar-icon-chip absolute -top-1.5 -right-1.5 inline-flex size-3 min-w-3 items-center justify-center rounded-full px-px"
              >
                {terminalCount > 1 ? (
                  <span
                    className={cn(
                      "text-[8px] font-semibold leading-none tabular-nums",
                      badgeColorClass,
                    )}
                  >
                    {terminalCount}
                  </span>
                ) : (
                  <TerminalIcon className={cn("size-2.5", badgeColorClass)} />
                )}
              </span>
            }
          />
          <TooltipPopup side="top">{badgeTooltip}</TooltipPopup>
        </Tooltip>
      ) : null}
    </span>
  );
}

function SidebarSubagentLabel({
  thread,
  roleClassName,
}: {
  thread: SidebarThreadSummary;
  roleClassName?: string | undefined;
}) {
  const selectParentThread = useMemo(
    () => createThreadSelector(thread.parentThreadId ?? null),
    [thread.parentThreadId],
  );
  const parentThread = useStore(selectParentThread);
  const presentation = resolveSubagentPresentationForThread({
    thread,
    threads: parentThread ? [parentThread] : undefined,
  });

  return (
    <SidebarThreadSubagentIdentity
      thread={thread}
      presentation={presentation}
      supportingClassName={cn("ml-1 text-muted-foreground/48", roleClassName)}
    />
  );
}

export function SidebarThreadRowContent({
  thread,
  terminalEntryPoint,
  terminalStatus,
  terminalCount,
  isActive,
  variant,
  subagentIndentPx = 0,
  pendingStatusColorClass,
  suffix,
}: {
  thread: SidebarThreadSummary;
  terminalEntryPoint: boolean;
  terminalStatus: SidebarThreadTerminalStatus | null;
  terminalCount: number;
  isActive: boolean;
  variant: "pinned" | "standard";
  subagentIndentPx?: number;
  pendingStatusColorClass?: string | null | undefined;
  suffix?: ReactNode;
}) {
  return (
    <SidebarThreadRowComposition
      thread={thread}
      provider={thread.session?.provider ?? thread.modelSelection.provider}
      handoffSourceProvider={thread.handoff?.sourceProvider}
      terminalEntryPoint={terminalEntryPoint}
      terminalLeading={<SidebarGlyph icon={TerminalIcon} variant="chrome" />}
      providerLeading={
        <ProviderAvatarWithTerminal
          thread={thread}
          terminalStatus={terminalStatus}
          terminalCount={terminalCount}
        />
      }
      subagentTitle={
        <SidebarSubagentLabel
          thread={thread}
          roleClassName={variant === "standard" ? "text-muted-foreground/42" : undefined}
        />
      }
      isActive={isActive}
      variant={variant}
      subagentIndentPx={subagentIndentPx}
      pendingStatusColorClass={pendingStatusColorClass}
      titleTestId={variant === "pinned" ? `thread-title-${thread.id}` : undefined}
      suffix={suffix}
    />
  );
}
