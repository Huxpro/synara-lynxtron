import { createElement, useEffect, useState } from '@lynx-js/react';
import type { AutomationCreateInput } from '@synara/contracts';

import type { ProjectSummary } from './queries';
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
  const modelSelection = project?.defaultModelSelection ?? null;
  const canCreate =
    !pending &&
    name.trim().length > 0 &&
    prompt.trim().length > 0 &&
    Boolean(project && modelSelection);

  const submit = () => {
    if (!canCreate || !project || !modelSelection) return;
    onCreate(buildAutomationCreateInput({
      projectId: project.id as AutomationCreateInput['projectId'],
      name,
      prompt,
      schedule,
      modelSelection,
      worktreeMode,
    }));
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
            </view>
          </view>
          <view className="AutomationCreateSummary">
            <text className="AutomationCreateSummaryText">
              {schedule === 'manual'
                ? 'Manual'
                : schedule === 'daily'
                  ? 'Daily at 9:00'
                  : 'Weekdays at 9:00'}{' '}
              · {worktreeMode === 'auto' ? 'Auto workspace' : 'New worktree'} ·{' '}
              {modelSelection?.model ?? 'Choose a project model'}
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
