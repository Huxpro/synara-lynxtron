import { describeErrorMessage } from "./errorMessages";

export type ProviderDiscoveryResource = "plugins" | "skills";

export function providerDiscoveryItemHue(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

const PROVIDER_DISCOVERY_ITEM_ACCENTS = [
  "#7f1d1d",
  "#7c2d12",
  "#713f12",
  "#3f6212",
  "#166534",
  "#155e75",
  "#1e3a8a",
  "#4c1d95",
  "#701a75",
  "#831843",
] as const;

export function providerDiscoveryItemAccent(name: string): string {
  const index = Math.floor(
    (providerDiscoveryItemHue(name) / 360) * PROVIDER_DISCOVERY_ITEM_ACCENTS.length,
  );
  return PROVIDER_DISCOVERY_ITEM_ACCENTS[
    Math.min(PROVIDER_DISCOVERY_ITEM_ACCENTS.length - 1, index)
  ];
}

export type ProviderDiscoveryStatus =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "unsupported" }
  | { readonly kind: "empty" }
  | { readonly kind: "content" };

export interface ProviderPluginDiscoveryWarningInput {
  readonly marketplaceLoadErrors: ReadonlyArray<{
    readonly marketplacePath: string;
    readonly message: string;
  }>;
  readonly remoteSyncError: string | null;
}

function providerDiscoverySectionTitle(value: string): string {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : "Unknown";
}

export function providerPluginDiscoveryWarnings(
  input: ProviderPluginDiscoveryWarningInput,
): readonly string[] {
  const warnings: string[] = [];
  const remoteSyncError = input.remoteSyncError?.trim();
  if (remoteSyncError) warnings.push(remoteSyncError);
  const marketplaceWarnings = input.marketplaceLoadErrors
    .map((error) => {
      const message = error.message.trim();
      if (!message) return null;
      return `${providerDiscoverySectionTitle(error.marketplacePath)}: ${message}`;
    })
    .filter((warning): warning is string => warning !== null);
  if (marketplaceWarnings.length > 0) {
    warnings.push(marketplaceWarnings.join(" • "));
  }
  return warnings;
}

export function normalizeProviderDiscoveryText(value: string | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[:/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function describeProviderDiscoveryError(input: {
  readonly error: unknown;
  readonly providerLabel: string;
  readonly resource: ProviderDiscoveryResource;
}): string {
  const detail = describeErrorMessage(input.error, "");
  if (detail.includes("not installed or not executable")) {
    return `${input.providerLabel} CLI is unavailable, so ${input.resource} cannot be loaded.`;
  }
  return detail
    ? `Could not load ${input.resource}. ${detail}`
    : `Could not load ${input.resource}.`;
}

export function resolveProviderDiscoveryStatus(input: {
  readonly error: unknown;
  readonly itemCount: number;
  readonly pending: boolean;
  readonly providerLabel: string;
  readonly resource: ProviderDiscoveryResource;
  readonly supported: boolean;
}): ProviderDiscoveryStatus {
  if (input.pending) return { kind: "loading" };
  if (input.error) {
    return {
      kind: "error",
      message: describeProviderDiscoveryError(input),
    };
  }
  if (!input.supported) return { kind: "unsupported" };
  if (input.itemCount === 0) return { kind: "empty" };
  return { kind: "content" };
}
