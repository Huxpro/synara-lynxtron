// FILE: SettingsProviderUpdateChecksComposition.tsx
// Purpose: Physical-shared Provider update-check section, row, and switch anatomy.

import {
  SettingsGeneralBooleanControlElement,
  SettingsGeneralRootElement,
  SettingsGeneralRowElement,
  SettingsGeneralSectionElement,
} from "~/components/settings/SettingsGeneralCompositionElements";

import type { SettingsProviderUpdateChecksValues } from "./SettingsProviderUpdateChecksComposition.logic";

export function SettingsProviderUpdateChecksRowComposition(props: {
  readonly values: SettingsProviderUpdateChecksValues;
  readonly defaults: SettingsProviderUpdateChecksValues;
  readonly onChange: (values: SettingsProviderUpdateChecksValues) => void;
}) {
  return (
    <SettingsGeneralRowElement
      title="Automatic CLI update checks"
      description="Check Codex, Claude, and other provider CLIs for newer versions in the background."
      resetLabel="CLI update checks"
      changed={
        props.values.enableProviderUpdateChecks !== props.defaults.enableProviderUpdateChecks
      }
      onReset={() => props.onChange(props.defaults)}
    >
      <SettingsGeneralBooleanControlElement
        checked={props.values.enableProviderUpdateChecks}
        ariaLabel="Automatic CLI update checks"
        onChange={(enableProviderUpdateChecks) => props.onChange({ enableProviderUpdateChecks })}
      />
    </SettingsGeneralRowElement>
  );
}

export function SettingsProviderUpdateChecksComposition(props: {
  readonly values: SettingsProviderUpdateChecksValues;
  readonly defaults: SettingsProviderUpdateChecksValues;
  readonly onChange: (values: SettingsProviderUpdateChecksValues) => void;
}) {
  return (
    <SettingsGeneralRootElement>
      <SettingsGeneralSectionElement title="Updates">
        <SettingsProviderUpdateChecksRowComposition {...props} />
      </SettingsGeneralSectionElement>
    </SettingsGeneralRootElement>
  );
}
