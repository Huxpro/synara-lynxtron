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
  useEffect(() => {
    if (!open) return;
    setName(definition.name);
    setPrompt(definition.prompt);
    setStopWhen(initialStopWhen);
  }, [definition.name, definition.prompt, initialStopWhen, open]);
  const normalizedStopWhen = stopWhen.trim();
  const canSave =
    !pending &&
    name.trim().length > 0 &&
    prompt.trim().length > 0 &&
    automationEditIsDirty({ definition, name, prompt, stopWhen });

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
