import { Button } from "~/components/ui/button";

export function WorkspaceFilePreviewErrorStateElement(props: {
  readonly title: string;
  readonly description: string;
  readonly detail: string | null;
  readonly retryLabel: string;
  readonly retryDisabled?: boolean;
  readonly onRetry: () => void;
  readonly onClose?: () => void;
}) {
  return (
    <div role="alert" aria-live="polite" className="flex min-h-0 flex-1 flex-col items-start justify-start gap-2 p-3">
      <p className="text-left text-[11px] font-medium text-destructive/85">{props.title}</p>
      <p className="text-left text-[11px] leading-4 text-muted-foreground">{props.description}</p>
      {props.detail ? <p className="max-w-full break-words text-left font-mono text-[10px] leading-4 text-muted-foreground/80">{props.detail}</p> : null}
      <div className="flex items-center gap-2">
        <Button type="button" size="xs" variant="outline" disabled={props.retryDisabled} onClick={props.onRetry}>{props.retryLabel}</Button>
        {props.onClose ? <Button type="button" size="xs" variant="ghost" onClick={props.onClose}>Close preview</Button> : null}
      </div>
    </div>
  );
}
