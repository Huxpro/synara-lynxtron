import type { ProviderKind } from "@synara/contracts";
import { isProviderKind } from "@synara-web/providerOrdering";

export function resolveLandingModelProvider(
  candidate: unknown,
  fallback: ProviderKind,
): ProviderKind {
  return typeof candidate === "string" && isProviderKind(candidate) ? candidate : fallback;
}
