export const SYSTEM_APPEARANCE_EVENT = 'synara:system-appearance';

export function readSystemDarkEvent(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}
