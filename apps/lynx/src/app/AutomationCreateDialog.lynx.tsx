import { useEffect, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import {
  AUTOMATION_DEFAULT_MODEL_SELECTION,
  AUTOMATION_TEMPLATES,
} from '@synara/shared/automationTemplates';
import type {
  AutomationCreateInput,
  ModelSelection,
  ProviderKind,
} from '@synara/contracts';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
} from '@synara-web/appSettingsStorageProjection.logic';
import { completionPolicyFromStopWhen } from '@synara-web/lib/automationCompletionPolicy';
import {
  buildAutomationDraftWarnings,
  type AutomationDraftWarningId,
} from '@synara-web/lib/automationDraft';

import {
  fetchAutomationCreateModels,
  fetchAutomationCreateServerConfig,
  type ProjectSummary,
  type ThreadSummary,
} from './queries';
import { webStorage } from '../platform/storage';
import { ComposerModelControl } from '../components/composer/ComposerModelControl.lynx';
import { Button } from '../components/ui/button';
import { CheckboxIndicator } from '../components/ui/checkbox.lynx';
import { Input } from '../components/ui/input.lynx';
import { Textarea } from '../components/ui/textarea.lynx';
import {
  Dialog,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '../components/ui/dialog.lynx';
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '../components/ui/menu.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { AutomationChoiceOption as ChoiceOption } from './AutomationChoiceOption.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import {
  BrainIcon,
  ChevronDownIcon,
  ClockIcon,
  FolderIcon,
  XIcon,
} from '../lib/icons.lynx';
import infoSvg from '@synara-central-icons/info-simple.svg?raw';
import modeSvg from '@synara-central-icons/building-blocks.svg?raw';
import worktreeSvg from '@synara-central-icons/arrow-split-right.svg?raw';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import {
  buildAutomationCreateInput,
  resolveAutomationModelSelection,
  resolveAutomationModelSelectionForProjectChange,
  type CreateSchedule,
  type CreateWorktreeMode,
} from './automationCreate.logic';
import { AutomationTimeInput } from './AutomationTimeInput.lynx';
import { isAutomationTimeOfDay } from './automationTime.logic';

interface NativeTextInputEvent {
  readonly detail: {
    readonly value: string;
  };
}

function NativeNameInput({
  disabled,
  value,
  onInput,
}: {
  readonly disabled: boolean;
  readonly value: string;
  readonly onInput: (event: NativeTextInputEvent) => void;
}) {
  return (
    <Input
      className="AutomationCreateName"
      nativeInput
      unstyled
      aria-label="Automation title"
      disabled={disabled}
      maxLength={160}
      placeholder="Automation title"
      value={value}
      onChange={(event) => onInput({ detail: { value: event.target.value } })}
    />
  );
}

function AutomationToolbarIcon(props: {
  readonly className: string;
  readonly content: string;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className={props.className}
      content={colorizeLynxSvg(
        props.content,
        semanticIconColor('secondary')
      )}
      accessibility-element={false}
    />
  );
}

function AutomationWarningRow(props: {
  readonly checked?: boolean;
  readonly detail: string;
  readonly onToggle?: () => void;
  readonly title: string;
}) {
  if (!props.onToggle) {
    return (
      <view
        className="AutomationCreateWarning"
        accessibility-element={true}
        accessibility-label={`${props.title}. ${props.detail}`}
        accessibility-trait="text"
      >
        <view className="AutomationCreateWarningDot" />
        <view className="AutomationCreateWarningCopy">
          <text className="AutomationCreateWarningTitle">{props.title}</text>
          <text className="AutomationCreateWarningDetail">{props.detail}</text>
        </view>
      </view>
    );
  }

  return <InteractiveAutomationWarningRow {...props} onToggle={props.onToggle} />;
}

function InteractiveAutomationWarningRow(props: {
  readonly checked?: boolean;
  readonly detail: string;
  readonly onToggle: () => void;
  readonly title: string;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName:
      'AutomationCreateWarning AutomationCreateWarning--interactive',
    accessibleLabel: `${props.title}. ${props.detail}`,
    accessibilityValue:
      props.checked === undefined
        ? undefined
        : props.checked
          ? 'Checked'
          : 'Unchecked',
    accessibilityTraits: 'button',
    onActivate: props.onToggle,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <CheckboxIndicator checked={props.checked} size="sm" />
      <view className="AutomationCreateWarningCopy">
        <text className="AutomationCreateWarningTitle">{props.title}</text>
        <text className="AutomationCreateWarningDetail">{props.detail}</text>
      </view>
    </view>
  );
}

function NativeStopWhenInput({
  disabled,
  value,
  onInput,
}: {
  readonly disabled: boolean;
  readonly value: string;
  readonly onInput: (event: NativeTextInputEvent) => void;
}) {
  return (
    <Input
      className="AutomationCreateName"
      nativeInput
      unstyled
      aria-label="Heartbeat stop condition"
      disabled={disabled}
      maxLength={2000}
      placeholder="PR is ready to merge"
      value={value}
      onChange={(event) => onInput({ detail: { value: event.target.value } })}
    />
  );
}

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
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  );
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const initialProjectModelSelection = projects[0]?.defaultModelSelection;
  const [modelSelection, setModelSelection] = useState<ModelSelection>(() =>
    resolveAutomationModelSelection({
      projectModelSelection:
        initialProjectModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION,
      defaultProvider: generalSettings.defaultProvider,
    })
  );
  const [modelCatalogProvider, setModelCatalogProvider] = useState<ProviderKind>(
    modelSelection.provider
  );
  const [mode, setMode] = useState<AutomationCreateInput['mode']>('standalone');
  const [targetThreadId, setTargetThreadId] = useState('');
  const [stopWhen, setStopWhen] = useState('');
  const [schedule, setSchedule] = useState<CreateSchedule>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [maxIterations, setMaxIterations] = useState<number | null>(null);
  const [stopOnError, setStopOnError] = useState(true);
  const [interactionMode, setInteractionMode] = useState<
    AutomationCreateInput['interactionMode']
  >('default');
  const [runtimeMode, setRuntimeMode] = useState<
    AutomationCreateInput['runtimeMode']
  >('approval-required');
  const [worktreeMode, setWorktreeMode] =
    useState<CreateWorktreeMode>('auto');
  const [acknowledgedWarningIds, setAcknowledgedWarningIds] = useState<
    ReadonlySet<AutomationDraftWarningId>
  >(() => new Set());
  const serverConfig = useQuery({
    queryKey: ['automation-create', 'server-config'],
    queryFn: fetchAutomationCreateServerConfig,
    enabled: open,
    staleTime: 30_000,
  });
  const modelCatalog = useQuery({
    queryKey: [
      'automation-create',
      'models',
      modelCatalogProvider,
      projects.find((candidate) => candidate.id === projectId)?.workspaceRoot ??
        null,
    ],
    queryFn: () =>
      fetchAutomationCreateModels({
        provider: modelCatalogProvider,
        cwd:
          projects.find((candidate) => candidate.id === projectId)
            ?.workspaceRoot ?? null,
      }),
    enabled: open && Boolean(projects.find((candidate) => candidate.id === projectId)),
    staleTime: 30_000,
  });
  useEffect(() => {
    if (!open) return;
    const firstProject = projects[0];
    const nextModelSelection = resolveAutomationModelSelection({
      projectModelSelection:
        firstProject?.defaultModelSelection ??
        AUTOMATION_DEFAULT_MODEL_SELECTION,
      defaultProvider: generalSettings.defaultProvider,
    });
    setName('');
    setPrompt('');
    setProjectId(firstProject?.id ?? '');
    setModelSelection(nextModelSelection);
    setModelCatalogProvider(nextModelSelection.provider);
    setMode('standalone');
    setTargetThreadId('');
    setStopWhen('');
    setSchedule('daily');
    setTimeOfDay('09:00');
    setMaxIterations(null);
    setStopOnError(true);
    setInteractionMode('default');
    setRuntimeMode('approval-required');
    setWorktreeMode('auto');
    setAcknowledgedWarningIds(new Set());
  }, [open]);
  useEffect(() => {
    if (
      projects.length > 0 &&
      !projects.some((project) => project.id === projectId)
    ) {
      const firstProject = projects[0]!;
      const nextModelSelection = resolveAutomationModelSelection({
        projectModelSelection:
          firstProject.defaultModelSelection ??
          AUTOMATION_DEFAULT_MODEL_SELECTION,
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
      !threads.some(
        (thread) =>
          thread.id === targetThreadId && thread.projectId === projectId
      )
    ) {
      setTargetThreadId('');
    }
  }, [projectId, targetThreadId, threads]);
  const project = projects.find((candidate) => candidate.id === projectId);
  const projectThreads = threads.filter(
    (thread) =>
      thread.projectId === projectId && (thread.archivedAt ?? null) === null
  );
  const chooseProject = (nextProjectId: string) => {
    const currentProject = projects.find(
      (candidate) => candidate.id === projectId
    );
    const nextProject = projects.find(
      (candidate) => candidate.id === nextProjectId
    );
    const nextModelSelection = resolveAutomationModelSelectionForProjectChange({
      currentModelSelection: modelSelection,
      currentProjectModelSelection:
        currentProject?.defaultModelSelection ??
        AUTOMATION_DEFAULT_MODEL_SELECTION,
      nextProjectModelSelection:
        nextProject?.defaultModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION,
      defaultProvider: generalSettings.defaultProvider,
    });
    setProjectId(nextProjectId);
    setModelSelection(nextModelSelection);
    setModelCatalogProvider(nextModelSelection.provider);
  };
  const canCreate =
    !pending &&
    name.trim().length > 0 &&
    prompt.trim().length > 0 &&
    (schedule === 'manual' || isAutomationTimeOfDay(timeOfDay)) &&
    Boolean(project) &&
    (mode === 'standalone' || targetThreadId.length > 0);
  const warnings = buildAutomationDraftWarnings({
    schedule:
      schedule === 'manual'
        ? { type: 'manual' }
        : { type: schedule, timeOfDay },
    mode,
    runtimeMode,
    worktreeMode,
    hasEphemeralContext: false,
    generatedConfidence: null,
    generatedNeedsConfirmation: false,
    prompt,
  });
  const hasUnacknowledgedWarning = warnings.some(
    (warning) =>
      warning.requiresAcknowledgement &&
      !acknowledgedWarningIds.has(warning.id)
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
    onCreate(buildAutomationCreateInput({
      acknowledgeLocalCheckout: acknowledgedWarningIds.has('local-checkout'),
      completionPolicy: completionPolicyFromStopWhen(stopWhen),
      projectId: project.id as AutomationCreateInput['projectId'],
      interactionMode,
      mode,
      name,
      prompt,
      runtimeMode,
      schedule,
      timeOfDay,
      maxIterations,
      modelSelection,
      stopOnError,
      targetThreadId:
        mode === 'heartbeat'
          ? (targetThreadId as AutomationCreateInput['targetThreadId'])
          : null,
      worktreeMode,
    }));
  };
  const applyTemplate = (template: (typeof AUTOMATION_TEMPLATES)[number]) => {
    if (!name.trim()) setName(template.name);
    setPrompt(template.prompt);
  };
  const selectedProjectLabel = project?.title ?? 'Select project';
  const worktreeModeLabel =
    worktreeMode === 'auto'
      ? 'Auto'
      : worktreeMode === 'worktree'
        ? 'Worktree'
        : 'Local';
  const cadenceLabel =
    schedule === 'manual'
      ? 'Manual'
      : `${schedule === 'daily' ? 'Daily' : 'Weekdays'} at ${timeOfDay}`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup
        className={`AutomationCreateDialog${
          warnings.length > 3
            ? ' AutomationCreateDialog--expanded-more'
            : warnings.length > 2
              ? ' AutomationCreateDialog--expanded'
              : ''
        }`}
        showCloseButton={false}
      >
        <DialogTitle className="AutomationCreateAccessibleTitle">
          New automation
        </DialogTitle>
        <view className="AutomationCreateHeader">
          <NativeNameInput
            disabled={pending}
            value={name}
            onInput={(event) => setName(event.detail.value)}
          />
          <view className="AutomationCreateHeaderActions">
            <Button
              className="AutomationCreateHeaderIconButton"
              variant="ghost"
              size="icon-sm"
              aria-label="About automations"
            >
              <AutomationToolbarIcon
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
                  buttonProps={{ 'accessibility-element': false }}
                >
                  Use template
                </Button>
              </MenuTrigger>
              <MenuPopup
                align="end"
                className="AutomationCreateTemplateMenu"
              >
                {AUTOMATION_TEMPLATES.map((template) => (
                  <MenuItem
                    key={template.label}
                    onClick={() => applyTemplate(template)}
                  >
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
            maxLines={10}
            placeholder="Add prompt e.g. look for crashes in $sentry"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          {mode === 'heartbeat' ? (
            <view className="AutomationCreateHeartbeatFields">
              <text className="AutomationCreateLabel">Target thread</text>
              <view className="AutomationCreateProjects">
                {projectThreads.length === 0 ? (
                  <text className="AutomationCreateMutedText">
                    No threads in this project
                  </text>
                ) : (
                  projectThreads.map((thread) => (
                    <ChoiceOption
                      key={thread.id}
                      disabled={pending}
                      label={thread.title.trim() || 'New thread'}
                      selected={targetThreadId === thread.id}
                      onSelect={() => setTargetThreadId(thread.id)}
                    />
                  ))
                )}
              </view>
              <text className="AutomationCreateLabel">Stop when</text>
              <NativeStopWhenInput
                disabled={pending}
                value={stopWhen}
                onInput={(event) => setStopWhen(event.detail.value)}
              />
            </view>
          ) : null}
          <view className="AutomationCreateWarnings">
            {warnings.map((warning) => (
              <AutomationWarningRow
                key={warning.id}
                checked={
                  warning.requiresAcknowledgement
                    ? acknowledgedWarningIds.has(warning.id)
                    : undefined
                }
                title={warning.title}
                detail={warning.detail}
                onToggle={
                  warning.requiresAcknowledgement
                    ? () => toggleWarning(warning.id)
                    : undefined
                }
              />
            ))}
          </view>
          {error ? (
            <view className="AutomationCreateError" accessibility-element>
              <text className="AutomationCreateErrorText">{error}</text>
            </view>
          ) : null}
        </DialogPanel>
        <DialogFooter className="AutomationCreateFooter">
          <view className="AutomationCreateToolbar">
            <Menu>
              <MenuTrigger ariaLabel={`Runs in ${worktreeMode}`} disabled={pending}>
                <Button className="AutomationCreateChip" variant="ghost" size="sm" disabled={pending} buttonProps={{ 'accessibility-element': false }}>
                  <AutomationToolbarIcon className="AutomationCreateChipIcon" content={worktreeSvg} />
                  <text className="AutomationCreateChipText">{worktreeModeLabel}</text>
                  <ChevronDownIcon className="AutomationCreateChipChevron" color="var(--color-icon-secondary)" size={12} />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" className="AutomationCreateMenu">
                <MenuRadioGroup value={worktreeMode} onValueChange={(value) => { setWorktreeMode(value as CreateWorktreeMode); setAcknowledgedWarningIds(new Set()); }}>
                  <MenuRadioItem value="auto">Auto</MenuRadioItem>
                  <MenuRadioItem value="worktree">Worktree</MenuRadioItem>
                  <MenuRadioItem value="local">Local</MenuRadioItem>
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>
            <Menu>
              <MenuTrigger ariaLabel={`Project ${selectedProjectLabel}`} disabled={pending}>
                <Button className="AutomationCreateChip" variant="ghost" size="sm" disabled={pending} buttonProps={{ 'accessibility-element': false }}>
                  <FolderIcon className="AutomationCreateChipIcon" color="var(--color-icon-secondary)" size={16} />
                  <text className="AutomationCreateChipText AutomationCreateProjectLabel">{selectedProjectLabel}</text>
                  <ChevronDownIcon className="AutomationCreateChipChevron" color="var(--color-icon-secondary)" size={12} />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" className="AutomationCreateProjectMenu">
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
              modelSelection={modelSelection}
              catalogProvider={modelCatalogProvider}
              runtimeModels={modelCatalog.data?.models ?? []}
              modelsLoading={modelCatalog.isPending || (modelCatalog.isFetching && !modelCatalog.data)}
              providers={serverConfig.data?.providers ?? []}
              onCatalogProviderChange={setModelCatalogProvider}
              onModelSelectionChange={(selection) => { setModelSelection(selection); setModelCatalogProvider(selection.provider); }}
            />
            <Menu>
              <MenuTrigger ariaLabel={`Schedule ${cadenceLabel}`} disabled={pending}>
                <Button className="AutomationCreateChip" variant="ghost" size="sm" disabled={pending} buttonProps={{ 'accessibility-element': false }}>
                  <ClockIcon className="AutomationCreateChipIcon" color="var(--color-icon-secondary)" size={16} />
                  <text className="AutomationCreateChipText">{cadenceLabel}</text>
                  <ChevronDownIcon className="AutomationCreateChipChevron" color="var(--color-icon-secondary)" size={12} />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" className="AutomationCreateScheduleMenu">
                <MenuRadioGroup value={schedule} onValueChange={(value) => setSchedule(value as CreateSchedule)}>
                  <MenuRadioItem value="manual">Manual</MenuRadioItem>
                  <MenuRadioItem value="daily">Daily</MenuRadioItem>
                  <MenuRadioItem value="weekdays">Weekdays</MenuRadioItem>
                </MenuRadioGroup>
                {schedule === 'manual' ? null : (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuGroupLabel>Time</MenuGroupLabel>
                      <AutomationTimeInput defaultValue={timeOfDay} disabled={pending} onChange={setTimeOfDay} />
                    </MenuGroup>
                  </>
                )}
              </MenuPopup>
            </Menu>
            <Menu>
              <MenuTrigger ariaLabel="Run mode" disabled={pending}>
                <Button className="AutomationCreateIconChip" variant="ghost" size="icon-sm" disabled={pending} buttonProps={{ 'accessibility-element': false }}>
                  <AutomationToolbarIcon className="AutomationCreateChipIcon" content={modeSvg} />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" className="AutomationCreateModeMenu">
                <MenuGroup><MenuGroupLabel>Mode</MenuGroupLabel>
                  <MenuRadioGroup value={mode} onValueChange={(value) => setMode(value as AutomationCreateInput['mode'])}>
                    <MenuRadioItem value="standalone">Standalone</MenuRadioItem>
                    <MenuRadioItem value="heartbeat">Heartbeat</MenuRadioItem>
                  </MenuRadioGroup>
                </MenuGroup>
                <MenuSeparator />
                <MenuGroup><MenuGroupLabel>Max iterations</MenuGroupLabel>
                  <MenuRadioGroup value={maxIterations === null ? 'unlimited' : String(maxIterations)} onValueChange={(value) => setMaxIterations(value === 'unlimited' ? null : Number(value))}>
                    <MenuRadioItem value="unlimited">Unlimited</MenuRadioItem>
                    <MenuRadioItem value="10">10 runs</MenuRadioItem>
                    <MenuRadioItem value="25">25 runs</MenuRadioItem>
                  </MenuRadioGroup>
                </MenuGroup>
                {mode === 'heartbeat' ? (
                  <>
                    <MenuSeparator />
                    <MenuCheckboxItem checked={stopOnError} onCheckedChange={setStopOnError}>Stop on error</MenuCheckboxItem>
                  </>
                ) : null}
              </MenuPopup>
            </Menu>
            <Menu>
              <MenuTrigger ariaLabel="Permissions" disabled={pending}>
                <Button className="AutomationCreateIconChip" variant="ghost" size="icon-sm" disabled={pending} buttonProps={{ 'accessibility-element': false }}>
                  <BrainIcon className="AutomationCreateChipIcon" color="var(--color-icon-secondary)" size={16} />
                </Button>
              </MenuTrigger>
              <MenuPopup align="start" className="AutomationCreatePermissionsMenu">
                <MenuRadioGroup value={runtimeMode} onValueChange={(value) => { setRuntimeMode(value as AutomationCreateInput['runtimeMode']); setAcknowledgedWarningIds(new Set()); }}>
                  <MenuRadioItem value="approval-required">Approval required</MenuRadioItem>
                  <MenuRadioItem value="full-access">Full access</MenuRadioItem>
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>
          </view>
          <view className="AutomationCreateFooterActions">
            <Button variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!canCreate || hasUnacknowledgedWarning} onClick={submit}>{pending ? 'Creating...' : 'Create'}</Button>
          </view>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
