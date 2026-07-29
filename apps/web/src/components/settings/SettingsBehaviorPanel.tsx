// FILE: SettingsBehaviorPanel.tsx
// Purpose: Shared composition for the Settings > Behavior route panel.
// Layer: Settings feature composition

import type { ReactNode } from "react";

import { SettingsPanelStackElement } from "~/components/settings/SettingsSectionElements";
import { SettingsRow } from "./SettingsRow";
import { SettingsSection } from "./SettingsSection";

export type BehaviorSettingKey =
  | "enableAssistantStreaming"
  | "diffWordWrap"
  | "confirmThreadDelete"
  | "confirmThreadArchive"
  | "confirmTerminalTabClose";

export type BehaviorSettingsValues = Readonly<Record<BehaviorSettingKey, boolean>>;

type ControlRenderArgs = {
  readonly checked: boolean;
  readonly ariaLabel: string;
  readonly onCheckedChange: (checked: boolean) => void;
};

type ResetRenderArgs = {
  readonly changed: boolean;
  readonly label: string;
  readonly onReset: () => void;
};

export function SettingsBehaviorPanel({
  settings,
  defaults,
  updateSetting,
  renderControl,
  renderResetAction,
}: {
  readonly settings: BehaviorSettingsValues;
  readonly defaults: BehaviorSettingsValues;
  readonly updateSetting: (key: BehaviorSettingKey, value: boolean) => void;
  readonly renderControl: (args: ControlRenderArgs) => ReactNode;
  readonly renderResetAction: (args: ResetRenderArgs) => ReactNode;
}) {
  const row = ({
    key,
    title,
    description,
    resetLabel,
    ariaLabel,
  }: {
    key: BehaviorSettingKey;
    title: string;
    description: string;
    resetLabel: string;
    ariaLabel: string;
  }) => (
    <SettingsRow
      title={title}
      description={description}
      resetAction={renderResetAction({
        changed: settings[key] !== defaults[key],
        label: resetLabel,
        onReset: () => updateSetting(key, defaults[key]),
      })}
      control={renderControl({
        checked: settings[key],
        ariaLabel,
        onCheckedChange: (checked) => updateSetting(key, checked),
      })}
    />
  );

  return (
    <SettingsPanelStackElement className="space-y-6">
      <SettingsSection title="Runtime behavior">
        {row({
          key: "enableAssistantStreaming",
          title: "Assistant output",
          description: "Show token-by-token output while a response is in progress.",
          resetLabel: "assistant output",
          ariaLabel: "Stream assistant messages",
        })}
        {row({
          key: "diffWordWrap",
          title: "Diff line wrapping",
          description:
            "Set the default wrap state when the diff panel opens. The in-panel wrap toggle only affects the current diff session.",
          resetLabel: "diff line wrapping",
          ariaLabel: "Wrap diff lines by default",
        })}
      </SettingsSection>

      <SettingsSection title="Safety confirmations">
        {row({
          key: "confirmThreadDelete",
          title: "Delete confirmation",
          description: "Ask before deleting a thread and its chat history.",
          resetLabel: "delete confirmation",
          ariaLabel: "Confirm thread deletion",
        })}
        {row({
          key: "confirmThreadArchive",
          title: "Archive confirmation",
          description: "Ask before archiving a thread.",
          resetLabel: "archive confirmation",
          ariaLabel: "Confirm thread archive",
        })}
        {row({
          key: "confirmTerminalTabClose",
          title: "Terminal close confirmation",
          description: "Ask before closing a terminal tab and clearing its history.",
          resetLabel: "terminal close confirmation",
          ariaLabel: "Confirm terminal tab close",
        })}
      </SettingsSection>
    </SettingsPanelStackElement>
  );
}
