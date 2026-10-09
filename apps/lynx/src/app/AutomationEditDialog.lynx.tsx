import { useEffect, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import type { AutomationDefinition, AutomationUpdateInput, ProviderKind } from "@synara/contracts";
import { AUTOMATION_TEMPLATES } from "@synara/shared/automationTemplates";
import {
  acknowledgedRiskIdsForFormWarnings,
  applyScheduleToForm,
  automationFastIntervalLimitMessage,
  buildAutomationFormWarnings,
  formatCadence,
  formFromDefinition,
  isFormSubmittable,
  modelSelectionForProjectChange,
  scheduleFromForm,
  scheduleFromKind,
  SCHEDULE_KIND_OPTIONS,
  type AutomationFormState,
  type IntervalUnit,
  type ScheduleKind,
} from "@synara-web/lib/automationForm";
import {
  hasBlockingAutomationDraftWarnings,
  updateAutomationDraftWarningAcknowledgement,
  type AutomationDraftWarningId,
} from "@synara-web/lib/automationDraft";

import { ComposerModelControl } from "../components/composer/ComposerModelControl.lynx";
import {
  providerOptionsForAutomationEdit,
  updateInputFromForm,
  warningIdsForAcknowledgedRisks,
} from "./automationEditDialog.logic";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input.lynx";
import { Textarea } from "../components/ui/textarea.lynx";
import {
  Dialog,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../components/ui/dialog.lynx";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { BrainIcon, ClockIcon, FolderIcon, XIcon } from "../lib/icons.lynx";
import infoSvg from "@synara-central-icons/info-simple.svg?raw";
import modeSvg from "@synara-central-icons/building-blocks.svg?raw";
import worktreeSvg from "@synara-central-icons/arrow-split-right.svg?raw";
import {
  AutomationComposerChipChevron,
  AutomationComposerNameInput,
  AutomationComposerStopWhenInput,
  AutomationComposerToolbarIcon,
  AutomationComposerWarningRow,
} from "./AutomationComposerPrimitives.lynx";
import { AutomationTimeInput } from "./AutomationTimeInput.lynx";
import {
  fetchAutomationCreateModels,
  fetchAutomationCreateServerConfig,
  type ProjectSummary,
  type ThreadSummary,
} from "./queries";

const MAX_ITERATION_OPTIONS = ["", "10", "25", "50", "100", "250"] as const;

function formForDefinition(definition: AutomationDefinition): AutomationFormState {
  return formFromDefinition(definition, definition.projectId);
}

function updateFormField<K extends keyof AutomationFormState>(
  form: AutomationFormState,
  key: K,
  value: AutomationFormState[K],
): AutomationFormState {
  return { ...form, [key]: value };
}

export function AutomationEditDialog({
  definition,
  projects,
  threads,
  open,
  pending,
  error,
  onOpenChange,
  onSave,
}: {
  readonly definition: AutomationDefinition;
  readonly projects: readonly ProjectSummary[];
  readonly threads: readonly ThreadSummary[];
  readonly open: boolean;
  readonly pending: boolean;
  readonly error: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (input: AutomationUpdateInput) => void;
}) {
  const [form, setForm] = useState<AutomationFormState>(() => formForDefinition(definition));
  const [modelCatalogProvider, setModelCatalogProvider] = useState<ProviderKind>(
    definition.modelSelection.provider,
  );
  const [acknowledgedWarningIds, setAcknowledgedWarningIds] = useState<
    ReadonlySet<AutomationDraftWarningId>
  >(() => warningIdsForAcknowledgedRisks(definition.acknowledgedRisks));

  useEffect(() => {
    if (!open) return;
    const nextForm = formForDefinition(definition);
    setForm(nextForm);
    setModelCatalogProvider(nextForm.modelSelection.provider);
    setAcknowledgedWarningIds(warningIdsForAcknowledgedRisks(definition.acknowledgedRisks));
  }, [definition, open]);

  const selectedProject = projects.find((project) => project.id === form.projectId);
  const projectThreads = threads.filter(
    (thread) => thread.projectId === form.projectId && (thread.archivedAt ?? null) === null,
  );
  const schedule = scheduleFromForm(form);
  const warnings = buildAutomationFormWarnings(form);
  const fastIntervalLimitMessage = automationFastIntervalLimitMessage(form);
  const hasBlockingWarning = hasBlockingAutomationDraftWarnings(warnings, acknowledgedWarningIds);
  const canSave = !pending && isFormSubmittable(form) && !hasBlockingWarning;

  const serverConfig = useQuery({
    queryKey: ["automation-edit", "server-config"],
    queryFn: fetchAutomationCreateServerConfig,
    enabled: open,
    staleTime: 30_000,
  });
  const modelCatalog = useQuery({
    queryKey: [
      "automation-edit",
      "models",
      modelCatalogProvider,
      selectedProject?.workspaceRoot ?? null,
    ],
    queryFn: () =>
      fetchAutomationCreateModels({
        provider: modelCatalogProvider,
        cwd: selectedProject?.workspaceRoot ?? null,
      }),
    enabled: open && Boolean(selectedProject),
    staleTime: 30_000,
  });

  const setField = <K extends keyof AutomationFormState>(key: K, value: AutomationFormState[K]) =>
    setForm((current) => updateFormField(current, key, value));

  const chooseProject = (projectId: string) =>
    setForm((current) => ({
      ...current,
      projectId,
      modelSelection: modelSelectionForProjectChange(
        projects,
        current.projectId,
        projectId,
        current.modelSelection,
      ),
      targetThreadId: threads.some(
        (thread) => thread.id === current.targetThreadId && thread.projectId === projectId,
      )
        ? current.targetThreadId
        : "",
    }));

  const chooseSchedule = (kind: ScheduleKind) =>
    setForm((current) =>
      applyScheduleToForm(current, scheduleFromKind(kind, scheduleFromForm(current))),
    );

  const applyTemplate = (template: (typeof AUTOMATION_TEMPLATES)[number]) =>
    setForm((current) => ({
      ...current,
      name: current.name.trim() ? current.name : template.name,
      prompt: template.prompt,
    }));

  const toggleWarning = (id: AutomationDraftWarningId) =>
    setAcknowledgedWarningIds((current) =>
      updateAutomationDraftWarningAcknowledgement(current, id, !current.has(id)),
    );

  const submit = () => {
    if (!canSave) return;
    onSave(
      updateInputFromForm(
        definition,
        form,
        providerOptionsForAutomationEdit(definition, form),
        acknowledgedRiskIdsForFormWarnings(warnings, acknowledgedWarningIds),
      ),
    );
  };

  const maxIterationOptions: readonly string[] = MAX_ITERATION_OPTIONS.includes(
    form.maxIterations as (typeof MAX_ITERATION_OPTIONS)[number],
  )
    ? MAX_ITERATION_OPTIONS
    : [form.maxIterations, ...MAX_ITERATION_OPTIONS];
  const worktreeModeLabel =
    form.worktreeMode === "auto" ? "Auto" : form.worktreeMode === "worktree" ? "Worktree" : "Local";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        className={`AutomationCreateDialog AutomationEditDialog${
          warnings.length > 3
            ? " AutomationCreateDialog--expanded-more"
            : warnings.length > 2
              ? " AutomationCreateDialog--expanded"
              : ""
        }`}
        showCloseButton={false}
      >
        <DialogTitle className="AutomationCreateAccessibleTitle">Edit automation</DialogTitle>
        <view className="AutomationCreateHeader">
          <AutomationComposerNameInput
            disabled={pending}
            value={form.name}
            onChange={(value) => setField("name", value)}
          />
          <view className="AutomationCreateHeaderActions">
            <Button
              className="AutomationCreateHeaderIconButton"
              variant="ghost"
              size="icon-sm"
              aria-label="About automations"
            >
              <AutomationComposerToolbarIcon
                className="AutomationCreateHeaderIcon"
                content={infoSvg}
              />
            </Button>
            <Menu>
              <MenuTrigger ariaLabel="Use template" disabled={pending}>
                <Button
                  className="AutomationCreateTemplateButton"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  buttonProps={{ "accessibility-element": false }}
                >
                  Use template
                </Button>
              </MenuTrigger>
              <MenuPopup align="end" className="AutomationCreateTemplateMenu">
                {AUTOMATION_TEMPLATES.map((template) => (
                  <MenuItem key={template.label} onClick={() => applyTemplate(template)}>
                    {template.label}
                  </MenuItem>
                ))}
              </MenuPopup>
            </Menu>
            <Button
              className="AutomationCreateHeaderIconButton"
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <XIcon size={16} color="var(--color-icon-secondary)" />
            </Button>
          </view>
        </view>

        <DialogPanel className="AutomationCreatePanel">
          <Textarea
            className="AutomationCreatePrompt"
            nativeInput
            unstyled
            aria-label="Automation prompt"
            disabled={pending}
            maxLength={64000}
            // The web prompt is a fixed 15rem box that scrolls; 11 lines of 23px
            // keep the line cap from shrinking the field below 240px.
            maxLines={11}
            placeholder="Add prompt e.g. look for crashes in $sentry"
            value={form.prompt}
            onChange={(event) => setField("prompt", event.target.value)}
          />
          <view className="AutomationCreateWarnings">
            {warnings.map((warning) => (
              <AutomationComposerWarningRow
                key={warning.id}
                checked={
                  warning.requiresAcknowledgement
                    ? acknowledgedWarningIds.has(warning.id)
                    : undefined
                }
                title={warning.title}
                detail={warning.detail}
                onToggle={
                  warning.requiresAcknowledgement ? () => toggleWarning(warning.id) : undefined
                }
              />
            ))}
          </view>
          {fastIntervalLimitMessage ? (
            <view className="AutomationCreateError" accessibility-element>
              <text className="AutomationCreateErrorText">{fastIntervalLimitMessage}</text>
            </view>
          ) : null}
          {error ? (
            <view className="AutomationCreateError" accessibility-element>
              <text className="AutomationCreateErrorText">{error}</text>
            </view>
          ) : null}
        </DialogPanel>

        <DialogFooter className="AutomationCreateFooter">
          <view className="AutomationCreateToolbar">
            {form.mode === "standalone" ? (
              <Menu>
                <MenuTrigger ariaLabel={`Runs in ${form.worktreeMode}`} disabled={pending}>
                  <Button
                    className="AutomationCreateChip"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    buttonProps={{ "accessibility-element": false }}
                  >
                    <AutomationComposerToolbarIcon
                      className="AutomationCreateChipIcon"
                      content={worktreeSvg}
                    />
                    <text className="AutomationCreateChipText">{worktreeModeLabel}</text>
                    <AutomationComposerChipChevron />
                  </Button>
                </MenuTrigger>
                <MenuPopup align="start" side="top" className="AutomationCreateMenu">
                  <MenuRadioGroup
                    value={form.worktreeMode}
                    onValueChange={(value) =>
                      setField("worktreeMode", value as AutomationFormState["worktreeMode"])
                    }
                  >
                    <MenuRadioItem value="auto">Auto</MenuRadioItem>
                    <MenuRadioItem value="worktree">Worktree</MenuRadioItem>
                    <MenuRadioItem value="local">Local</MenuRadioItem>
                  </MenuRadioGroup>
                </MenuPopup>
              </Menu>
            ) : null}

            <Menu>
              <MenuTrigger
                ariaLabel={`Project ${selectedProject?.title ?? "Select project"}`}
                disabled={pending}
              >
                <Button
                  className="AutomationCreateChip"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  buttonProps={{ "accessibility-element": false }}
                >
                  <FolderIcon
                    className="AutomationCreateChipIcon"
                    color="var(--color-icon-secondary)"
                    size={16}
                  />
                  <text className="AutomationCreateChipText AutomationCreateProjectLabel">
                    {selectedProject?.title ?? "Select project"}
                  </text>
                  <AutomationComposerChipChevron />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" side="top" className="AutomationCreateProjectMenu">
                <MenuRadioGroup value={form.projectId} onValueChange={chooseProject}>
                  {projects.map((project) => (
                    <MenuRadioItem key={project.id} value={project.id}>
                      {project.title}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>

            <ComposerModelControl
              hideStatusLabel
              hideTraits
              splitTraits
              triggerVariant="picker"
              modelSelection={form.modelSelection}
              catalogProvider={modelCatalogProvider}
              runtimeModels={modelCatalog.data?.models ?? []}
              modelsLoading={
                modelCatalog.isPending || (modelCatalog.isFetching && !modelCatalog.data)
              }
              providers={serverConfig.data?.providers ?? []}
              onCatalogProviderChange={setModelCatalogProvider}
              onModelSelectionChange={(selection) => {
                setField("modelSelection", selection);
                setModelCatalogProvider(selection.provider);
              }}
            />

            <Menu>
              <MenuTrigger ariaLabel={`Schedule ${formatCadence(schedule)}`} disabled={pending}>
                <Button
                  className="AutomationCreateChip"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  buttonProps={{ "accessibility-element": false }}
                >
                  <ClockIcon
                    className="AutomationCreateChipIcon"
                    color="var(--color-icon-secondary)"
                    size={16}
                  />
                  <text className="AutomationCreateChipText">{formatCadence(schedule)}</text>
                  <AutomationComposerChipChevron />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" side="top" className="AutomationCreateScheduleMenu">
                <MenuGroup>
                  <MenuGroupLabel>Schedule</MenuGroupLabel>
                  <MenuRadioGroup
                    value={form.scheduleKind}
                    onValueChange={(value) => chooseSchedule(value as ScheduleKind)}
                  >
                    {SCHEDULE_KIND_OPTIONS.map((option) => (
                      <MenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuGroup>
                {form.scheduleKind === "custom" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Every</MenuGroupLabel>
                      <Input
                        nativeInput
                        aria-label="Interval amount"
                        value={form.intervalAmount}
                        onChange={(event) => setField("intervalAmount", event.target.value)}
                      />
                      <MenuRadioGroup
                        value={form.intervalUnit}
                        onValueChange={(value) => setField("intervalUnit", value as IntervalUnit)}
                      >
                        <MenuRadioItem value="minutes">Minutes</MenuRadioItem>
                        <MenuRadioItem value="seconds">Seconds</MenuRadioItem>
                      </MenuRadioGroup>
                    </MenuGroup>
                  </>
                ) : null}
                {form.scheduleKind === "once" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Run at</MenuGroupLabel>
                      <Input
                        nativeInput
                        aria-label="Run at"
                        value={form.onceRunAt}
                        onChange={(event) => setField("onceRunAt", event.target.value)}
                      />
                    </MenuGroup>
                  </>
                ) : null}
                {form.scheduleKind === "cron" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Cron</MenuGroupLabel>
                      <Input
                        nativeInput
                        aria-label="Cron expression"
                        value={form.cronExpression}
                        onChange={(event) => setField("cronExpression", event.target.value)}
                      />
                    </MenuGroup>
                  </>
                ) : null}
                {form.scheduleKind === "weekly" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Day</MenuGroupLabel>
                      <MenuRadioGroup
                        value={form.dayOfWeek}
                        onValueChange={(value) => setField("dayOfWeek", value)}
                      >
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => (
                          <MenuRadioItem key={label} value={String(index)}>
                            {label}
                          </MenuRadioItem>
                        ))}
                      </MenuRadioGroup>
                    </MenuGroup>
                  </>
                ) : null}
                {form.scheduleKind === "daily" ||
                form.scheduleKind === "weekdays" ||
                form.scheduleKind === "weekly" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Time</MenuGroupLabel>
                      <AutomationTimeInput
                        defaultValue={form.timeOfDay}
                        disabled={pending}
                        onChange={(value) => setField("timeOfDay", value)}
                      />
                    </MenuGroup>
                  </>
                ) : null}
                {form.scheduleKind === "daily" ||
                form.scheduleKind === "weekdays" ||
                form.scheduleKind === "weekly" ||
                form.scheduleKind === "cron" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Timezone</MenuGroupLabel>
                      <Input
                        nativeInput
                        aria-label="Automation timezone"
                        value={form.timezone}
                        onChange={(event) => setField("timezone", event.target.value)}
                      />
                    </MenuGroup>
                  </>
                ) : null}
              </MenuPopup>
            </Menu>

            <Menu>
              <MenuTrigger ariaLabel="Run mode" disabled={pending}>
                <Button
                  className="AutomationCreateIconChip"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  buttonProps={{ "accessibility-element": false }}
                >
                  <AutomationComposerToolbarIcon
                    className="AutomationCreateChipIcon"
                    content={modeSvg}
                  />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" side="top" className="AutomationCreateModeMenu">
                <MenuGroup>
                  <MenuGroupLabel>Mode</MenuGroupLabel>
                  <MenuRadioGroup
                    value={form.mode}
                    onValueChange={(value) =>
                      setField("mode", value as AutomationFormState["mode"])
                    }
                  >
                    <MenuRadioItem value="standalone">Standalone</MenuRadioItem>
                    <MenuRadioItem value="heartbeat">Heartbeat</MenuRadioItem>
                  </MenuRadioGroup>
                </MenuGroup>
                {form.mode === "heartbeat" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Target thread</MenuGroupLabel>
                      {projectThreads.length === 0 ? (
                        <MenuItem disabled>No threads in this project</MenuItem>
                      ) : (
                        <MenuRadioGroup
                          value={form.targetThreadId}
                          onValueChange={(value) => setField("targetThreadId", value)}
                        >
                          {projectThreads.map((thread) => (
                            <MenuRadioItem key={thread.id} value={thread.id}>
                              {thread.title.trim() || "New thread"}
                            </MenuRadioItem>
                          ))}
                        </MenuRadioGroup>
                      )}
                    </MenuGroup>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Stop when</MenuGroupLabel>
                      <AutomationComposerStopWhenInput
                        disabled={pending}
                        value={form.stopWhen}
                        onChange={(value) => setField("stopWhen", value)}
                      />
                    </MenuGroup>
                  </>
                ) : null}
                <MenuSeparator />
                <MenuGroup>
                  <MenuGroupLabel>Max iterations</MenuGroupLabel>
                  <MenuRadioGroup
                    value={form.maxIterations}
                    onValueChange={(value) => setField("maxIterations", value)}
                  >
                    {maxIterationOptions.map((value) => (
                      <MenuRadioItem key={value || "unlimited"} value={value}>
                        {value ? `${value} runs` : "Unlimited"}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuGroup>
              </MenuPopup>
            </Menu>

            <Menu>
              <MenuTrigger ariaLabel="Permissions" disabled={pending}>
                <Button
                  className="AutomationCreateIconChip"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  buttonProps={{ "accessibility-element": false }}
                >
                  <BrainIcon
                    className="AutomationCreateChipIcon"
                    color="var(--color-icon-secondary)"
                    size={16}
                  />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" side="top" className="AutomationCreatePermissionsMenu">
                <MenuRadioGroup
                  value={form.runtimeMode}
                  onValueChange={(value) =>
                    setField("runtimeMode", value as AutomationFormState["runtimeMode"])
                  }
                >
                  <MenuRadioItem value="approval-required">Approval required</MenuRadioItem>
                  <MenuRadioItem value="full-access">Full access</MenuRadioItem>
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>
          </view>
          <view className="AutomationCreateFooterActions">
            <Button variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!canSave} onClick={submit}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </view>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
