// FILE: PullRequestDetailCloseComposition.tsx
// Purpose: Physical-shared visibility and semantics for the PR detail panel close control.

import { PullRequestDetailCloseButtonElement } from "~/components/pullRequest/PullRequestDetailCloseCompositionElements";

export function PullRequestDetailCloseComposition(props: { readonly onClose?: () => void }) {
  if (!props.onClose) return null;

  return (
    <PullRequestDetailCloseButtonElement
      accessibleLabel="Close pull request panel"
      tooltip="Close"
      onActivate={props.onClose}
    />
  );
}
