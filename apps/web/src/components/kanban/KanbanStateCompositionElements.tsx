// FILE: KanbanStateCompositionElements.tsx
// Purpose: Browser host elements for shared Kanban system states.

import { Button } from "~/components/ui/button";
import { resolveSystemStateSemantics } from "~/components/systemStateSemantics";
import { cn } from "~/lib/utils";

export type KanbanStateElementVariant = "page" | "inline";

export function KanbanStateElement(props: {
  readonly announcement: string;
  readonly description: string | null;
  readonly intent: "status" | "alert" | "empty";
  readonly title: string;
  readonly variant: KanbanStateElementVariant;
  readonly retryLabel: string;
  readonly retryDisabled?: boolean;
  readonly onRetry?: () => void;
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  return (
    <div
      role={semantics.role}
      aria-live={semantics.live}
      aria-atomic={semantics.atomic}
      aria-label={props.announcement}
      className={cn(
        "flex items-center text-muted-foreground",
        props.variant === "page"
          ? "min-h-72 flex-col justify-center gap-2 text-center"
          : "justify-between gap-3 rounded-lg border border-border px-3 py-2 text-xs",
      )}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{props.title}</p>
        {props.description ? <p className="mt-1 text-sm">{props.description}</p> : null}
      </div>
      {props.onRetry ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={props.retryDisabled}
          onClick={props.onRetry}
        >
          {props.retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
