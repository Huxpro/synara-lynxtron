import type { SystemStateIntent } from "@synara-web/components/systemStateSemantics";

export type SettingsPersistenceState =
  | { readonly kind: "loaded" }
  | { readonly kind: "saving" }
  | { readonly kind: "saved" }
  | { readonly kind: "error"; readonly message: string };

export type SettingsPersistOutcome =
  | { readonly kind: "saved" }
  | { readonly kind: "partial"; readonly message: string };

export interface SettingsPersistencePresentation {
  readonly announcement: string;
  readonly intent: Exclude<SystemStateIntent, "plain" | "empty">;
  readonly message: string;
}

export function resolveSettingsPersistencePresentation(
  state: SettingsPersistenceState,
): SettingsPersistencePresentation | null {
  switch (state.kind) {
    case "loaded":
      return null;
    case "saving":
      return {
        announcement: "Saving changes",
        intent: "status",
        message: "Saving changes…",
      };
    case "saved":
      return {
        announcement: "Changes saved",
        intent: "status",
        message: "Changes saved.",
      };
    case "error":
      return {
        announcement: state.message,
        intent: "alert",
        message: state.message,
      };
  }
}

export function shouldApplySettingsSaveResult(
  latestOperationId: number,
  completedOperationId: number,
): boolean {
  return latestOperationId === completedOperationId;
}
