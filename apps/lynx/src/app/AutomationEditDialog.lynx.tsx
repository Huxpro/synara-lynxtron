import { useEffect, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type {
  AutomationDefinition,
  AutomationUpdateInput,
  ModelSelection,
  ProviderKind,
} from '@synara/contracts';

import { ComposerModelControl } from '../components/composer/ComposerModelControl.lynx';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '../components/ui/dialog.lynx';
import { Input } from '../components/ui/input.lynx';
import { AutomationChoiceOption } from './AutomationChoiceOption.lynx';
import {
  automationEditIsDirty,
  automationEditScheduleForKind,
  automationEditStopWhen,
  buildAutomationEditInput,
  type AutomationEditScheduleKind,
} from './automationEdit.logic';
import { AutomationTimeInput } from './AutomationTimeInput.lynx';
import { isAutomationTimeOfDay } from './automationTime.logic';
import { isAutomationTimezone } from './automationTimezone.logic';
import {
  fetchAutomationCreateModels,
  fetchAutomationCreateServerConfig,
} from './queries';

interface NativeTextInputEvent {
  readonly detail: {
    readonly value: string;
  };
}

export function AutomationEditDialog({
  definition,
  open,
  pending,
  error,
  onOpenChange,
  onSave,
}: {
  readonly definition: AutomationDefinition;
  readonly open: boolean;
  readonly pending: boolean;
  readonly error: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (input: AutomationUpdateInput) => void;
}) {
  const [name, setName] = useState(definition.name);
  const [prompt, setPrompt] = useState(definition.prompt);
  const [modelSelection, setModelSelection] = useState<ModelSelection>(
    definition.modelSelection
  );
  const [modelCatalogProvider, setModelCatalogProvider] = useState<ProviderKind>(
    definition.modelSelection.provider
  );
  const [schedule, setSchedule] = useState(definition.schedule);
  const initialStopWhen = automationEditStopWhen(definition);
  const [stopWhen, setStopWhen] = useState(initialStopWhen);
  const [maxIterations, setMaxIterations] = useState<number | null>(
    definition.maxIterations
  );
  useEffect(() => {
    if (!open) return;
    setName(definition.name);
    setPrompt(definition.prompt);
    setModelSelection(definition.modelSelection);
    setModelCatalogProvider(definition.modelSelection.provider);
    setSchedule(definition.schedule);
    setStopWhen(initialStopWhen);
    setMaxIterations(definition.maxIterations);
  }, [
    definition.maxIterations,
    definition.modelSelection,
    definition.name,
    definition.prompt,
    definition.schedule,
    initialStopWhen,
    open,
  ]);
  const serverConfig = useQuery({
    queryKey: ['automation-edit', 'server-config'],
    queryFn: fetchAutomationCreateServerConfig,
    enabled: open,
    staleTime: 30_000,
  });
  const modelCatalog = useQuery({
    queryKey: ['automation-edit', 'models', modelCatalogProvider],
    queryFn: () =>
      fetchAutomationCreateModels({
        provider: modelCatalogProvider,
        cwd: null,
      }),
    enabled: open,
    staleTime: 30_000,
  });
  const normalizedStopWhen = stopWhen.trim();
  const timedSchedule =
    schedule.type === 'daily' || schedule.type === 'weekdays' ? schedule : null;
  const canSave =
    !pending &&
    name.trim().length > 0 &&
    prompt.trim().length > 0 &&
    (timedSchedule === null ||
      (isAutomationTimeOfDay(timedSchedule.timeOfDay) &&
        (timedSchedule.timezone === undefined ||
          isAutomationTimezone(timedSchedule.timezone)))) &&
    automationEditIsDirty({
      definition,
      name,
      prompt,
      modelSelection,
      schedule,
      stopWhen,
      maxIterations,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="AutomationEditDialog">
        <DialogTitle>Edit automation</DialogTitle>
        <DialogDescription>
          Update the name, prompt, and Heartbeat stop condition.
        </DialogDescription>
        <DialogPanel className="AutomationEditPanel">
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Name</text>
            <Input
              key={`name:${definition.updatedAt}:${open}`}
              nativeInput
              accessibleLabel="Automation name"
              className="AutomationEditName"
              defaultValue={definition.name}
              disabled={pending}
              maxLength={160}
              onChange={(event) => setName(event.target.value)}
            />
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Prompt</text>
            <textarea
              key={`prompt:${definition.updatedAt}:${open}`}
              className="AutomationCreatePrompt"
              accessibility-element={true}
              accessibility-label="Automation prompt"
              disabled={pending}
              focusable={!pending}
              maxlength={64000}
              maxlines={10}
              default-value={definition.prompt}
              send-composing-input={true}
              bindinput={(event: NativeTextInputEvent) =>
                setPrompt(event.detail.value)
              }
            />
          </view>
          <view className="AutomationCreateField">
            <text className="AutomationCreateLabel">Model</text>
            <ComposerModelControl
              modelSelection={modelSelection}
              catalogProvider={modelCatalogProvider}
              runtimeModels={modelCatalog.data?.models ?? []}
              modelsLoading={
                modelCatalog.isPending ||
                (modelCatalog.isFetching && !modelCatalog.data)
              }
              providers={serverConfig.data?.providers ?? []}
              onCatalogProviderChange={setModelCatalogProvider}
              onModelSelectionChange={(selection) => {
                setModelSelection(selection);
                setModelCatalogProvider(selection.provider);
              }}
            />
          </view>
          {definition.mode === 'heartbeat' ? (
            <view className="AutomationCreateField">
              <text className="AutomationCreateLabel">Stop when</text>
              <Input
                key={`stop-when:${definition.updatedAt}:${open}`}
                nativeInput
                accessibleLabel="Heartbeat stop condition"
                className="AutomationEditStopWhen"
                defaultValue={initialStopWhen}
                disabled={pending}
                maxLength={2000}
                placeholder="PR is ready to merge"
                onChange={(event) => setStopWhen(event.target.value)}
              />
            </view>
          ) : null}
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
                <AutomationChoiceOption
                  key={value}
                  disabled={pending}
                  label={label}
                  selected={schedule.type === value}
                  onSelect={() =>
                    setSchedule(
                      automationEditScheduleForKind(
                        schedule,
                        value as AutomationEditScheduleKind
                      )
                    )
                  }
                />
              ))}
            </view>
          </view>
          {timedSchedule === null ? null : (
            <view className="AutomationCreateField">
              <text className="AutomationCreateLabel">Time</text>
              <AutomationTimeInput
                key={`time:${definition.updatedAt}:${open}:${timedSchedule.type}`}
                defaultValue={timedSchedule.timeOfDay}
                disabled={pending}
                onChange={(timeOfDay) =>
                  setSchedule({ ...timedSchedule, timeOfDay })
                }
              />
            </view>
          )}
          {timedSchedule?.timezone === undefined ? null : (
            <view className="AutomationCreateField">
              <text className="AutomationCreateLabel">Timezone</text>
              <Input
                key={`timezone:${definition.updatedAt}:${open}:${timedSchedule.type}`}
                nativeInput
                accessibleLabel="Automation timezone"
                className="AutomationEditTimezone"
                defaultValue={timedSchedule.timezone}
                disabled={pending}
                maxLength={128}
                onChange={(event) =>
                  setSchedule({
                    ...timedSchedule,
                    timezone: event.target.value,
                  })
                }
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
                  [50, '50 runs'],
                  [100, '100 runs'],
                  [250, '250 runs'],
                ] as const
              ).map(([value, label]) => (
                <AutomationChoiceOption
                  key={label}
                  disabled={pending}
                  label={label}
                  selected={maxIterations === value}
                  onSelect={() => setMaxIterations(value)}
                />
              ))}
            </view>
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
          <Button
            disabled={!canSave}
            onClick={() =>
              onSave(
                buildAutomationEditInput({
                  definition,
                  name,
                  prompt,
                  modelSelection,
                  schedule,
                  stopWhen: normalizedStopWhen,
                  maxIterations,
                })
              )
            }
          >
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
