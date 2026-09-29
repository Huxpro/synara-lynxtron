export const SYSTEM_APPEARANCE_EVENT = "synara:system-appearance";

export function readSystemDarkEvent(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function readSystemAppearanceResponse(value: unknown): boolean | null {
  if (!value || typeof value !== "object" || !("dark" in value)) return null;
  return readSystemDarkEvent((value as { readonly dark?: unknown }).dark);
}
