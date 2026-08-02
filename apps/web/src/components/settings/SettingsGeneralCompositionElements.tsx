// FILE: SettingsGeneralCompositionElements.tsx
// Purpose: Browser elements beneath the shared General settings composition.

import type { ReactNode } from "react";
import type {
  SettingsGeneralKey,
  SettingsGeneralOption,
} from "./SettingsGeneralComposition.logic";
import { ProviderOptionLabel } from "../ProviderIcon";
import { SettingResetButton, SettingsSelectControl } from "./SettingControls";
import { SettingsRow, SettingsSection } from "./SettingsPanelPrimitives";
import { SelectItem } from "../ui/select";
import { Switch } from "../ui/switch";

export function SettingsGeneralRootElement(props: { readonly children?: ReactNode }) {
  return <div className="space-y-6">{props.children}</div>;
}

export function SettingsGeneralSectionElement(props: {
  readonly title: string;
  readonly targetId?: string;
  readonly children?: ReactNode;
}) {
  const section = <SettingsSection title={props.title}>{props.children}</SettingsSection>;
  return props.targetId ? <div id={props.targetId}>{section}</div> : section;
}

export function SettingsGeneralRowElement(props: {
  readonly title: string;
  readonly description: string;
  readonly resetLabel: string;
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
          <SettingResetButton label={props.resetLabel} onClick={props.onReset} />
        ) : null
      }
      control={props.children}
    />
  );
}

export function SettingsGeneralBooleanControlElement(props: {
  readonly checked: boolean;
  readonly ariaLabel: string;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={props.checked}
      onCheckedChange={(checked) => props.onChange(Boolean(checked))}
      aria-label={props.ariaLabel}
    />
  );
}

export function SettingsGeneralSelectControlElement(props: {
  readonly settingKey: SettingsGeneralKey;
  readonly value: string;
  readonly ariaLabel: string;
  readonly options: readonly SettingsGeneralOption[];
  readonly onChange: (value: string) => void;
}) {
  const selected = props.options.find((option) => option.value === props.value);
  const provider = props.settingKey === "defaultProvider";
  const valueContent = provider && selected ? (
    <ProviderOptionLabel provider={selected.value as never} label={selected.label} />
  ) : (
    (selected?.label ?? props.value)
  );

  return (
    <SettingsSelectControl
      value={props.value}
      onValueChange={props.onChange}
      ariaLabel={props.ariaLabel}
      valueContent={valueContent}
    >
      {props.options.map((option) => (
        <SelectItem hideIndicator key={option.value} value={option.value}>
          {provider ? (
            <ProviderOptionLabel provider={option.value as never} label={option.label} />
          ) : (
            option.label
          )}
        </SelectItem>
      ))}
    </SettingsSelectControl>
  );
}
