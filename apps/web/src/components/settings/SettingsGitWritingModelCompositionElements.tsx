// FILE: SettingsGitWritingModelCompositionElements.tsx
// Purpose: Browser elements beneath the shared Git writing model composition.

import type { ReactNode } from "react";
import type { SettingsGitWritingModelOption } from "./SettingsGitWritingModelComposition.logic";
import { SettingResetButton, SettingsSelectControl } from "./SettingControls";
import { SettingsRow, SettingsSection } from "./SettingsPanelPrimitives";
import { SelectItem } from "../ui/select";

export function SettingsGitWritingModelRootElement(props: { readonly children?: ReactNode }) {
  return <div className="space-y-6">{props.children}</div>;
}

export function SettingsGitWritingModelSectionElement(props: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return <SettingsSection title={props.title}>{props.children}</SettingsSection>;
}

export function SettingsGitWritingModelRowElement(props: {
  readonly title: string;
  readonly description: string;
  readonly changed: boolean;
  readonly onReset: () => void;
  readonly children?: ReactNode;
}) {
  return (
    <SettingsRow
      title={props.title}
      description={props.description}
      resetAction={
        props.changed ? (
          <SettingResetButton label="git writing model" onClick={props.onReset} />
        ) : null
      }
      control={props.children}
    />
  );
}

export function SettingsGitWritingModelSelectElement(props: {
  readonly value: string;
  readonly ariaLabel: string;
  readonly options: readonly SettingsGitWritingModelOption[];
  readonly onChange: (value: string) => void;
}) {
  const selected = props.options.find(
    (option) => `${option.provider}:${option.model}` === props.value,
  );
  return (
    <SettingsSelectControl
      value={props.value}
      onValueChange={props.onChange}
      ariaLabel={props.ariaLabel}
      triggerClassName="w-full sm:w-52"
      valueContent={selected?.label ?? props.value}
    >
      {props.options.map((option) => (
        <SelectItem
          hideIndicator
          key={`${option.provider}:${option.model}`}
          value={`${option.provider}:${option.model}`}
        >
          {option.label}
        </SelectItem>
      ))}
    </SettingsSelectControl>
  );
}
