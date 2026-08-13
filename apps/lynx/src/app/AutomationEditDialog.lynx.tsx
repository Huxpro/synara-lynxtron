import { useEffect, useRef, useState } from '@lynx-js/react';
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
import { sleepOnHost } from '../platform/timer';

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
  const promptRef = useRef<React.ElementRef<'textarea'>>(null);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setName(definition.name);
    setPrompt(definition.prompt);
    void sleepOnHost(0).then(() => {
      if (cancelled) return;
      promptRef.current
        ?.invoke({
          method: 'setValue',
          params: { value: definition.prompt },
        })
        .exec();
    });
    return () => {
      cancelled = true;
    };
  }, [definition.name, definition.prompt, open]);
  const canSave =
    !pending &&
    name.trim().length > 0 &&
    prompt.trim().length > 0 &&
    (name.trim() !== definition.name || prompt.trim() !== definition.prompt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="AutomationEditDialog">
        <DialogTitle>Edit automation</DialogTitle>
        <DialogDescription>
          Update the name and prompt without changing its schedule or policy.
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
              ref={promptRef}
              key={`prompt:${definition.updatedAt}:${open}`}
              className="AutomationCreatePrompt"
              accessibility-element={true}
              accessibility-label="Automation prompt"
              disabled={pending}
              focusable={!pending}
              maxlength={64000}
              maxlines={10}
              send-composing-input={true}
              bindinput={(event: NativeTextInputEvent) =>
                setPrompt(event.detail.value)
              }
            />
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
              onSave({
                id: definition.id,
                name: name.trim(),
                prompt: prompt.trim(),
              })
            }
          >
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
