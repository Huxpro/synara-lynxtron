// FILE: ComposerLifecycleStatusElements.tsx
// Purpose: Web live-region host for bounded composer lifecycle transitions.

import { resolveSystemStateSemantics } from "~/components/systemStateSemantics";

export function ComposerLifecycleStatusElement(props: {
  readonly announcement: string;
  readonly intent: "status" | "alert";
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  return (
    <span
      className="sr-only"
      role={semantics.role ?? undefined}
      aria-live={semantics.live}
      aria-atomic={semantics.atomic}
    >
      {props.announcement}
    </span>
  );
}
