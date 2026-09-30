import type { ProviderKind, ServerProviderStatus } from "@synara/contracts";
import { compareProvidersByOrder } from "../../providerOrdering";
import { PROVIDER_OPTIONS } from "../../session-logic";

export interface ComposerProviderPickerItem {
  readonly provider: ProviderKind;
  readonly label: string;
  readonly kind: "available" | "coming-soon";
  readonly disabled: boolean;
  readonly statusLabel: string | null;
}
function isAvailableProviderOption(option: (typeof PROVIDER_OPTIONS)[number]): option is {
  value: ProviderKind;
  label: string;
  available: true;
} {
  return option.available;
}

export const AVAILABLE_PROVIDER_OPTIONS = PROVIDER_OPTIONS.filter(isAvailableProviderOption);
const UNAVAILABLE_PROVIDER_OPTIONS = PROVIDER_OPTIONS.filter((option) => !option.available);

function resolveLiveProviderAvailability(provider: ServerProviderStatus | undefined): {
  disabled: boolean;
  label: string | null;
} {
  if (!provider) {
    return { disabled: true, label: "Checking" };
  }
  if (!provider.available) {
    return {
      disabled: true,
      label: provider.authStatus === "unauthenticated" ? "Sign in" : "Unavailable",
    };
  }
  if (provider.authStatus === "unauthenticated") {
    return { disabled: true, label: "Sign in" };
  }
  return { disabled: false, label: null };
}

function filterProviderOptionsByVisibility<T extends { value: ProviderKind }>(
  options: ReadonlyArray<T>,
  hiddenProviders: ReadonlySet<ProviderKind>,
  protectedProviders: ReadonlySet<ProviderKind>,
): ReadonlyArray<T> {
  if (hiddenProviders.size === 0) return options;
  return options.filter(
    (option) => protectedProviders.has(option.value) || !hiddenProviders.has(option.value),
  );
}

export function buildComposerProviderPickerItems(input: {
  readonly providers?: ReadonlyArray<ServerProviderStatus> | undefined;
  readonly hiddenProviders?: ReadonlyArray<ProviderKind> | undefined;
  readonly providerOrder?: ReadonlyArray<ProviderKind> | undefined;
  readonly protectedProviders?: ReadonlyArray<ProviderKind> | undefined;
}): ReadonlyArray<ComposerProviderPickerItem> {
  const hiddenProviderSet = new Set(input.hiddenProviders ?? []);
  const protectedProviderSet = new Set(input.protectedProviders ?? []);
  const providerOrder = input.providerOrder ?? [];
  const available = filterProviderOptionsByVisibility(
    AVAILABLE_PROVIDER_OPTIONS.toSorted((left, right) =>
      compareProvidersByOrder(providerOrder, left.value, right.value),
    ),
    hiddenProviderSet,
    protectedProviderSet,
  ).map((option): ComposerProviderPickerItem => {
    const availability = resolveLiveProviderAvailability(
      input.providers?.find((entry) => entry.provider === option.value),
    );
    return {
      provider: option.value,
      label: option.label,
      kind: "available",
      disabled: availability.disabled,
      statusLabel: availability.label,
    };
  });
  const unavailable = filterProviderOptionsByVisibility(
    UNAVAILABLE_PROVIDER_OPTIONS.toSorted((left, right) =>
      compareProvidersByOrder(providerOrder, left.value, right.value),
    ),
    hiddenProviderSet,
    protectedProviderSet,
  ).map(
    (option): ComposerProviderPickerItem => ({
      provider: option.value,
      label: option.label,
      kind: "coming-soon",
      disabled: true,
      statusLabel: "Coming soon",
    }),
  );
  return [...available, ...unavailable];
}
