import { useEffect, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import {
  AUTOMATION_DEFAULT_MODEL_SELECTION,
  AUTOMATION_TEMPLATES,
} from "@synara/shared/automationTemplates";
import type { AutomationCreateInput, ModelSelection, ProviderKind } from "@synara/contracts";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import { completionPolicyFromStopWhen } from "@synara/shared/automationCompletionPolicy";
import {
  applyScheduleToForm,
  automationFastIntervalLimitMessage,
  formatCadence,
  formFromDefinition,
  isFormSubmittable,
  scheduleFromForm,
  scheduleFromKind,
  SCHEDULE_KIND_OPTIONS,
  type AutomationFormState,
  type IntervalUnit,
  type ScheduleKind,
} from "@synara-web/lib/automationForm";
import {
  buildAutomationDraftWarnings,
  type AutomationDraftWarningId,
} from "@synara-web/lib/automationDraft";

import {
  fetchAutomationCreateModels,
  fetchAutomationCreateServerConfig,
  type ProjectSummary,
  type ThreadSummary,
} from "./queries";
import { webStorage } from "../platform/storage";
import { ComposerModelControl } from "../components/composer/ComposerModelControl.lynx";
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
  buildAutomationCreateInput,
  resolveAutomationModelSelection,
  resolveAutomationModelSelectionForProjectChange,
  type CreateWorktreeMode,
} from "./automationCreate.logic";
import { AutomationTimeInput } from "./AutomationTimeInput.lynx";
import {
  AutomationComposerChipChevron,
  AutomationComposerNameInput,
  AutomationComposerStopWhenInput,
  AutomationComposerToolbarIcon,
  AutomationComposerWarningRow,
} from "./AutomationComposerPrimitives.lynx";

export function AutomationCreateDialog({
  open,
  projects,
  threads,
  pending,
  error,
  onCreate,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly projects: readonly ProjectSummary[];
  readonly threads: readonly ThreadSummary[];
  readonly pending: boolean;
  readonly error: string | null;
  readonly onCreate: (input: AutomationCreateInput) => void;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const initialProjectModelSelection = projects[0]?.defaultModelSelection;
  const [modelSelection, setModelSelection] = useState<ModelSelection>(() =>
    resolveAutomationModelSelection({
      projectModelSelection: initialProjectModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION,
      defaultProvider: generalSettings.defaultProvider,
    }),
  );
  const [modelCatalogProvider, setModelCatalogProvider] = useState<ProviderKind>(
    modelSelection.provider,
  );
  const [mode, setMode] = useState<NonNullable<AutomationCreateInput["mode"]>>("standalone");
  const [targetThreadId, setTargetThreadId] = useState("");
  const [stopWhen, setStopWhen] = useState("");
  const [scheduleForm, setScheduleForm] = useState<AutomationFormState>(() =>
    formFromDefinition(null, projects[0]?.id ?? "", AUTOMATION_DEFAULT_MODEL_SELECTION),
  );
  const [maxIterations, setMaxIterations] = useState<number | null>(null);
  const [interactionMode, setInteractionMode] =
    useState<NonNullable<AutomationCreateInput["interactionMode"]>>("default");
  const [runtimeMode, setRuntimeMode] =
    useState<NonNullable<AutomationCreateInput["runtimeMode"]>>("approval-required");
  const [worktreeMode, setWorktreeMode] = useState<CreateWorktreeMode>("auto");
  const [acknowledgedWarningIds, setAcknowledgedWarningIds] = useState<
    ReadonlySet<AutomationDraftWarningId>
  >(() => new Set());
  const serverConfig = useQuery({
    queryKey: ["automation-create", "server-config"],
    queryFn: fetchAutomationCreateServerConfig,
    enabled: open,
    staleTime: 30_000,
  });
  const modelCatalog = useQuery({
    queryKey: [
      "automation-create",
      "models",
      modelCatalogProvider,
      projects.find((candidate) => candidate.id === projectId)?.workspaceRoot ?? null,
    ],
    queryFn: () =>
      fetchAutomationCreateModels({
        provider: modelCatalogProvider,
        cwd: projects.find((candidate) => candidate.id === projectId)?.workspaceRoot ?? null,
      }),
    enabled: open && Boolean(projects.find((candidate) => candidate.id === projectId)),
    staleTime: 30_000,
  });
  useEffect(() => {
    if (!open) return;
    const firstProject = projects[0];
    const nextModelSelection = resolveAutomationModelSelection({
      projectModelSelection:
        firstProject?.defaultModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION,
      defaultProvider: generalSettings.defaultProvider,
    });
    setName("");
    setPrompt("");
    setProjectId(firstProject?.id ?? "");
    setModelSelection(nextModelSelection);
    setModelCatalogProvider(nextModelSelection.provider);
    setMode("standalone");
    setTargetThreadId("");
    setStopWhen("");
    setScheduleForm(
      formFromDefinition(null, firstProject?.id ?? "", AUTOMATION_DEFAULT_MODEL_SELECTION),
    );
    setMaxIterations(null);
    setInteractionMode("default");
    setRuntimeMode("approval-required");
    setWorktreeMode("auto");
    setAcknowledgedWarningIds(new Set());
  }, [open]);
  useEffect(() => {
    if (projects.length > 0 && !projects.some((project) => project.id === projectId)) {
      const firstProject = projects[0]!;
      const nextModelSelection = resolveAutomationModelSelection({
        projectModelSelection:
          firstProject.defaultModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION,
        defaultProvider: generalSettings.defaultProvider,
      });
      setProjectId(firstProject.id);
      setModelSelection(nextModelSelection);
      setModelCatalogProvider(nextModelSelection.provider);
    }
  }, [generalSettings.defaultProvider, projectId, projects]);
  useEffect(() => {
    if (
      targetThreadId &&
      !threads.some((thread) => thread.id === targetThreadId && thread.projectId === projectId)
    ) {
      setTargetThreadId("");
    }
  }, [projectId, targetThreadId, threads]);
  const project = projects.find((candidate) => candidate.id === projectId);
  const projectThreads = threads.filter(
    (thread) => thread.projectId === projectId && (thread.archivedAt ?? null) === null,
  );
  const chooseProject = (nextProjectId: string) => {
    const currentProject = projects.find((candidate) => candidate.id === projectId);
    const nextProject = projects.find((candidate) => candidate.id === nextProjectId);
    const nextModelSelection = resolveAutomationModelSelectionForProjectChange({
      currentModelSelection: modelSelection,
      currentProjectModelSelection:
        currentProject?.defaultModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION,
      nextProjectModelSelection:
        nextProject?.defaultModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION,
      defaultProvider: generalSettings.defaultProvider,
    });
    setProjectId(nextProjectId);
    setModelSelection(nextModelSelection);
    setModelCatalogProvider(nextModelSelection.provider);
  };
  const formForValidation: AutomationFormState = {
    ...scheduleForm,
    name,
    projectId,
    prompt,
    enabled: true,
    runtimeMode,
    worktreeMode,
    modelSelection,
    mode,
    targetThreadId,
    maxIterations: maxIterations === null ? "" : String(maxIterations),
    stopWhen,
  };
  const schedule = scheduleFromForm(formForValidation);
  const fastIntervalLimitMessage = automationFastIntervalLimitMessage(formForValidation);
  const canCreate = !pending && Boolean(project) && isFormSubmittable(formForValidation);
  const warnings = buildAutomationDraftWarnings({
    schedule,
    mode,
    runtimeMode,
    worktreeMode,
    hasEphemeralContext: false,
    generatedConfidence: null,
    generatedNeedsConfirmation: false,
    prompt,
  });
  const hasUnacknowledgedWarning = warnings.some(
    (warning) => warning.requiresAcknowledgement && !acknowledgedWarningIds.has(warning.id),
  );
  const toggleWarning = (id: AutomationDraftWarningId) =>
    setAcknowledgedWarningIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    if (!canCreate || hasUnacknowledgedWarning || !project) return;
    onCreate(
      buildAutomationCreateInput({
        acknowledgeFastInterval: acknowledgedWarningIds.has("fast-recurring-interval"),
        acknowledgeLocalCheckout: acknowledgedWarningIds.has("local-checkout"),
        completionPolicy: completionPolicyFromStopWhen(stopWhen),
        projectId: project.id as AutomationCreateInput["projectId"],
        interactionMode,
        mode,
        name,
        prompt,
        runtimeMode,
        schedule,
        maxIterations,
        modelSelection,
        targetThreadId:
          mode === "heartbeat" ? (targetThreadId as AutomationCreateInput["targetThreadId"]) : null,
        worktreeMode,
      }),
    );
  };
  const applyTemplate = (template: (typeof AUTOMATION_TEMPLATES)[number]) => {
    if (!name.trim()) setName(template.name);
    setPrompt(template.prompt);
  };
  const selectedProjectLabel = project?.title ?? "Select project";
  const worktreeModeLabel =
    worktreeMode === "auto" ? "Auto" : worktreeMode === "worktree" ? "Worktree" : "Local";
  const cadenceLabel = formatCadence(schedule);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        className={`AutomationCreateDialog${
          warnings.length > 3
            ? " AutomationCreateDialog--expanded-more"
            : warnings.length > 2
              ? " AutomationCreateDialog--expanded"
              : ""
        }`}
        showCloseButton={false}
      >
        <DialogTitle className="AutomationCreateAccessibleTitle">New automation</DialogTitle>
        <view className="AutomationCreateHeader">
          <AutomationComposerNameInput disabled={pending} value={name} onChange={setName} />
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
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
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
          {error ? (
            <view className="AutomationCreateError" accessibility-element>
              <text className="AutomationCreateErrorText">{error}</text>
            </view>
          ) : null}
          {fastIntervalLimitMessage ? (
            <view className="AutomationCreateError" accessibility-element>
              <text className="AutomationCreateErrorText">{fastIntervalLimitMessage}</text>
            </view>
          ) : null}
        </DialogPanel>
        <DialogFooter className="AutomationCreateFooter">
          <view className="AutomationCreateToolbar">
            <Menu>
              <MenuTrigger ariaLabel={`Runs in ${worktreeMode}`} disabled={pending}>
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
                  value={worktreeMode}
                  onValueChange={(value) => {
                    setWorktreeMode(value as CreateWorktreeMode);
                    setAcknowledgedWarningIds(new Set());
                  }}
                >
                  <MenuRadioItem value="auto">Auto</MenuRadioItem>
                  <MenuRadioItem value="worktree">Worktree</MenuRadioItem>
                  <MenuRadioItem value="local">Local</MenuRadioItem>
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>
            <Menu>
              <MenuTrigger ariaLabel={`Project ${selectedProjectLabel}`} disabled={pending}>
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
                    {selectedProjectLabel}
                  </text>
                  <AutomationComposerChipChevron />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" side="top" className="AutomationCreateProjectMenu">
                <MenuRadioGroup value={projectId} onValueChange={chooseProject}>
                  {projects.map((candidate) => (
                    <MenuRadioItem key={candidate.id} value={candidate.id}>
                      {candidate.title}
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
              modelSelection={modelSelection}
              catalogProvider={modelCatalogProvider}
              runtimeModels={modelCatalog.data?.models ?? []}
              modelsLoading={
                modelCatalog.isPending || (modelCatalog.isFetching && !modelCatalog.data)
              }
              providers={serverConfig.data?.providers ?? []}
              onCatalogProviderChange={setModelCatalogProvider}
              onModelSelectionChange={(selection) => {
                setModelSelection(selection);
                setModelCatalogProvider(selection.provider);
              }}
            />
            <Menu>
              <MenuTrigger ariaLabel={`Schedule ${cadenceLabel}`} disabled={pending}>
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
                  <text className="AutomationCreateChipText">{cadenceLabel}</text>
                  <AutomationComposerChipChevron />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" side="top" className="AutomationCreateScheduleMenu">
                <MenuRadioGroup
                  value={scheduleForm.scheduleKind}
                  onValueChange={(value) =>
                    setScheduleForm((current) =>
                      applyScheduleToForm(
                        current,
                        scheduleFromKind(value as ScheduleKind, scheduleFromForm(current)),
                      ),
                    )
                  }
                >
                  {SCHEDULE_KIND_OPTIONS.map((option) => (
                    <MenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
                {scheduleForm.scheduleKind === "custom" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Every</MenuGroupLabel>
                      <Input
                        nativeInput
                        aria-label="Interval amount"
                        value={scheduleForm.intervalAmount}
                        onChange={(event) =>
                          setScheduleForm((current) => ({
                            ...current,
                            intervalAmount: event.target.value,
                          }))
                        }
                      />
                      <MenuRadioGroup
                        value={scheduleForm.intervalUnit}
                        onValueChange={(value) =>
                          setScheduleForm((current) => ({
                            ...current,
                            intervalUnit: value as IntervalUnit,
                          }))
                        }
                      >
                        <MenuRadioItem value="minutes">Minutes</MenuRadioItem>
                        <MenuRadioItem value="seconds">Seconds</MenuRadioItem>
                      </MenuRadioGroup>
                    </MenuGroup>
                  </>
                ) : null}
                {scheduleForm.scheduleKind === "once" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Run at</MenuGroupLabel>
                      <Input
                        nativeInput
                        aria-label="Run at"
                        value={scheduleForm.onceRunAt}
                        onChange={(event) =>
                          setScheduleForm((current) => ({
                            ...current,
                            onceRunAt: event.target.value,
                          }))
                        }
                      />
                    </MenuGroup>
                  </>
                ) : null}
                {scheduleForm.scheduleKind === "cron" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Cron</MenuGroupLabel>
                      <Input
                        nativeInput
                        aria-label="Cron expression"
                        value={scheduleForm.cronExpression}
                        onChange={(event) =>
                          setScheduleForm((current) => ({
                            ...current,
                            cronExpression: event.target.value,
                          }))
                        }
                      />
                    </MenuGroup>
                  </>
                ) : null}
                {scheduleForm.scheduleKind === "weekly" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Day</MenuGroupLabel>
                      <MenuRadioGroup
                        value={scheduleForm.dayOfWeek}
                        onValueChange={(value) =>
                          setScheduleForm((current) => ({ ...current, dayOfWeek: value }))
                        }
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
                {scheduleForm.scheduleKind === "daily" ||
                scheduleForm.scheduleKind === "weekdays" ||
                scheduleForm.scheduleKind === "weekly" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Time</MenuGroupLabel>
                      <AutomationTimeInput
                        defaultValue={scheduleForm.timeOfDay}
                        disabled={pending}
                        onChange={(timeOfDay) =>
                          setScheduleForm((current) => ({ ...current, timeOfDay }))
                        }
                      />
                    </MenuGroup>
                  </>
                ) : null}
                {scheduleForm.scheduleKind === "daily" ||
                scheduleForm.scheduleKind === "weekdays" ||
                scheduleForm.scheduleKind === "weekly" ||
                scheduleForm.scheduleKind === "cron" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Timezone</MenuGroupLabel>
                      <Input
                        nativeInput
                        aria-label="Automation timezone"
                        value={scheduleForm.timezone}
                        onChange={(event) =>
                          setScheduleForm((current) => ({
                            ...current,
                            timezone: event.target.value,
                          }))
                        }
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
                    value={mode}
                    onValueChange={(value) =>
                      setMode(value as NonNullable<AutomationCreateInput["mode"]>)
                    }
                  >
                    <MenuRadioItem value="standalone">Standalone</MenuRadioItem>
                    <MenuRadioItem value="heartbeat">Heartbeat</MenuRadioItem>
                  </MenuRadioGroup>
                </MenuGroup>
                {mode === "heartbeat" ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Target thread</MenuGroupLabel>
                      {projectThreads.length === 0 ? (
                        <MenuItem disabled>No threads in this project</MenuItem>
                      ) : (
                        <MenuRadioGroup value={targetThreadId} onValueChange={setTargetThreadId}>
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
                        value={stopWhen}
                        onChange={setStopWhen}
                      />
                    </MenuGroup>
                  </>
                ) : null}
                <MenuSeparator />
                <MenuGroup>
                  <MenuGroupLabel>Max iterations</MenuGroupLabel>
                  <MenuRadioGroup
                    value={maxIterations === null ? "unlimited" : String(maxIterations)}
                    onValueChange={(value) =>
                      setMaxIterations(value === "unlimited" ? null : Number(value))
                    }
                  >
                    <MenuRadioItem value="unlimited">Unlimited</MenuRadioItem>
                    <MenuRadioItem value="10">10 runs</MenuRadioItem>
                    <MenuRadioItem value="25">25 runs</MenuRadioItem>
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
                  value={runtimeMode}
                  onValueChange={(value) => {
                    setRuntimeMode(value as NonNullable<AutomationCreateInput["runtimeMode"]>);
                    setAcknowledgedWarningIds(new Set());
                  }}
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
            <Button disabled={!canCreate || hasUnacknowledgedWarning} onClick={submit}>
              {pending ? "Creating..." : "Create"}
            </Button>
          </view>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
