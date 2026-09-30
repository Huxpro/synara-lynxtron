// FILE: SidebarThreadRowComposition.tsx
// Purpose: Shared provider/subagent/terminal branching for sidebar thread rows.
// Exports: Host-neutral row-content composition with injectable host chrome.

import type { ReactNode } from "react";

import { SidebarThreadRowPresentation } from "./SidebarThreadRowPresentation";
import {
  SidebarThreadSubagentConnector,
  SidebarThreadSubagentIdentity,
  type SidebarSubagentThreadIdentityInput,
} from "./SidebarThreadSubagentIdentity";
import {
  SidebarThreadProviderIdentity,
  shouldShowSidebarThreadProviderIdentity,
} from "./SidebarThreadProviderIdentity";

export interface SidebarThreadRowCompositionThread extends SidebarSubagentThreadIdentityInput {
  readonly title: string;
}

export function SidebarThreadRowComposition({
  thread,
  provider,
  handoffSourceProvider,
  terminalEntryPoint,
  terminalLeading,
  providerLeading,
  subagentLeading,
  subagentTitle,
  isActive,
  variant,
  subagentIndentPx = 0,
  pendingStatusColorClass,
  titleTestId,
  suffix,
}: {
  readonly thread: SidebarThreadRowCompositionThread;
  readonly provider?: string | null | undefined;
  readonly handoffSourceProvider?: string | null | undefined;
  readonly terminalEntryPoint?: boolean | undefined;
  readonly terminalLeading?: ReactNode | undefined;
  readonly providerLeading?: ReactNode | undefined;
  readonly subagentLeading?: ReactNode | undefined;
  readonly subagentTitle?: ReactNode | undefined;
  readonly isActive: boolean;
  readonly variant: "pinned" | "standard";
  readonly subagentIndentPx?: number | undefined;
  readonly pendingStatusColorClass?: string | null | undefined;
  readonly titleTestId?: string | undefined;
  readonly suffix?: ReactNode | undefined;
}) {
  const isSubagentThread = Boolean(thread.parentThreadId);
  const showSubagentChrome = variant === "standard" && isSubagentThread;
  const showProviderAvatar = shouldShowSidebarThreadProviderIdentity(thread.title);

  const leading = showSubagentChrome
    ? (subagentLeading ?? (
        <SidebarThreadSubagentConnector thread={thread} indentPx={subagentIndentPx} />
      ))
    : terminalEntryPoint
      ? terminalLeading
      : showProviderAvatar
        ? (providerLeading ?? (
            <SidebarThreadProviderIdentity
              provider={provider}
              handoffSourceProvider={handoffSourceProvider}
            />
          ))
        : null;

  return (
    <SidebarThreadRowPresentation
      leading={leading}
      active={isActive}
      subagent={showSubagentChrome}
      pendingStatusColorClass={pendingStatusColorClass}
      titleTestId={titleTestId}
      title={
        isSubagentThread
          ? (subagentTitle ?? <SidebarThreadSubagentIdentity thread={thread} />)
          : thread.title
      }
      suffix={suffix}
    />
  );
}
