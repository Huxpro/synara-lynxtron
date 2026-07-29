// FILE: MessageRowComposition.tsx
// Purpose: Physical shared source for transcript message-row anatomy.
// The platform element layer owns host tags; this file owns visibility,
// nesting, alignment, and bubble placement for both Web and Lynx.

import type { ReactNode } from "react";

import {
  MessageAssistantRowElement,
  MessageUserBubbleElement,
  MessageUserColumnElement,
  MessageUserRowElement,
} from "~/components/chat/MessageRowCompositionElements";

export function MessageUserRowComposition(props: {
  readonly fullWidth?: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <MessageUserRowElement>
      <MessageUserColumnElement fullWidth={props.fullWidth ?? false}>
        {props.children}
      </MessageUserColumnElement>
    </MessageUserRowElement>
  );
}

export function MessageUserBubbleComposition(props: {
  readonly chipOnly?: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <MessageUserBubbleElement chipOnly={props.chipOnly ?? false}>
      {props.children}
    </MessageUserBubbleElement>
  );
}

export function MessageAssistantRowComposition(props: {
  readonly children?: ReactNode;
}) {
  return <MessageAssistantRowElement>{props.children}</MessageAssistantRowElement>;
}
