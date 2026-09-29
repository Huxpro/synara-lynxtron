import { useState } from "@lynx-js/react";
import type { ProjectScriptIcon } from "@synara/contracts";

import { BugIcon, FlaskIcon, HammerIcon, ListChecksIcon, SettingsIcon } from "../lib/icons.lynx";
import playSvg from "@synara-central-icons-fill/play.svg?raw";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input.lynx";
import { Textarea } from "../components/ui/textarea.lynx";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../components/ui/dialog.lynx";
import { useLynxInteractiveState } from "../components/ui/interactive-state.lynx";
import { projectActionKeybindingFromEvent } from "./projectActionEditor.logic";
import { useTheme } from "../adapters/useTheme.lynx";

import "./project-action-editor.css";

const SCRIPT_ICONS: ReadonlyArray<{ readonly id: ProjectScriptIcon; readonly label: string }> = [
  { id: "play", label: "Play" },
  { id: "test", label: "Test" },
  { id: "lint", label: "Lint" },
  { id: "configure", label: "Configure" },
  { id: "build", label: "Build" },
  { id: "debug", label: "Debug" },
];

type ScriptIconRole = "trigger" | "option";

function ScriptIcon(props: { readonly icon: ProjectScriptIcon; readonly role: ScriptIconRole }) {
  const { svgColors } = useTheme();
  const color = props.role === "trigger" ? svgColors.foreground80 : svgColors.foreground;
  const size = props.role === "trigger" ? 18 : 16;
  const className = `ProjectActionEditorScriptIcon ProjectActionEditorScriptIcon--${props.role}`;
  const iconProps = { className, size, color } as const;
  if (props.icon === "test") return <FlaskIcon {...iconProps} />;
  if (props.icon === "lint") return <ListChecksIcon {...iconProps} />;
  if (props.icon === "configure") return <SettingsIcon {...iconProps} />;
  if (props.icon === "build") return <HammerIcon {...iconProps} />;
  if (props.icon === "debug") return <BugIcon {...iconProps} />;
  return (
    <svg
      className={className}
      content={colorizeLynxSvg(playSvg, color)}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

function ActionIconOption(props: {
  readonly active: boolean;
  readonly icon: ProjectScriptIcon;
  readonly label: string;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `ProjectActionEditorIconOption${props.active ? " ProjectActionEditorIconOption--active" : ""}`,
    accessibleLabel: `Use ${props.label} icon`,
    accessibilityValue: props.active ? "Selected" : "Not selected",
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      accessibility-role="button"
      accessibility-state={{ selected: props.active }}
      {...interaction.eventProps}
    >
      <ScriptIcon icon={props.icon} role="option" />
      <text className="ProjectActionEditorIconLabel">{props.label}</text>
    </view>
  );
}

export interface ProjectActionEditorValue {
  readonly command: string;
  readonly icon: ProjectScriptIcon;
  readonly name: string;
  readonly keybinding: string | null;
  readonly runOnWorktreeCreate: boolean;
}

export function ProjectActionEditor(props: {
  readonly busy?: boolean;
  readonly error?: string | null;
  readonly initialValue?: ProjectActionEditorValue;
  readonly open: boolean;
  readonly onDelete?: () => Promise<void> | void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (value: ProjectActionEditorValue) => Promise<void> | void;
}) {
  const editing = props.initialValue !== undefined;
  const [name, setName] = useState(props.initialValue?.name ?? "");
  const [command, setCommand] = useState(props.initialValue?.command ?? "");
  const [icon, setIcon] = useState<ProjectScriptIcon>(props.initialValue?.icon ?? "play");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [keybinding, setKeybinding] = useState(props.initialValue?.keybinding ?? "");
  const [runOnWorktreeCreate, setRunOnWorktreeCreate] = useState(
    props.initialValue?.runOnWorktreeCreate ?? false,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const toggleInteraction = useLynxInteractiveState({
    baseClassName: `ProjectActionEditorSwitch${runOnWorktreeCreate ? " ProjectActionEditorSwitch--on" : ""}`,
    accessibleLabel: "Run automatically on worktree creation",
    accessibilityValue: runOnWorktreeCreate ? "On" : "Off",
    disabled: props.busy,
    onActivate: () => setRunOnWorktreeCreate((current) => !current),
  });

  const close = () => {
    setValidationError(null);
    props.onOpenChange(false);
  };
  const save = async () => {
    const trimmedName = name.trim();
    const trimmedCommand = command.trim();
    if (!trimmedName) {
      setValidationError("Name is required.");
      return;
    }
    if (!trimmedCommand) {
      setValidationError("Command is required.");
      return;
    }
    setValidationError(null);
    await props.onSave({
      command: trimmedCommand,
      icon,
      keybinding: keybinding.trim() || null,
      name: trimmedName,
      runOnWorktreeCreate,
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="ProjectActionEditorDialog">
        <DialogHeader className="ProjectActionEditorHeader">
          <DialogTitle>{editing ? "Edit Action" : "Add Action"}</DialogTitle>
          <DialogDescription>
            Actions are project-scoped commands you can run from the top bar or keybindings.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="ProjectActionEditorPanel">
          <view className="ProjectActionEditorField">
            <text className="ProjectActionEditorLabel">Name</text>
            <view className="ProjectActionEditorNameRow">
              <view className="ProjectActionEditorIconPicker">
                <Button
                  size="icon-lg"
                  variant="outline"
                  aria-label="Choose icon"
                  disabled={props.busy}
                  onClick={() => setIconPickerOpen((current) => !current)}
                >
                  <ScriptIcon icon={icon} role="trigger" />
                </Button>
                {iconPickerOpen ? (
                  <view className="ProjectActionEditorIconPopup">
                    <view className="ProjectActionEditorIconGrid">
                      {SCRIPT_ICONS.map((entry) => (
                        <ActionIconOption
                          key={entry.id}
                          icon={entry.id}
                          label={entry.label}
                          active={entry.id === icon}
                          onSelect={() => {
                            setIcon(entry.id);
                            setIconPickerOpen(false);
                          }}
                        />
                      ))}
                    </view>
                  </view>
                ) : null}
              </view>
              <Input
                className="ProjectActionEditorNameInput"
                nativeInput
                disabled={props.busy}
                aria-label="Action name"
                placeholder="Test"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </view>
          </view>
          <view className="ProjectActionEditorField">
            <text className="ProjectActionEditorLabel">Keybinding</text>
            <Input
              nativeInput
              aria-label="Action keybinding"
              disabled={props.busy}
              placeholder="Press shortcut"
              readonly
              value={keybinding}
              onKeyDown={(event) => {
                const next = projectActionKeybindingFromEvent(event);
                if (next === null) return;
                event.preventDefault?.();
                setKeybinding(next);
              }}
            />
            <text className="ProjectActionEditorHint">
              Press a shortcut. Use Backspace to clear.
            </text>
          </view>
          <view className="ProjectActionEditorField">
            <text className="ProjectActionEditorLabel">Command</text>
            <Textarea
              className="ProjectActionEditorCommandInput"
              nativeInput
              maxLines={5}
              maxLength={8000}
              disabled={props.busy}
              aria-label="Action command"
              placeholder="bun test"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
            />
          </view>
          <view
            className={toggleInteraction.className}
            accessibility-role="switch"
            accessibility-state={{ checked: runOnWorktreeCreate, disabled: props.busy ?? false }}
            {...toggleInteraction.eventProps}
          >
            <text className="ProjectActionEditorSwitchLabel">
              Run automatically on worktree creation
            </text>
            <view className="ProjectActionEditorSwitchTrack">
              <view className="ProjectActionEditorSwitchThumb" />
            </view>
          </view>
          {validationError || props.error ? (
            <text className="ProjectActionEditorError">{validationError ?? props.error}</text>
          ) : null}
        </DialogPanel>
        <DialogFooter className="ProjectActionEditorFooter">
          {editing && props.onDelete ? (
            <Button
              size="sm"
              variant="destructive-outline"
              className="ProjectActionEditorDelete"
              disabled={props.busy}
              onClick={() => void props.onDelete?.()}
            >
              Delete
            </Button>
          ) : null}
          <Button size="sm" variant="outline" disabled={props.busy} onClick={close}>
            Cancel
          </Button>
          <Button size="sm" disabled={props.busy} onClick={() => void save()}>
            {props.busy ? "Saving…" : editing ? "Save changes" : "Save action"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
