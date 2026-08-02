// FILE: SettingsProviderPickerComposition.tsx
// Purpose: Physical-shared Provider picker visibility/order composition.

import {
  buildSettingsProviderPickerItems,
  moveSettingsProvider,
  reorderSettingsProvider,
  setSettingsProviderHidden,
  settingsProviderPickerValuesEqual,
  type SettingsProviderPickerValues,
} from "./SettingsProviderPickerComposition.logic";
import { SettingsProviderPickerElement } from "~/components/settings/SettingsProviderPickerCompositionElements";

export function SettingsProviderPickerComposition(props: {
  readonly values: SettingsProviderPickerValues;
  readonly defaults: SettingsProviderPickerValues;
  readonly onChange: (values: SettingsProviderPickerValues) => void;
}) {
  const hiddenCount = props.values.hiddenProviders.length;
  const orderChanged = !settingsProviderPickerValuesEqual(
    { ...props.values, hiddenProviders: props.defaults.hiddenProviders },
    props.defaults,
  );
  const status =
    hiddenCount > 0
      ? `${hiddenCount} ${hiddenCount === 1 ? "provider" : "providers"} hidden`
      : orderChanged
        ? "Custom order"
        : "All providers visible";

  return (
    <SettingsProviderPickerElement
      sectionTitle="Provider picker"
      title="Visible providers"
      description="Arrange providers in your preferred picker order and hide the ones you don't use. The provider you're currently using on a thread always stays visible."
      status={status}
      changed={!settingsProviderPickerValuesEqual(props.values, props.defaults)}
      items={buildSettingsProviderPickerItems(props.values)}
      onReset={() => props.onChange(props.defaults)}
      onHiddenChange={(provider, hidden) =>
        props.onChange(setSettingsProviderHidden(props.values, provider, hidden))
      }
      onMove={(provider, direction) =>
        props.onChange(moveSettingsProvider(props.values, provider, direction))
      }
      onReorder={(provider, overProvider) =>
        props.onChange(reorderSettingsProvider(props.values, provider, overProvider))
      }
    />
  );
}
