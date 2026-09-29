import {
  SPACE_NAME_MAX_LENGTH,
  type OrchestrationSpaceShell,
  type SpaceIconName,
} from "@synara/contracts";
import type { InputRef } from "@lynx-js/lynx-ui";
import { useEffect, useRef, useState } from "@lynx-js/react";
import { SPACE_ICON_OPTIONS, validateSpaceName } from "@synara/shared/spacePresentation";

import { LynxSpaceIcon } from "../../adapters/ComposerProjectPickerCompositionElements.lynx";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog.lynx";
import { Input } from "../ui/input.lynx";
import { useLynxInteractiveState } from "../ui/interactive-state.lynx";

function SpaceIconOption(props: {
  readonly icon: SpaceIconName;
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `AppSidebarSpaceIconOption${
      props.selected ? " AppSidebarSpaceIconOption--active" : ""
    }`,
    accessibleLabel: props.label,
    accessibilityTraits: props.selected ? "selected" : "button",
    onActivate: props.onSelect,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <LynxSpaceIcon icon={props.icon} size={15} />
    </view>
  );
}

export function SpaceEditorDialogLynx(props: {
  readonly existingNames: readonly string[];
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (value: {
    readonly name: string;
    readonly icon: SpaceIconName;
  }) => Promise<void>;
  readonly open: boolean;
  readonly space: OrchestrationSpaceShell | null;
  readonly mode?: "create" | "edit";
}) {
  const mode = props.mode ?? "edit";
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<SpaceIconName>("bag");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (!props.open) return;
    setName(props.space?.name ?? "");
    setIcon(props.space?.icon ?? "bag");
    setError(null);
    setSaving(false);
    void inputRef.current
      ?.focus()
      .then(() => inputRef.current?.setSelectionRange(0, props.space?.name.length ?? 0));
  }, [props.open, props.space?.id]);
  const nameError = validateSpaceName(name, props.existingNames);
  const save = async () => {
    if ((mode === "edit" && !props.space) || nameError || saving) return;
    if (mode === "edit" && name.trim() === props.space?.name && icon === props.space?.icon) {
      props.onOpenChange(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await props.onSave({ name: name.trim(), icon });
      props.onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the space.");
      setSaving(false);
    }
  };
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="AppSidebarSpaceEditorDialog">
        <DialogTitle>{mode === "create" ? "New space" : "Edit space"}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Group projects into a focused work context."
            : "Rename this space or give it a different icon. Its projects stay where they are."}
        </DialogDescription>
        <DialogPanel className="AppSidebarSpaceEditorPanel">
          <text className="AppSidebarSpaceEditorLabel">Name</text>
          <Input
            ref={inputRef}
            nativeInput
            value={name}
            maxLength={SPACE_NAME_MAX_LENGTH}
            aria-label="Space name"
            aria-invalid={Boolean(nameError)}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault?.();
                void save();
              }
            }}
          />
          {name.length > 0 && nameError ? (
            <text className="AppSidebarSpaceEditorError">{nameError}</text>
          ) : null}
          <text className="AppSidebarSpaceEditorLabel">Icon</text>
          <view className="AppSidebarSpaceIconGrid">
            {SPACE_ICON_OPTIONS.map((option) => {
              const selected = option.name === icon;
              return (
                <SpaceIconOption
                  key={option.name}
                  icon={option.name}
                  label={option.label}
                  selected={selected}
                  onSelect={() => setIcon(option.name)}
                />
              );
            })}
          </view>
          {error ? <text className="AppSidebarSpaceEditorError">{error}</text> : null}
        </DialogPanel>
        <DialogFooter>
          <Button variant="ghost" disabled={saving} onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={Boolean(nameError) || saving} onClick={() => void save()}>
            {saving ? "Saving…" : mode === "create" ? "Create space" : "Save"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
