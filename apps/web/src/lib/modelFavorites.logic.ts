import type { ProviderKind } from "@synara/contracts";

export const FAVORITE_MODEL_STORAGE_KEYS = {
  cursor: "synara:cursor-favourite-models:v1",
  kilo: "synara:kilo-favourite-models:v1",
  opencode: "synara:opencode-favourite-models:v1",
  pi: "synara:pi-favourite-models:v1",
} as const;

export type FavoriteModelProvider = keyof typeof FAVORITE_MODEL_STORAGE_KEYS;

export function supportsModelFavorites(
  provider: ProviderKind,
): provider is FavoriteModelProvider {
  return (
    provider === "cursor" || provider === "kilo" || provider === "opencode" || provider === "pi"
  );
}

export function normalizeFavoriteModelSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.flatMap((entry) =>
        typeof entry === "string" && entry.trim().length > 0 ? [entry.trim()] : [],
      ),
    ),
  );
}

export function parseFavoriteModelSlugs(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    return normalizeFavoriteModelSlugs(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function toggleFavoriteModelSlug(
  current: ReadonlyArray<string>,
  slug: string,
): string[] {
  const normalizedCurrent = normalizeFavoriteModelSlugs(current);
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return normalizedCurrent;
  return normalizedCurrent.includes(normalizedSlug)
    ? normalizedCurrent.filter((entry) => entry !== normalizedSlug)
    : [...normalizedCurrent, normalizedSlug];
}
