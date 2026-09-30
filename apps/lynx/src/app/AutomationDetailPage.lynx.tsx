import { useEffect, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import type {
  AutomationDefinition,
  AutomationRun,
  AutomationSchedule,
  AutomationUpdateInput,
  AutomationWorktreeMode,
} from "@synara/contracts";
import {
  formatAutomationRunTimestamp,
  projectAutomationDetail,
} from "@synara/shared/automationList";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input.lynx";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { ChevronRightIcon } from "../lib/icons";
import { Trash2 } from "../lib/icons.lynx";
import playSvg from "@synara-central-icons/play.svg?raw";
import pauseSvg from "@synara-central-icons/pause.svg?raw";
import { useTheme } from "../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { AutomationDialog } from "./AutomationDialog.lynx";
import type { ProjectSummary, ThreadSummary } from "./queries";
import { AutomationTimeInput } from "./AutomationTimeInput.lynx";
import { ComposerModelControl } from "../components/composer/ComposerModelControl.lynx";
import { fetchAutomationCreateModels, fetchAutomationCreateServerConfig } from "./queries";
import {
  SCHEDULE_KIND_OPTIONS,
  datetimeLocalFromIso,
  isoFromDatetimeLocal,
  providerOptionsForAutomationModelSelection,
  scheduleFromKind,
  scheduleKindFromSchedule,
  weekdayLabel,
} from "@synara-web/lib/automationForm";
import { completionPolicyFromStopWhen } from "@synara/shared/automationCompletionPolicy";
import { automationApprovalGaps } from "@synara-web/lib/automationDraft";

async function confirmAutomationDelete(name: string): Promise<boolean> {
  "background only";
  const { dialogs } = await import(/* webpackMode: "eager" */ "../platform/dialogs");
  return dialogs.confirm(`Delete "${name}"?`);
}

function DetailGroup({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <view className="AutomationDetailGroup">
      <text className="AutomationDetailGroupTitle">{title}</text>
      <view className="AutomationDetailGroupRows">{children}</view>
    </view>
  );
}

function DetailRow({
  label,
  value,
  children,
  compact = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly children?: React.ReactNode;
  readonly compact?: boolean;
}) {
  return (
    <view
      className={`AutomationDetailRow AutomationDetailRow--${
        compact || label === "Mode" ? "compact" : label === "Time" ? "time" : "control"
      }`}
    >
      <text className="AutomationDetailRowLabel">{label}</text>
      {children ?? <text className="AutomationDetailRowValue">{value}</text>}
    </view>
  );
}

function InlineDetailSelect(props: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly label: string; readonly value: string }[];
  readonly disabled?: boolean;
  readonly onChange: (value: string) => void;
}) {
  const selected = props.options.find((option) => option.value === props.value);
  return (
    <Menu>
      <MenuTrigger ariaLabel={props.label} disabled={props.disabled}>
        <Button
          className="AutomationDetailInlineControl"
          variant="ghost"
          size="sm"
          disabled={props.disabled}
          buttonProps={{ "accessibility-element": false }}
        >
          <text className="AutomationDetailInlineControlText">
            {selected?.label ?? props.value}
          </text>
          <ChevronRightIcon
            className="AutomationDetailInlineChevron"
            size={12}
            color="var(--color-icon-tertiary)"
          />
        </Button>
      </MenuTrigger>
      <MenuPopup align="end" className="AutomationDetailInlineMenu">
        <MenuRadioGroup value={props.value} onValueChange={props.onChange}>
          {props.options.map((option) => (
            <MenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}

function InlineDetailTextInput(props: {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly mono?: boolean;
  readonly placeholder?: string;
  readonly onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(props.value);
  useEffect(() => setDraft(props.value), [props.value]);
  const commit = (value: string) => {
    const normalized = value.trim();
    if (normalized && normalized !== props.value) props.onCommit(normalized);
  };
  return (
    <Input
      className={`AutomationDetailInlineInput${
        props.mono ? " AutomationDetailInlineInput--mono" : ""
      }`}
      nativeInput
      unstyled
      value={draft}
      placeholder={props.placeholder}
      aria-label={props.label}
      disabled={props.disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit(draft);
        else if (event.key === "Escape") setDraft(props.value);
      }}
    />
  );
}

const INTERVAL_OPTIONS = [
  { value: "900", label: "Every 15 min" },
  { value: "1800", label: "Every 30 min" },
  { value: "3600", label: "Every hour" },
  { value: "7200", label: "Every 2 hours" },
  { value: "21600", label: "Every 6 hours" },
  { value: "43200", label: "Every 12 hours" },
  { value: "86400", label: "Every 24 hours" },
] as const;

function intervalOptions(current: number) {
  if (INTERVAL_OPTIONS.some((option) => option.value === String(current))) {
    return INTERVAL_OPTIONS;
  }
  return [
    {
      value: String(current),
      label:
        current >= 60 && current % 60 === 0 ? `Every ${current / 60} min` : `Every ${current} sec`,
    },
    ...INTERVAL_OPTIONS,
  ];
}

function AutomationDetailModelControl(props: {
  readonly definition: AutomationDefinition;
  readonly project: ProjectSummary | undefined;
  readonly disabled: boolean;
  readonly onPatch: (input: AutomationUpdateInput) => void;
}) {
  const [catalogProvider, setCatalogProvider] = useState(props.definition.modelSelection.provider);
  useEffect(() => {
    setCatalogProvider(props.definition.modelSelection.provider);
  }, [props.definition.id, props.definition.modelSelection.provider]);
  const serverConfig = useQuery({
    queryKey: ["automation-detail", "server-config"],
    queryFn: fetchAutomationCreateServerConfig,
    staleTime: 30_000,
  });
  const modelCatalog = useQuery({
    queryKey: [
      "automation-detail",
      "models",
      catalogProvider,
      props.project?.workspaceRoot ?? null,
    ],
    queryFn: () =>
      fetchAutomationCreateModels({
        provider: catalogProvider,
        cwd: props.project?.workspaceRoot ?? null,
      }),
    enabled: Boolean(props.project),
    staleTime: 30_000,
  });
  return (
    <ComposerModelControl
      hideStatusLabel
      disabled={props.disabled}
      modelSelection={props.definition.modelSelection}
      catalogProvider={catalogProvider}
      runtimeModels={modelCatalog.data?.models ?? []}
      modelsLoading={modelCatalog.isPending || (modelCatalog.isFetching && !modelCatalog.data)}
      providers={serverConfig.data?.providers ?? []}
      onCatalogProviderChange={setCatalogProvider}
      onModelSelectionChange={(modelSelection) =>
        props.onPatch({
          id: props.definition.id,
          modelSelection,
          providerOptions: providerOptionsForAutomationModelSelection(
            props.definition,
            modelSelection,
          ),
        })
      }
    />
  );
}

export function AutomationDetailPage({
  automationId,
  definitions,
  runs,
  projects,
  threads,
  deleteError,
  deletePending,
  editOpen,
  onEdit,
  onEditOpenChange,
  onPatch,
  onDelete,
  updateError,
  updatePending,
  onToggleEnabled,
  runNowError,
  runNowPending,
  onRunNow,
  onApproveRisks,
  navigate,
}: {
  readonly automationId: string;
  readonly definitions: readonly AutomationDefinition[];
  readonly runs: readonly AutomationRun[];
  readonly projects: readonly ProjectSummary[];
  readonly threads: readonly ThreadSummary[];
  readonly deleteError: string | null;
  readonly deletePending: boolean;
  readonly editOpen: boolean;
  readonly onEdit: (input: AutomationUpdateInput) => void;
  readonly onEditOpenChange: (open: boolean) => void;
  readonly onPatch: (input: AutomationUpdateInput) => void;
  readonly onDelete: (definition: AutomationDefinition) => void;
  readonly updateError: string | null;
  readonly updatePending: boolean;
  readonly onToggleEnabled: (definition: AutomationDefinition) => void;
  readonly runNowError: string | null;
  readonly runNowPending: boolean;
  readonly onRunNow: (definition: AutomationDefinition) => void;
  readonly onApproveRisks: (
    definition: AutomationDefinition,
    acknowledgedRisks: AutomationDefinition["acknowledgedRisks"],
    maxIterations: number | undefined,
    runAfter: boolean,
  ) => Promise<void>;
  readonly navigate: (to: string) => void;
}) {
  const { semanticIconColor } = useTheme();
  const definition = definitions.find((candidate) => candidate.id === automationId) ?? null;
  if (!definition) {
    return (
      <view className="AutomationDetailNotFoundPage">
        <view className="AutomationDetailNotFoundHeader AppWindowDragRegion chat-surface-divider">
          <text className="AutomationDetailNotFoundHeaderTitle">Automations</text>
        </view>
        <view className="AutomationDetailNotFound">
          <text className="AutomationDetailNotFoundText">Automation not found.</text>
          <Button variant="outline" size="sm" onClick={() => navigate("/automations")}>
            Back to automations
          </Button>
        </view>
      </view>
    );
  }
  const projectName =
    projects.find((project) => project.id === definition.projectId)?.title ?? "Unknown project";
  const selectedProject = projects.find((project) => project.id === definition.projectId);
  const targetThreadTitle = definition.targetThreadId
    ? threads.find((thread) => thread.id === definition.targetThreadId)?.title
    : null;
  const detail = projectAutomationDetail({
    definition,
    projectName,
    runs: runs.filter((run) => run.automationId === definition.id),
    targetThreadTitle,
  });
  const schedule = definition.schedule;
  const approvalGaps = automationApprovalGaps({
    schedule: definition.schedule,
    enabled: definition.enabled,
    maxIterations: definition.maxIterations,
    mode: definition.mode,
    runtimeMode: definition.runtimeMode,
    worktreeMode: definition.worktreeMode,
    prompt: definition.prompt,
    acknowledgedRisks: definition.acknowledgedRisks,
  });
  const maxIterationOptions = [null, 10, 25, 50, 100, 250].map((value) => ({
    value: value === null ? "" : String(value),
    label: value === null ? "Unlimited" : `${value} runs`,
  }));
  if (
    definition.maxIterations !== null &&
    !maxIterationOptions.some((option) => option.value === String(definition.maxIterations))
  ) {
    maxIterationOptions.unshift({
      value: String(definition.maxIterations),
      label: `${definition.maxIterations} runs`,
    });
  }

  return (
    <view className="AutomationDetailPage">
      <view className="AutomationDetailMain">
        <view className="AutomationDetailHeader AppWindowDragRegion chat-surface-divider">
          <view
            className="AutomationDetailBreadcrumb"
            accessibility-element={true}
            accessibility-label="Back to automations"
            accessibility-trait="button"
            focusable={true}
            bindtap={() => navigate("/automations")}
          >
            <text className="AutomationDetailBreadcrumbParent">Automations</text>
            <ChevronRightIcon size={14} color="var(--muted-foreground)" />
            <text className="AutomationDetailBreadcrumbCurrent">{definition.name}</text>
          </view>
        </view>
        <scroll-view className="AutomationDetailPromptScroller" scroll-orientation="vertical">
          <view className="AutomationDetailPrompt">
            <text className="AutomationDetailTitle">{definition.name}</text>
            <text className="AutomationDetailPromptText">{definition.prompt}</text>
          </view>
        </scroll-view>
      </view>
      <view className="AutomationDetailAside">
        <view className="AutomationDetailActionsHeader AppWindowDragRegion chat-surface-divider">
          {definition.schedule.type === "once" ? null : (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={updatePending}
              aria-label={definition.enabled ? "Pause" : "Resume"}
              onClick={() => onToggleEnabled(definition)}
            >
              <svg
                className="AutomationDetailHeaderActionIcon"
                content={colorizeLynxSvg(
                  definition.enabled ? pauseSvg : playSvg,
                  semanticIconColor("secondary"),
                )}
              />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={deletePending || updatePending}
            aria-label="Delete"
            onClick={async () => {
              const confirmed = await confirmAutomationDelete(definition.name);
              if (confirmed) onDelete(definition);
            }}
          >
            <Trash2 size={16} color={semanticIconColor("secondary")} />
          </Button>
          <Button
            size="sm"
            disabled={runNowPending || updatePending || approvalGaps.runBlockingWarnings.length > 0}
            onClick={() => onRunNow(definition)}
          >
            <svg
              className="AutomationDetailHeaderActionIcon"
              content={colorizeLynxSvg(playSvg, semanticIconColor("inverse"))}
            />
            <text className="LxButton__text">{runNowPending ? "Running..." : "Run now"}</text>
          </Button>
        </view>
        <scroll-view className="AutomationDetailAsideScroller" scroll-orientation="vertical">
          <view className="AutomationDetailAsideContent">
            {approvalGaps.warnings.length > 0 ? (
              <view
                className="AutomationDetailApproval"
                accessibility-element={true}
                accessibility-label="Approval needed"
                accessibility-trait="text"
              >
                <text className="AutomationDetailApprovalTitle">Approval needed</text>
                <text className="AutomationDetailApprovalDescription">
                  Approve these risks before saving changes or running now.
                </text>
                {approvalGaps.warnings.map((warning) => (
                  <view key={warning.id} className="AutomationDetailApprovalWarning">
                    <text className="AutomationDetailApprovalWarningTitle">{warning.title}</text>
                    <text className="AutomationDetailApprovalWarningDetail">{warning.detail}</text>
                  </view>
                ))}
                <view className="AutomationDetailApprovalActions">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={updatePending || runNowPending}
                    onClick={() =>
                      void onApproveRisks(
                        definition,
                        approvalGaps.acknowledgedRisks,
                        approvalGaps.maxIterations,
                        false,
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    disabled={updatePending || runNowPending}
                    onClick={() =>
                      void onApproveRisks(
                        definition,
                        approvalGaps.acknowledgedRisks,
                        approvalGaps.maxIterations,
                        true,
                      )
                    }
                  >
                    Approve &amp; run now
                  </Button>
                </view>
              </view>
            ) : null}
            {updateError || deleteError || runNowError ? (
              <view
                className="AutomationDetailUpdateError"
                accessibility-element={true}
                accessibility-label={`Automation action failed. ${
                  updateError ?? deleteError ?? runNowError
                }`}
                accessibility-trait="text"
              >
                <text className="AutomationDetailUpdateErrorText">
                  Automation action failed. {updateError ?? deleteError ?? runNowError}
                </text>
              </view>
            ) : null}
            <DetailGroup title="Status">
              <DetailRow compact label="Status" value={detail.status}>
                <view className="AutomationDetailStatusValue">
                  <view
                    className={`AutomationDetailStatusDot AutomationDetailStatusDot--${detail.status.toLowerCase()}`}
                  />
                  <text className="AutomationDetailRowValue">{detail.status}</text>
                </view>
              </DetailRow>
              <DetailRow
                compact
                label="Next run"
                value={formatAutomationRunTimestamp(detail.nextRunAt)}
              />
              <DetailRow
                compact
                label="Last ran"
                value={formatAutomationRunTimestamp(detail.lastRunAt)}
              />
            </DetailGroup>
            <DetailGroup title="Details">
              {definition.mode === "heartbeat" ? (
                <DetailRow label="Runs in" value="Thread" compact />
              ) : (
                <DetailRow label="Runs in" value={definition.worktreeMode}>
                  <InlineDetailSelect
                    label="Runs in"
                    value={definition.worktreeMode}
                    disabled={updatePending}
                    options={[
                      { value: "auto", label: "Auto" },
                      { value: "local", label: "Local" },
                      { value: "worktree", label: "Worktree" },
                    ]}
                    onChange={(value) => {
                      if (
                        (value === "auto" || value === "local") &&
                        !definition.acknowledgedRisks.includes("local-checkout")
                      ) {
                        onEditOpenChange(true);
                        return;
                      }
                      onPatch({
                        id: definition.id,
                        worktreeMode: value as AutomationWorktreeMode,
                      });
                    }}
                  />
                </DetailRow>
              )}
              <DetailRow label="Project" value={projectName}>
                {definition.mode === "heartbeat" ? (
                  <text className="AutomationDetailRowValue">{projectName}</text>
                ) : (
                  <InlineDetailSelect
                    label="Project"
                    value={definition.projectId}
                    disabled={updatePending}
                    options={projects.map((project) => ({
                      value: project.id,
                      label: project.title,
                    }))}
                    onChange={(projectId) =>
                      onPatch({
                        id: definition.id,
                        projectId: projectId as AutomationDefinition["projectId"],
                      })
                    }
                  />
                )}
              </DetailRow>
              <DetailRow label="Repeats" value={scheduleKindFromSchedule(schedule)}>
                <InlineDetailSelect
                  label="Repeats"
                  value={scheduleKindFromSchedule(schedule)}
                  disabled={updatePending}
                  options={SCHEDULE_KIND_OPTIONS}
                  onChange={(kind) =>
                    onPatch({
                      id: definition.id,
                      schedule: scheduleFromKind(
                        kind as (typeof SCHEDULE_KIND_OPTIONS)[number]["value"],
                        schedule,
                      ),
                    })
                  }
                />
              </DetailRow>
              {schedule.type === "interval" && schedule.everySeconds !== 3600 ? (
                <DetailRow label="Every" value={String(schedule.everySeconds)}>
                  <InlineDetailSelect
                    label="Every"
                    value={String(schedule.everySeconds)}
                    disabled={updatePending}
                    options={intervalOptions(schedule.everySeconds)}
                    onChange={(value) =>
                      onPatch({
                        id: definition.id,
                        schedule: {
                          type: "interval",
                          everySeconds: Number(value),
                        },
                      })
                    }
                  />
                </DetailRow>
              ) : null}
              {schedule.type === "once" ? (
                <DetailRow label="Run at" value={datetimeLocalFromIso(schedule.runAt)}>
                  <InlineDetailTextInput
                    label="Run at"
                    value={datetimeLocalFromIso(schedule.runAt)}
                    disabled={updatePending}
                    onCommit={(value) =>
                      onPatch({
                        id: definition.id,
                        schedule: { type: "once", runAt: isoFromDatetimeLocal(value) },
                      })
                    }
                  />
                </DetailRow>
              ) : null}
              {schedule.type === "cron" ? (
                <DetailRow label="Cron" value={schedule.expression}>
                  <InlineDetailTextInput
                    label="Cron expression"
                    value={schedule.expression}
                    disabled={updatePending}
                    mono
                    onCommit={(expression) =>
                      onPatch({ id: definition.id, schedule: { ...schedule, expression } })
                    }
                  />
                </DetailRow>
              ) : null}
              {schedule.type === "daily" || schedule.type === "weekdays" ? (
                <DetailRow label="Time" value={schedule.timeOfDay}>
                  <AutomationTimeInput
                    defaultValue={schedule.timeOfDay}
                    disabled={updatePending}
                    onChange={(timeOfDay) =>
                      onPatch({ id: definition.id, schedule: { ...schedule, timeOfDay } })
                    }
                  />
                </DetailRow>
              ) : null}
              {schedule.type === "weekly" ? (
                <>
                  <DetailRow label="Day" value={weekdayLabel(schedule.dayOfWeek)}>
                    <InlineDetailSelect
                      label="Day"
                      value={String(schedule.dayOfWeek)}
                      disabled={updatePending}
                      options={[0, 1, 2, 3, 4, 5, 6].map((day) => ({
                        value: String(day),
                        label: weekdayLabel(day),
                      }))}
                      onChange={(value) =>
                        onPatch({
                          id: definition.id,
                          schedule: { ...schedule, dayOfWeek: Number(value) } as AutomationSchedule,
                        })
                      }
                    />
                  </DetailRow>
                  <DetailRow label="Time" value={schedule.timeOfDay}>
                    <AutomationTimeInput
                      defaultValue={schedule.timeOfDay}
                      disabled={updatePending}
                      onChange={(timeOfDay) =>
                        onPatch({ id: definition.id, schedule: { ...schedule, timeOfDay } })
                      }
                    />
                  </DetailRow>
                </>
              ) : null}
              {(schedule.type === "daily" ||
                schedule.type === "weekdays" ||
                schedule.type === "weekly" ||
                schedule.type === "cron") &&
              schedule.timezone ? (
                <DetailRow label="Timezone" value={schedule.timezone}>
                  <InlineDetailTextInput
                    label="Automation timezone"
                    value={schedule.timezone}
                    disabled={updatePending}
                    onCommit={(timezone) =>
                      onPatch({ id: definition.id, schedule: { ...schedule, timezone } })
                    }
                  />
                </DetailRow>
              ) : null}
              <DetailRow label="Model" value={definition.modelSelection.model}>
                <AutomationDetailModelControl
                  definition={definition}
                  project={selectedProject}
                  disabled={updatePending}
                  onPatch={onPatch}
                />
              </DetailRow>
              <DetailRow
                label="Mode"
                value={definition.mode === "heartbeat" ? "Heartbeat" : "Standalone"}
                compact
              />
              {definition.mode === "heartbeat" ? (
                <DetailRow label="Stop when" value="">
                  <InlineDetailTextInput
                    label="Heartbeat stop condition"
                    value={
                      definition.completionPolicy.type === "ai-evaluated"
                        ? definition.completionPolicy.stopWhen
                        : ""
                    }
                    placeholder="Never"
                    disabled={updatePending}
                    onCommit={(value) =>
                      onPatch({
                        id: definition.id,
                        completionPolicy: completionPolicyFromStopWhen(value),
                      })
                    }
                  />
                </DetailRow>
              ) : null}
              <DetailRow
                label="Max iterations"
                value={
                  definition.maxIterations === null ? "Unlimited" : String(definition.maxIterations)
                }
              >
                <InlineDetailSelect
                  label="Max iterations"
                  value={definition.maxIterations === null ? "" : String(definition.maxIterations)}
                  disabled={updatePending}
                  options={maxIterationOptions}
                  onChange={(value) =>
                    onPatch({ id: definition.id, maxIterations: value ? Number(value) : null })
                  }
                />
              </DetailRow>
              {definition.mode === "heartbeat" ? (
                <DetailRow
                  label="Thread"
                  value={targetThreadTitle ?? "Thread unavailable"}
                  compact
                />
              ) : null}
            </DetailGroup>
            <DetailGroup title="Previous runs">
              {detail.runs.length === 0 ? (
                <text className="AutomationDetailNoRuns">No runs yet.</text>
              ) : (
                detail.runs.map((row) => (
                  <view
                    key={row.run.id}
                    className={`AutomationDetailRun${
                      row.run.threadId ? " AutomationDetailRun--interactive" : ""
                    }`}
                    accessibility-element={true}
                    accessibility-label={`${row.title}. ${row.detail}. ${row.meta}`}
                    accessibility-trait={row.run.threadId ? "button" : "text"}
                    focusable={row.run.threadId !== null}
                    bindtap={
                      row.run.threadId ? () => navigate(`/thread/${row.run.threadId}`) : undefined
                    }
                  >
                    <view className="AutomationDetailRunDot" />
                    <text className="AutomationDetailRunText">
                      {row.title} · {row.detail}
                    </text>
                    <text className="AutomationDetailRunMeta">{row.meta}</text>
                  </view>
                ))
              )}
            </DetailGroup>
          </view>
        </scroll-view>
      </view>
      <AutomationDialog
        variant="edit"
        definition={definition}
        projects={projects}
        threads={threads}
        open={editOpen}
        pending={updatePending}
        error={updateError}
        onOpenChange={onEditOpenChange}
        onSave={onEdit}
      />
    </view>
  );
}
