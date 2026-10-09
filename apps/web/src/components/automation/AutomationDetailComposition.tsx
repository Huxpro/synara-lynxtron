import type { ReactNode } from "react";

import { formatAutomationRunTimestamp } from "@synara/shared/automationList";

import {
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  CHAT_SURFACE_HEADER_HEIGHT_CLASS,
  CHAT_SURFACE_HEADER_PADDING_X_CLASS,
} from "~/components/chat/chatHeaderControls";
import { CHAT_BACKGROUND_CLASS_NAME } from "~/components/chat/composerPickerStyles";
import { RouteInsetSurface } from "~/components/RouteInsetSurface";
import { SidebarHeaderNavigationControls } from "~/components/SidebarHeaderNavigationControls";
import {
  useDesktopTopBarTrafficLightGutterClassName,
  useDesktopTopBarWindowControlsGutterClassName,
} from "~/hooks/useDesktopTopBarGutter";
import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";

export interface AutomationDetailStatus {
  readonly dotClassName: string;
  readonly label: string;
}

export function AutomationDetailComposition({
  actions,
  children,
  lastRunAt,
  name,
  nextRunAt,
  onBack,
  prompt,
  status,
}: {
  readonly actions: ReactNode;
  readonly children: ReactNode;
  readonly lastRunAt: string | null;
  readonly name: string;
  readonly nextRunAt: string | null;
  readonly onBack: () => void;
  readonly prompt: string;
  readonly status: AutomationDetailStatus;
}) {
  const trafficLightGutterClassName = useDesktopTopBarTrafficLightGutterClassName();
  const windowControlsGutterClassName = useDesktopTopBarWindowControlsGutterClassName();
  return (
    <RouteInsetSurface>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden sm:flex-row",
          CHAT_BACKGROUND_CLASS_NAME,
        )}
      >
        <div className="flex h-[200px] min-h-0 min-w-0 shrink-0 flex-col overflow-hidden sm:h-auto sm:flex-1">
          <header
            className={cn(
              CHAT_SURFACE_HEADER_PADDING_X_CLASS,
              CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
              "drag-region",
              trafficLightGutterClassName,
            )}
          >
            <div
              className={cn("flex items-center gap-2 sm:gap-3", CHAT_SURFACE_HEADER_HEIGHT_CLASS)}
            >
              <SidebarHeaderNavigationControls />
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-ui [-webkit-app-region:no-drag]">
                <button
                  type="button"
                  onClick={onBack}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  Automations
                </button>
                <CentralIcon
                  name="chevron-right-small"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
                <span className="truncate font-heading font-medium">{name}</span>
              </div>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-8">
            <div className="max-w-3xl space-y-4">
              <h1 className="font-heading text-2xl font-normal text-foreground">{name}</h1>
              <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-muted-foreground">
                {prompt}
              </p>
            </div>
          </main>
        </div>
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden sm:w-80 sm:flex-none">
          <header
            className={cn(
              CHAT_SURFACE_HEADER_PADDING_X_CLASS,
              CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
              "drag-region",
              windowControlsGutterClassName,
            )}
          >
            <div
              className={cn(
                "flex items-center justify-end gap-2 sm:gap-3",
                CHAT_SURFACE_HEADER_HEIGHT_CLASS,
              )}
            >
              <div className="flex shrink-0 items-center gap-1 [-webkit-app-region:no-drag]">
                {actions}
              </div>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--app-surface-divider)] sm:border-l sm:border-t-0">
            <div className="flex flex-col gap-6 px-4 py-8">
              <AutomationDetailGroup title="Status">
                <AutomationDetailRow label="Status">
                  <AutomationDetailStatusValue>
                    <span className={cn("size-1.5 rounded-full", status.dotClassName)} />
                    {status.label}
                  </AutomationDetailStatusValue>
                </AutomationDetailRow>
                <AutomationDetailRow label="Next run">
                  {nextRunAt ? (
                    <AutomationDetailStatusValue tone="muted">
                      {formatAutomationRunTimestamp(nextRunAt)}
                    </AutomationDetailStatusValue>
                  ) : (
                    "—"
                  )}
                </AutomationDetailRow>
                <AutomationDetailRow label="Last ran">
                  {lastRunAt ? (
                    <AutomationDetailStatusValue tone="muted">
                      {formatAutomationRunTimestamp(lastRunAt)}
                    </AutomationDetailStatusValue>
                  ) : (
                    "—"
                  )}
                </AutomationDetailRow>
              </AutomationDetailGroup>
              {children}
            </div>
          </div>
        </div>
      </div>
    </RouteInsetSurface>
  );
}

export function AutomationDetailGroup({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="space-y-0.5">
      <h2 className="px-1.5 pb-1 text-ui font-medium text-muted-foreground/70">{title}</h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

export function AutomationDetailRow({
  label,
  children,
}: {
  readonly label: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1.5 text-ui">
      <span className="flex shrink-0 items-center gap-1 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-foreground">{children}</span>
    </div>
  );
}

function AutomationDetailStatusValue({
  tone = "default",
  children,
}: {
  readonly tone?: "default" | "muted" | undefined;
  readonly children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        tone === "muted" ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {children}
    </span>
  );
}
