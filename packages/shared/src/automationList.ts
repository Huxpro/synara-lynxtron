import type {
  AutomationDefinition,
  AutomationListResult,
  AutomationRun,
  AutomationSchedule,
} from "@synara/contracts";

export interface AutomationListProject {
  readonly id: string;
  readonly name: string;
}

export interface AutomationListThread {
  readonly id: string;
  readonly title: string;
}

export interface AutomationDefinitionRow {
  readonly definition: AutomationDefinition;
  readonly detail: string;
  readonly latestRun: AutomationRun | null;
  readonly meta: string;
  readonly tone: "active" | "attention" | "live" | "muted";
}

export interface AutomationTriageRow {
  readonly definition: AutomationDefinition | null;
  readonly detail: string;
  readonly meta: string;
  readonly run: AutomationRun;
  readonly title: string;
}

export interface AutomationListProjection {
  readonly allTriage: readonly AutomationTriageRow[];
  readonly current: readonly AutomationDefinitionRow[];
  readonly paused: readonly AutomationDefinitionRow[];
  readonly triage: readonly AutomationTriageRow[];
  readonly unreadTriageCount: number;
}

function formatClockTime(timeOfDay: string): string {
  const [hours, minutes] = timeOfDay.split(":");
  const hour = Number.parseInt(hours ?? "", 10);
  return Number.isNaN(hour) ? timeOfDay : `${hour}:${minutes ?? "00"}`;
}

function weekdayLabel(value: number): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][value] ?? "Sun";
}

export function formatAutomationCadence(schedule: AutomationSchedule): string {
  switch (schedule.type) {
    case "manual":
      return "Manual";
    case "once":
      return new Date(schedule.runAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    case "interval": {
      const minutes = schedule.everySeconds / 60;
      if (Number.isInteger(minutes)) {
        return `Every ${minutes} minute${minutes === 1 ? "" : "s"}`;
      }
      return `Every ${schedule.everySeconds} seconds`;
    }
    case "daily":
      return `Daily at ${formatClockTime(schedule.timeOfDay)}`;
    case "weekdays":
      return `Weekdays at ${formatClockTime(schedule.timeOfDay)}`;
    case "weekly":
      return `${weekdayLabel(schedule.dayOfWeek)} at ${formatClockTime(schedule.timeOfDay)}`;
    case "cron":
      return `Cron ${schedule.expression}`;
  }
}

export function automationRunStatusLabel(status: AutomationRun["status"]): string {
  switch (status) {
    case "pending":
      return "Queued";
    case "claimed":
      return "Starting";
    case "running":
      return "Running";
    case "waiting-for-approval":
      return "Waiting for approval";
    case "succeeded":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "interrupted":
      return "Interrupted";
    case "skipped":
      return "Skipped";
  }
}

export function automationRunResultSummary(run: AutomationRun): string {
  if (run.result?.summary) return run.result.summary;
  if (run.error) return run.error;
  switch (run.result?.outcome) {
    case "findings":
      return "Found something to review";
    case "no-findings":
      return "No findings";
    case "changed-files":
      return "Changed files";
    case "needs-attention":
      return "Needs attention";
    case "unknown":
      return run.threadId ? "Completed; open the thread for the reply" : "Completed";
    case undefined:
      return automationRunStatusLabel(run.status);
  }
}

export function isAutomationTriageRun(run: AutomationRun): boolean {
  if (run.result) {
    return run.result.unread && run.result.archivedAt === null;
  }
  return (
    run.status === "failed" ||
    run.status === "cancelled" ||
    run.status === "interrupted" ||
    run.status === "waiting-for-approval"
  );
}

export function isVisibleAutomationTriageRun(run: AutomationRun): boolean {
  return run.result ? run.result.archivedAt === null : isAutomationTriageRun(run);
}

function formatRelativeTime(iso: string | null, nowMs: number): string {
  if (!iso) return "";
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return "";
  const seconds = Math.max(0, Math.round((nowMs - time) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return weeks < 4 ? `${weeks}w` : `${Math.floor(days / 30)}mo`;
}

function latestRunsByAutomationId(runs: readonly AutomationRun[]): Map<string, AutomationRun> {
  const latest = new Map<string, AutomationRun>();
  for (const run of runs) {
    const existing = latest.get(run.automationId);
    if (!existing || run.createdAt > existing.createdAt) latest.set(run.automationId, run);
  }
  return latest;
}

export function projectAutomationList(input: {
  readonly data: AutomationListResult;
  readonly projects: readonly AutomationListProject[];
  readonly threads: readonly AutomationListThread[];
  readonly nowMs?: number;
}): AutomationListProjection {
  const nowMs = input.nowMs ?? Date.now();
  const projects = new Map(input.projects.map((project) => [project.id, project.name]));
  const threads = new Map(input.threads.map((thread) => [thread.id, thread.title]));
  const definitions = new Map(
    input.data.definitions.map((definition) => [definition.id, definition])
  );
  const latestRuns = latestRunsByAutomationId(input.data.runs);

  const detail = (definition: AutomationDefinition): string => {
    const source =
      definition.sourceThreadId && definition.sourceThreadId !== definition.targetThreadId
        ? threads.get(definition.sourceThreadId)
        : null;
    const suffix = source ? ` · From ${source}` : "";
    if (definition.mode === "heartbeat") {
      const target = definition.targetThreadId
        ? threads.get(definition.targetThreadId)
        : null;
      return `Heartbeat · ${target ?? projects.get(definition.projectId) ?? "Unknown project"}${suffix}`;
    }
    return `${projects.get(definition.projectId) ?? "Unknown project"}${suffix}`;
  };

  const definitionRow = (definition: AutomationDefinition): AutomationDefinitionRow => {
    const latestRun = latestRuns.get(definition.id) ?? null;
    const live =
      latestRun?.status === "pending" ||
      latestRun?.status === "claimed" ||
      latestRun?.status === "running" ||
      latestRun?.status === "waiting-for-approval";
    const attention = latestRun ? isAutomationTriageRun(latestRun) : false;
    return {
      definition,
      detail: detail(definition),
      latestRun,
      meta: live
        ? automationRunStatusLabel(latestRun.status)
        : attention
          ? latestRun.status === "succeeded" && latestRun.result?.unread
            ? "New result"
            : automationRunStatusLabel(latestRun.status)
          : definition.enabled
            ? formatAutomationCadence(definition.schedule)
            : definition.schedule.type === "once"
              ? "Done"
              : "Paused",
      tone: !definition.enabled ? "muted" : live ? "live" : attention ? "attention" : "active",
    };
  };

  const triageRows = (runs: readonly AutomationRun[]) =>
    runs
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((run): AutomationTriageRow => {
      const definition = definitions.get(run.automationId) ?? null;
      return {
        definition,
        detail: automationRunResultSummary(run) || (definition ? detail(definition) : "Saved run"),
        meta: formatRelativeTime(run.finishedAt ?? run.startedAt ?? run.scheduledFor, nowMs),
        run,
        title: definition?.name ?? "Automation run",
      };
    });
  const triage = triageRows(input.data.runs.filter(isAutomationTriageRun));

  return {
    allTriage: triageRows(input.data.runs.filter(isVisibleAutomationTriageRun)),
    current: input.data.definitions.filter((definition) => definition.enabled).map(definitionRow),
    paused: input.data.definitions.filter((definition) => !definition.enabled).map(definitionRow),
    triage,
    unreadTriageCount: triage.length,
  };
}
