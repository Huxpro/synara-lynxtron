// FILE: systemStateSemantics.ts
// Purpose: Shared semantic contract for visible loading, result, error and empty states.

export type SystemStateIntent = "plain" | "status" | "alert" | "empty";

export interface SystemStateSemantics {
  readonly live: "polite" | "assertive" | undefined;
  readonly role: "status" | "alert" | undefined;
  readonly atomic: true | undefined;
  readonly announce: boolean;
}

export function resolveSystemStateSemantics(
  intent: SystemStateIntent,
): SystemStateSemantics {
  if (intent === "plain") {
    return {
      live: undefined,
      role: undefined,
      atomic: undefined,
      announce: false,
    };
  }
  if (intent === "alert") {
    return {
      live: "assertive",
      role: "alert",
      atomic: true,
      announce: true,
    };
  }
  return {
    live: "polite",
    role: "status",
    atomic: true,
    announce: true,
  };
}
