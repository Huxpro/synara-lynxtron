import { createElement, useEffect, useState } from '@lynx-js/react';
import type { AutomationCreateInput } from '@synara/contracts';
import { getDefaultModel } from '@synara/shared/model';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
} from '@synara-web/appSettingsStorageProjection.logic';

import type { ProjectSummary } from './queries';
import { webStorage } from '../platform/storage';
import { dialogs } from '../platform/dialogs';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '../components/ui/dialog.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  buildAutomationCreateInput,
  type CreateSchedule,
  type CreateWorktreeMode,
} from './automationCreate.logic';

interface NativeTextInputEvent {
  readonly detail: {
    readonly value: string;
  };
}

function NativeNameInput({
  disabled,
  onInput,
}: {
  readonly disabled: boolean;
  readonly onInput: (event: NativeTextInputEvent) => void;
}) {
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  );
  return createElement('input', {
    className: 'AutomationCreateName',
    'accessibility-element': true,
    'accessibility-label': 'Automation name',
    disabled,
    focusable: !disabled,
    maxlength: 160,
    placeholder: 'Daily release review',
    'send-composing-input': true,
    bindinput: onInput,
  });
}

function NativeTimeInput({
  disabled,
  onInput,
}: {
  readonly disabled: boolean;
  readonly onInput: (event: NativeTextInputEvent) => void;
}) {
  return createElement('input', {
    className: 'AutomationCreateTime',
    'accessibility-element': true,
    'accessibility-label': 'Automation time',
    'default-value': '09:00',
    disabled,
    focusable: !disabled,
    inputFilter: '[0-9:]*',
    maxlength: 5,
    placeholder: '09:00',
    'send-composing-input': true,
    bindinput: onInput,
  });
}

function ProjectOption({
  disabled,
  project,
  selected,
  onSelect,
}: {
  readonly disabled: boolean;
  readonly project: ProjectSummary;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `AutomationCreateProject${
      selected ? ' AutomationCreateProject--selected' : ''
    }`,
    accessibleLabel: `Create automation in ${project.title}`,
    accessibilityValue: selected ? 'Selected' : undefined,
    disabled,
    onActivate: onSelect,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="AutomationCreateProjectText">{project.title}</text>
    </view>
  );
}

function ChoiceOption({
  disabled,
  label,
  selected,
  onSelect,
}: {
  readonly disabled: boolean;
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `AutomationCreateChoice${
      selected ? ' AutomationCreateChoice--selected' : ''
    }`,
    accessibleLabel: label,
    accessibilityValue: selected ? 'Selected' : undefined,
    disabled,
    onActivate: onSelect,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="AutomationCreateChoiceText">{label}</text>
    </view>
  );
}

export function AutomationCreateDialog({
  open,
  projects,
  pending,
  error,
  onCreate,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly projects: readonly ProjectSummary[];
  readonly pending: boolean;
  readonly error: string | null;
  readonly onCreate: (input: AutomationCreateInput) => void;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
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
  useEffect(() => {
    if (
      projects.length > 0 &&
      !projects.some((project) => project.id === projectId)
    ) {
      setProjectId(projects[0]!.id);
    }
  }, [projectId, projects]);
  const project = projects.find((candidate) => candidate.id === projectId);
  const modelSelection =
    project?.defaultModelSelection ?? {
      provider: generalSettings.defaultProvider,
      model: getDefaultModel(generalSettings.defaultProvider),
    };
  const canCreate =
    !pending &&
    name.trim().length > 0 &&
    prompt.trim().length > 0 &&
    (schedule === 'manual' || /^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(timeOfDay)) &&
    Boolean(project);

  const submit = () => {
    if (!canCreate || !project) return;
    onCreate(buildAutomationCreateInput({
      projectId: project.id as AutomationCreateInput['projectId'],
      interactionMode,
      name,
      prompt,
      runtimeMode,
      schedule,
      timeOfDay,
      maxIterations,
      modelSelection,
      stopOnError,
      worktreeMode,
    }));
  };
  const selectFullAccess = async () => {
    'background only';
    const confirmed = await dialogs.confirm(
      'Allow this automation to run with full access?\n\nScheduled full-access runs can make changes without per-step approval.'
    );
    if (confirmed) setRuntimeMode('full-access');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="AutomationCreateDialog">
        <DialogTitle>New automation</DialogTitle>
        <DialogDescription>
          Schedule a prompt to run every day at 9:00.
        </DialogDescription>
        <DialogPanel className="AutomationCreatePanel">
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Name</text>
            <NativeNameInput
              disabled={pending}
              onInput={(event) => setName(event.detail.value)}
            />
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Prompt</text>
            {createElement('textarea', {
              className: 'AutomationCreatePrompt',
              'accessibility-element': true,
              'accessibility-label': 'Automation prompt',
              disabled: pending,
              focusable: !pending,
              maxlength: 64000,
              maxlines: 8,
              placeholder: 'Describe what the automation should do',
              'send-composing-input': true,
              bindinput: (event: NativeTextInputEvent) =>
                setPrompt(event.detail.value),
            })}
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Project</text>
            <view className="AutomationCreateProjects">
              {projects.map((candidate) => (
                <ProjectOption
                  key={candidate.id}
                  disabled={pending}
                  project={candidate}
                  selected={candidate.id === projectId}
                  onSelect={() => setProjectId(candidate.id)}
                />
              ))}
            </view>
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Repeats</text>
            <view className="AutomationCreateChoices">
              {(
                [
                  ['manual', 'Manual'],
                  ['daily', 'Daily'],
                  ['weekdays', 'Weekdays'],
                ] as const
              ).map(([value, label]) => (
                <ChoiceOption
                  key={value}
                  disabled={pending}
                  label={label}
                  selected={schedule === value}
                  onSelect={() => setSchedule(value)}
                />
              ))}
            </view>
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Runs in</text>
            <view className="AutomationCreateChoices">
              <ChoiceOption
                disabled={pending}
                label="Auto"
                selected={worktreeMode === 'auto'}
                onSelect={() => setWorktreeMode('auto')}
              />
              <ChoiceOption
                disabled={pending}
                label="Worktree"
                selected={worktreeMode === 'worktree'}
                onSelect={() => setWorktreeMode('worktree')}
              />
              <ChoiceOption
                disabled={pending}
                label="Local"
                selected={worktreeMode === 'local'}
                onSelect={() => setWorktreeMode('local')}
              />
            </view>
          </view>
          {schedule === 'manual' ? null : (
            <view className="AutomationCreateField">
              <text className="AutomationCreateLabel">Time</text>
              <NativeTimeInput
                disabled={pending}
                onInput={(event) => setTimeOfDay(event.detail.value)}
              />
            </view>
          )}
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Max iterations</text>
            <view className="AutomationCreateChoices">
              {(
                [
                  [null, 'Unlimited'],
                  [10, '10 runs'],
                  [25, '25 runs'],
                ] as const
              ).map(([value, label]) => (
                <ChoiceOption
                  key={label}
                  disabled={pending}
                  label={label}
                  selected={maxIterations === value}
                  onSelect={() => setMaxIterations(value)}
                />
              ))}
            </view>
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Stop on error</text>
            <view className="AutomationCreateChoices">
              <ChoiceOption
                disabled={pending}
                label="On"
                selected={stopOnError}
                onSelect={() => setStopOnError(true)}
              />
              <ChoiceOption
                disabled={pending}
                label="Off"
                selected={!stopOnError}
                onSelect={() => setStopOnError(false)}
              />
            </view>
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Interaction mode</text>
            <view className="AutomationCreateChoices">
              <ChoiceOption
                disabled={pending}
                label="Default"
                selected={interactionMode === 'default'}
                onSelect={() => setInteractionMode('default')}
              />
              <ChoiceOption
                disabled={pending}
                label="Plan"
                selected={interactionMode === 'plan'}
                onSelect={() => setInteractionMode('plan')}
              />
            </view>
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Permissions</text>
            <view className="AutomationCreateChoices">
              <ChoiceOption
                disabled={pending}
                label="Approval required"
                selected={runtimeMode === 'approval-required'}
                onSelect={() => setRuntimeMode('approval-required')}
              />
              <ChoiceOption
                disabled={pending}
                label="Full access"
                selected={runtimeMode === 'full-access'}
                onSelect={() => void selectFullAccess()}
              />
            </view>
          </view>
          <view className="AutomationCreateSummary">
            <text className="AutomationCreateSummaryText">
              {schedule === 'manual'
                ? 'Manual'
                : schedule === 'daily'
                  ? `Daily at ${timeOfDay}`
                  : `Weekdays at ${timeOfDay}`}{' '}
              ·{' '}
              {worktreeMode === 'auto'
                ? 'Auto workspace'
                : worktreeMode === 'worktree'
                  ? 'New worktree'
                  : 'Local checkout'}{' '}
              ·{' '}
              {modelSelection?.model ?? 'Choose a project model'} ·{' '}
              {maxIterations === null
                ? 'Unlimited runs'
                : `${maxIterations} runs`}{' '}
              · {stopOnError ? 'Stops on error' : 'Continues after errors'}
              {' '}· {interactionMode === 'plan' ? 'Plan mode' : 'Default mode'}
              {' '}· {runtimeMode === 'full-access' ? 'Full access' : 'Approval required'}
            </text>
          </view>
          {error ? (
            <view className="AutomationCreateError" accessibility-element>
              <text className="AutomationCreateErrorText">{error}</text>
            </view>
          ) : null}
        </DialogPanel>
        <DialogFooter className="AutomationCreateFooter">
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canCreate} onClick={submit}>
            {pending ? 'Creating...' : 'Create automation'}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
