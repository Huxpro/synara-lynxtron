// FILE: SettingsProviderPickerComposition.logic.ts
// Purpose: Shared Provider picker visibility/order model and canonical item projection.

import type { ProviderKind } from "@synara/contracts";
import { PROVIDER_DESCRIPTORS } from "@synara/shared/providerMetadata";

import {
  DEFAULT_PROVIDER_ORDER,
  normalizeHiddenProviders,
  normalizeProviderOrder,
  sameProviderOrder,
} from "~/providerOrdering";

export type SettingsProviderPickerValues = {
  readonly hiddenProviders: readonly ProviderKind[];
  readonly providerOrder: readonly ProviderKind[];
};

export type SettingsProviderPickerItem = {
  readonly provider: ProviderKind;
  readonly title: string;
  readonly hidden: boolean;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
};

export type SettingsProviderPickerMoveDirection = "up" | "down";

export const DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES: SettingsProviderPickerValues = {
  hiddenProviders: [],
  providerOrder: [...DEFAULT_PROVIDER_ORDER],
};

const providerTitles = new Map(
  PROVIDER_DESCRIPTORS.map((descriptor) => [descriptor.kind, descriptor.displayName]),
);

export function normalizeSettingsProviderPickerValues(input: {
  readonly hiddenProviders?: readonly string[] | undefined;
  readonly providerOrder?: readonly string[] | undefined;
}): SettingsProviderPickerValues {
  return {
    hiddenProviders: normalizeHiddenProviders(input.hiddenProviders ?? []),
    providerOrder: normalizeProviderOrder(input.providerOrder ?? []),
  };
}

export function settingsProviderPickerValuesEqual(
  left: SettingsProviderPickerValues,
  right: SettingsProviderPickerValues,
): boolean {
  return (
    sameProviderOrder(left.hiddenProviders, right.hiddenProviders) &&
    sameProviderOrder(left.providerOrder, right.providerOrder)
  );
}

export function setSettingsProviderHidden(
  values: SettingsProviderPickerValues,
  provider: ProviderKind,
  hidden: boolean,
): SettingsProviderPickerValues {
  const withoutTarget = values.hiddenProviders.filter((entry) => entry !== provider);
  return {
    ...values,
    hiddenProviders: hidden ? [...withoutTarget, provider] : withoutTarget,
  };
}

export function reorderSettingsProvider(
  values: SettingsProviderPickerValues,
  provider: ProviderKind,
  overProvider: ProviderKind,
): SettingsProviderPickerValues {
  const fromIndex = values.providerOrder.indexOf(provider);
  const toIndex = values.providerOrder.indexOf(overProvider);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return values;
  const providerOrder = [...values.providerOrder];
  providerOrder.splice(fromIndex, 1);
  providerOrder.splice(toIndex, 0, provider);
  return { ...values, providerOrder };
}

export function moveSettingsProvider(
  values: SettingsProviderPickerValues,
  provider: ProviderKind,
  direction: SettingsProviderPickerMoveDirection,
): SettingsProviderPickerValues {
  const fromIndex = values.providerOrder.indexOf(provider);
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  const overProvider = values.providerOrder[toIndex];
  return overProvider ? reorderSettingsProvider(values, provider, overProvider) : values;
}

export function buildSettingsProviderPickerItems(
  values: SettingsProviderPickerValues,
): readonly SettingsProviderPickerItem[] {
  const hidden = new Set(values.hiddenProviders);
  return values.providerOrder.map((provider, index) => ({
    provider,
    title: providerTitles.get(provider) ?? provider,
    hidden: hidden.has(provider),
    canMoveUp: index > 0,
    canMoveDown: index < values.providerOrder.length - 1,
  }));
}
