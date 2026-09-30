import type { ProviderKind } from "@synara/contracts";

export const FAVORITE_MODEL_STORAGE_KEYS = {
  cursor: "synara:cursor-favourite-models:v1",
  opencode: "synara:opencode-favourite-models:v1",
  pi: "synara:pi-favourite-models:v1",
} as const;

export const LEGACY_KILO_FAVORITE_MODEL_STORAGE_KEY = "synara:kilo-favourite-models:v1";

export type FavoriteModelProvider = keyof typeof FAVORITE_MODEL_STORAGE_KEYS;

export function supportsModelFavorites(provider: ProviderKind): provider is FavoriteModelProvider {
  return provider === "cursor" || provider === "opencode" || provider === "pi";
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

export function toggleFavoriteModelSlug(current: ReadonlyArray<string>, slug: string): string[] {
  const normalizedCurrent = normalizeFavoriteModelSlugs(current);
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return normalizedCurrent;
  return normalizedCurrent.includes(normalizedSlug)
    ? normalizedCurrent.filter((entry) => entry !== normalizedSlug)
    : [...normalizedCurrent, normalizedSlug];
}

interface FavoriteModelStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Strict decode matching the stored schema (an array of strings). Returns null for
 * anything else so the migration can leave unreadable data for a later retry.
 */
function decodeStoredFavoriteModelSlugs(raw: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "string")) {
      return null;
    }
    return Array.from(new Set(parsed.filter((entry) => entry.trim().length > 0)));
  } catch {
    return null;
  }
}

/** Preserve Kilo picker preferences after its provider data is migrated to OpenCode. */
export function migrateLegacyKiloFavoriteModelSlugs(storage: FavoriteModelStorage | null): void {
  if (!storage) return;
  try {
    const legacyRaw = storage.getItem(LEGACY_KILO_FAVORITE_MODEL_STORAGE_KEY);
    if (!legacyRaw) return;
    const legacyFavorites = decodeStoredFavoriteModelSlugs(legacyRaw);
    if (!legacyFavorites) return;

    const currentRaw = storage.getItem(FAVORITE_MODEL_STORAGE_KEYS.opencode);
    const currentFavorites = currentRaw ? (decodeStoredFavoriteModelSlugs(currentRaw) ?? []) : [];
    const mergedFavorites = Array.from(new Set([...currentFavorites, ...legacyFavorites]));
    storage.setItem(FAVORITE_MODEL_STORAGE_KEYS.opencode, JSON.stringify(mergedFavorites));
    storage.removeItem(LEGACY_KILO_FAVORITE_MODEL_STORAGE_KEY);
  } catch {
    // Best-effort preference migration; leave the legacy value for a later retry.
  }
}
