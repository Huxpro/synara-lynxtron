import { PROVIDER_SEND_TURN_MAX_INPUT_CHARS } from "@synara/contracts";

import { Button } from "../components/ui/button.lynx";

interface NativeTextInputEvent {
  readonly detail: { readonly value: string };
}

export function TranscriptUserMessageEditForm(props: {
  readonly chatFontSizePx: number;
  readonly disabled: boolean;
  readonly draft: string;
  readonly error: string | null;
  readonly onCancel: () => void;
  readonly onDraftChange: (value: string) => void;
  readonly onSubmit: () => void;
}) {
  const canSubmit = props.draft.trim().length > 0 && !props.disabled;
  return (
    <view className="TranscriptUserEditForm">
      <textarea
        accessibility-element
        accessibility-label="Edit message"
        className="TranscriptUserEditTextarea"
        default-value={props.draft}
        maxlength={PROVIDER_SEND_TURN_MAX_INPUT_CHARS}
        readonly={props.disabled}
        focusable={!props.disabled}
        style={{
          fontSize: `${props.chatFontSizePx}px`,
          lineHeight: `${Math.round(props.chatFontSizePx * 1.5)}px`,
        }}
        bindinput={(event: NativeTextInputEvent) => props.onDraftChange(event.detail.value)}
      />
      {props.error ? <text className="TranscriptUserEditError">{props.error}</text> : null}
      <view className="TranscriptUserEditActions">
        <Button
          size="xs"
          shape="capsule"
          variant="outline"
          disabled={props.disabled}
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button size="xs" shape="capsule" disabled={!canSubmit} onClick={props.onSubmit}>
          Send
        </Button>
      </view>
    </view>
  );
}
