import { Button } from "../components/ui/button";
import "./workspace-file-preview-error-state-elements.css";

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
    <view className="SharedFilePreviewErrorState" accessibility-element={false}>
      <text
        className="SharedFilePreviewErrorTitle"
        accessibility-element
        accessibility-label={`${props.title} ${props.description}${props.detail ? ` ${props.detail}` : ""}`}
        accessibility-trait="text"
      >
        {props.title}
      </text>
      <text className="SharedFilePreviewErrorDescription" accessibility-element={false}>
        {props.description}
      </text>
      {props.detail ? (
        <text className="SharedFilePreviewErrorDetail" accessibility-element={false}>
          {props.detail}
        </text>
      ) : null}
      <view className="SharedFilePreviewErrorActions">
        <Button
          size="xs"
          variant="outline"
          disabled={props.retryDisabled}
          aria-label={props.retryLabel}
          buttonProps={{ focusable: !props.retryDisabled }}
          onClick={props.onRetry}
        >
          {props.retryLabel}
        </Button>
        {props.onClose ? (
          <Button
            size="xs"
            variant="ghost"
            aria-label="Close preview"
            buttonProps={{ focusable: true }}
            onClick={props.onClose}
          >
            Close preview
          </Button>
        ) : null}
      </view>
    </view>
  );
}
