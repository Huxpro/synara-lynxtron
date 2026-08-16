import { useEffect, useState } from '@lynx-js/react';
import type { AutomationDefinition, AutomationUpdateInput } from '@synara/contracts';

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
  automationEditStopWhen,
  buildAutomationEditInput,
} from './automationEdit.logic';

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
  const initialStopWhen = automationEditStopWhen(definition);
  const [stopWhen, setStopWhen] = useState(initialStopWhen);
  const [maxIterations, setMaxIterations] = useState<number | null>(
    definition.maxIterations
  );
  useEffect(() => {
    if (!open) return;
    setName(definition.name);
    setPrompt(definition.prompt);
    setStopWhen(initialStopWhen);
    setMaxIterations(definition.maxIterations);
  }, [
    definition.maxIterations,
    definition.name,
    definition.prompt,
    initialStopWhen,
    open,
  ]);
  const normalizedStopWhen = stopWhen.trim();
  const canSave =
    !pending &&
    name.trim().length > 0 &&
    prompt.trim().length > 0 &&
    automationEditIsDirty({
      definition,
      name,
      prompt,
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
