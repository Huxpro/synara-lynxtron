import type { ReactNode } from "@lynx-js/react";

import "./message-row-composition-elements.css";

export function MessageUserRowElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedMessageUserRow">{props.children}</view>;
}

export function MessageUserColumnElement(props: {
  readonly fullWidth: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <view
      className={`SharedMessageUserColumn${
        props.fullWidth ? " SharedMessageUserColumn--full" : ""
      }`}
    >
      {props.children}
    </view>
  );
}

export function MessageUserBubbleElement(props: {
  readonly chipOnly: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <view
      className={`SharedMessageUserBubble${
        props.chipOnly ? " SharedMessageUserBubble--chip-only" : ""
      }`}
    >
      {props.children}
    </view>
  );
}

export function MessageAssistantRowElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedMessageAssistantRow">{props.children}</view>;
}
