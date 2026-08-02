// FILE: KanbanStateComposition.tsx
// Purpose: Shared copy and anatomy for Kanban loading, failure and missing-project states.

import {
  KanbanStateElement,
  type KanbanStateElementVariant,
} from "~/components/kanban/KanbanStateCompositionElements";

export type KanbanStateKind =
  | "loading-overview"
  | "loading-project"
  | "offline"
  | "error"
  | "not-found"
  | "stale-offline"
  | "stale-error";

interface KanbanStatePresentation {
  readonly announcement: string;
  readonly description: string | null;
  readonly intent: "status" | "alert" | "empty";
  readonly title: string;
  readonly variant: KanbanStateElementVariant;
}

export function resolveKanbanStatePresentation(
  kind: KanbanStateKind,
): KanbanStatePresentation {
  switch (kind) {
    case "loading-overview":
      return {
        announcement: "Loading Kanban projects",
        description: null,
        intent: "status",
        title: "Loading projects…",
        variant: "page",
      };
    case "loading-project":
      return {
        announcement: "Building Kanban board",
        description: null,
        intent: "status",
        title: "Building board…",
        variant: "page",
      };
    case "offline":
      return {
        announcement: "Synara is offline. Reconnect and retry loading Kanban.",
        description: "Reconnect to Synara, then retry.",
        intent: "alert",
        title: "Synara is offline",
        variant: "page",
      };
    case "error":
      return {
        announcement: "Kanban could not be loaded. Retry the request.",
        description: "The board could not be loaded. Retry the request.",
        intent: "alert",
        title: "Kanban unavailable",
        variant: "page",
      };
    case "not-found":
      return {
        announcement: "Kanban project not found",
        description: "It may have been removed or the link may be out of date.",
        intent: "empty",
        title: "Project not found",
        variant: "page",
      };
    case "stale-offline":
      return {
        announcement:
          "Kanban could not refresh while offline. Showing the last loaded board.",
        description: null,
        intent: "alert",
        title: "Offline · showing the last loaded board",
        variant: "inline",
      };
    case "stale-error":
      return {
        announcement:
          "Kanban could not refresh. Showing the last loaded board.",
        description: null,
        intent: "alert",
        title: "Refresh failed · showing the last loaded board",
        variant: "inline",
      };
  }
}

export function KanbanStateComposition(props: {
  readonly kind: KanbanStateKind;
  readonly retrying?: boolean;
  readonly onRetry?: () => void;
}) {
  const presentation = resolveKanbanStatePresentation(props.kind);
  return (
    <KanbanStateElement
      {...presentation}
      retryLabel={props.retrying ? "Retrying…" : "Retry"}
      retryDisabled={props.retrying}
      onRetry={props.onRetry}
    />
  );
}
