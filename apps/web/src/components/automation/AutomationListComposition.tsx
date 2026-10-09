import type { ReactNode } from "react";
import type { AutomationDefinition, AutomationRun, ThreadId } from "@synara/contracts";
import type {
  AutomationDefinitionRow,
  AutomationListProjection,
  AutomationTriageRow,
} from "@synara/shared/automationList";

import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";
import { isTriageRun, RunStatusIndicator } from "~/routes/-automations.shared";

// This composition predates Electron's redesigned automations list (row icons
// instead of status dots); it keeps the old dot until that design is ported.
function automationStatusDotClass(
  definition: AutomationDefinition,
  latestRun: AutomationRun | null,
): string {
  if (!definition.enabled) return "text-muted-foreground/40";
  if (
    latestRun?.status === "running" ||
    latestRun?.status === "pending" ||
    latestRun?.status === "claimed"
  ) {
    return "text-blue-500";
  }
  if (latestRun && isTriageRun(latestRun)) return "text-destructive";
  return "text-emerald-500";
}

function AutomationListRow({
  onClick,
  leading,
  title,
  detail,
  meta,
  trailing,
  onDelete,
}: {
  readonly onClick: () => void;
  readonly leading: ReactNode;
  readonly title: string;
  readonly detail: string;
  readonly meta?: ReactNode | undefined;
  readonly trailing?: ReactNode | undefined;
  readonly onDelete?: (() => void) | undefined;
}) {
  return (
    <div className="group flex w-full items-center rounded-md transition-colors hover:bg-[var(--color-background-elevated-secondary)]">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 px-2 py-2 text-left"
      >
        {leading}
        <span className="min-w-0 max-w-[45%] truncate text-[0.8125rem] text-foreground">
          {title}
        </span>
        <span className="min-w-0 flex-1 truncate text-ui text-muted-foreground">{detail}</span>
        {meta == null ? null : (
          <span className="shrink-0 text-ui tabular-nums text-muted-foreground">{meta}</span>
        )}
        {trailing}
      </button>
      {onDelete ? (
        <button
          type="button"
          aria-label="Delete automation"
          title="Delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          <CentralIcon name="trash-can-simple" className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function AutomationListComposition({
  definitionsCount,
  isLoading,
  projection,
  triageFilter,
  onDelete,
  onOpen,
  onOpenThread,
  onTriageFilterChange,
}: {
  readonly definitionsCount: number;
  readonly isLoading: boolean;
  readonly projection: AutomationListProjection;
  readonly triageFilter: "unread" | "all";
  readonly onDelete: (definition: AutomationDefinition) => void;
  readonly onOpen: (automationId: string) => void;
  readonly onOpenThread: (threadId: ThreadId) => void;
  readonly onTriageFilterChange: (filter: "unread" | "all") => void;
}) {
  const triageRows = triageFilter === "unread" ? projection.triage : projection.allTriage;
  const renderRow = (row: AutomationDefinitionRow) => {
    const { definition, latestRun } = row;
    return (
      <AutomationListRow
        key={definition.id}
        onClick={() => onOpen(definition.id)}
        leading={
          <span
            className={cn(
              "flex size-3.5 shrink-0 items-center justify-center",
              automationStatusDotClass(definition, latestRun),
            )}
          >
            <span className="block size-1.5 rounded-full bg-current" />
          </span>
        }
        title={definition.name}
        detail={row.detail}
        meta={row.meta}
        onDelete={() => onDelete(definition)}
      />
    );
  };
  const renderSection = (title: string, rows: readonly AutomationDefinitionRow[]) =>
    rows.length > 0 ? (
      <section className="flex flex-col gap-0.5">
        <h2 className="px-2 pb-1 text-ui font-medium text-foreground">{title}</h2>
        <div className="flex flex-col">{rows.map(renderRow)}</div>
      </section>
    ) : null;
  const renderTriageRow = (row: AutomationTriageRow) => (
    <AutomationListRow
      key={row.run.id}
      onClick={() => {
        if (row.definition) onOpen(row.definition.id);
        else if (row.run.threadId) onOpenThread(row.run.threadId);
      }}
      leading={<RunStatusIndicator status={row.run.status} />}
      title={row.title}
      detail={row.detail}
      meta={row.meta}
      trailing={
        <CentralIcon
          name="chevron-right-small"
          className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        />
      }
    />
  );
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-12 pt-8">
        <h1 className="px-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
          Automations
        </h1>
        {isLoading ? (
          <div className="py-16 text-center text-ui text-muted-foreground">
            Loading automations...
          </div>
        ) : definitionsCount === 0 ? (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-ui font-medium text-foreground">No automations yet</p>
            <p className="max-w-xs text-ui text-muted-foreground">
              Schedule a prompt to run on its own, or wake an existing thread on a loop.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {projection.allTriage.length > 0 ? (
              <section className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-3 px-2 pb-1">
                  <h2 className="text-ui font-medium text-foreground">Needs review</h2>
                  <div className="flex items-center gap-0.5 rounded-md bg-[var(--color-background-elevated-secondary)] p-0.5 text-ui">
                    {(["unread", "all"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onTriageFilterChange(value)}
                        className={cn(
                          "rounded px-2 py-0.5 transition-colors",
                          triageFilter === value
                            ? "bg-background text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {value === "unread"
                          ? `Unread ${projection.unreadTriageCount}`
                          : `All ${projection.allTriage.length}`}
                      </button>
                    ))}
                  </div>
                </div>
                {triageRows.length === 0 ? (
                  <div className="px-2 py-4 text-ui text-muted-foreground">No unread runs.</div>
                ) : (
                  <div className="flex flex-col">{triageRows.map(renderTriageRow)}</div>
                )}
              </section>
            ) : null}
            {renderSection("Current", projection.current)}
            {renderSection("Paused", projection.paused)}
          </div>
        )}
      </div>
    </main>
  );
}
