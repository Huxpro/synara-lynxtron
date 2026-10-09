import { PROVIDER_DISPLAY_NAMES, type ServerProviderStatus } from "@synara/contracts";

export interface ProviderHealthBannerPresentation {
  readonly key: string;
  readonly message: string;
  readonly title: string;
  readonly tone: "error" | "warning";
}

export function resolveProviderHealthBannerPresentation(
  status: ServerProviderStatus | null,
): ProviderHealthBannerPresentation | null {
  if (!status || status.status === "ready") {
    return null;
  }

  const providerLabel =
    status.displayName?.trim() ||
    (PROVIDER_DISPLAY_NAMES as Readonly<Record<string, string>>)[status.provider] ||
    status.provider;
  const defaultMessage =
    status.status === "error"
      ? `${providerLabel} provider is unavailable.`
      : `${providerLabel} provider has limited availability.`;

  return {
    key: [
      status.provider,
      status.status,
      status.available ? "available" : "unavailable",
      status.authStatus,
      status.message?.trim() ?? "",
    ].join("\u001f"),
    message: status.message ?? defaultMessage,
    title: `${providerLabel} provider status`,
    tone: status.status === "error" ? "error" : "warning",
  };
}
