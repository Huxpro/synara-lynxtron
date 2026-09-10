// Shared product composition for a failed workspace-file preview. Renderer
// element ownership is injected through the aliased Elements module.

import { WorkspaceFilePreviewErrorStateElement } from "~/components/WorkspaceFilePreviewErrorStateElements";

export function WorkspaceFilePreviewErrorState(props: {
  readonly detail?: string | null;
  readonly retrying?: boolean;
  readonly onRetry: () => void;
  readonly onClose?: () => void;
}) {
  return (
    <WorkspaceFilePreviewErrorStateElement
      title="Could not read this file."
      description="The file may have moved, changed, or become unavailable."
      detail={props.detail?.trim() || null}
      retryLabel={props.retrying ? "Retrying…" : "Retry"}
      retryDisabled={props.retrying}
      onRetry={props.onRetry}
      onClose={props.onClose}
    />
  );
}
