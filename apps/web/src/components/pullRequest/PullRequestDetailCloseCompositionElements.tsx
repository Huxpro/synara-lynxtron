// FILE: PullRequestDetailCloseCompositionElements.tsx
// Purpose: Browser host element for the physical-shared PR detail close control.

import {
  CHAT_HEADER_ICON_CONTROL_CLASS_NAME,
  CHAT_HEADER_ICON_STRENGTH_CLASS_NAME,
} from "~/components/chat/chatHeaderControls";
import { IconButton } from "~/components/ui/icon-button";
import { XIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";

const PR_DETAIL_CLOSE_BUTTON_CLASS_NAME = cn(
  CHAT_HEADER_ICON_CONTROL_CLASS_NAME,
  CHAT_HEADER_ICON_STRENGTH_CLASS_NAME,
);

export function PullRequestDetailCloseButtonElement(props: {
  readonly accessibleLabel: string;
  readonly tooltip: string;
  readonly onActivate: () => void;
}) {
  return (
    <IconButton
      variant="chrome"
      label={props.accessibleLabel}
      tooltip={props.tooltip}
      className={PR_DETAIL_CLOSE_BUTTON_CLASS_NAME}
      onClick={props.onActivate}
    >
      <XIcon />
    </IconButton>
  );
}
