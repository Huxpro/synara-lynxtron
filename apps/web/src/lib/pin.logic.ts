// FILE: pin.logic.ts
// Purpose: Platform-neutral copy policy for pin and unpin affordances.

/** Accessible verb for a pin toggle: "Pin <target>" when unpinned, "Unpin <target>" when pinned. */
export function pinActionLabel(target: string, pinned: boolean): string {
  return `${pinned ? "Unpin" : "Pin"} ${target}`;
}
