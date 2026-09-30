// FILE: MessageRowCompositionElements.tsx
// Purpose: Web host elements for the physical shared transcript row anatomy.

import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import {
  USER_MESSAGE_BUBBLE_RADIUS_CLASS_NAME,
  USER_MESSAGE_BUBBLE_SHELL_CHROME_CLASS_NAME,
} from "./chatTypography";

export function MessageUserRowElement(props: { readonly children?: ReactNode | undefined }) {
  return <div className="flex w-full justify-end">{props.children}</div>;
}

export function MessageUserColumnElement(props: {
  readonly fullWidth: boolean;
  readonly children?: ReactNode | undefined;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col items-end gap-px",
        props.fullWidth ? "w-full max-w-full" : "max-w-[80%]",
      )}
    >
      {props.children}
    </div>
  );
}

export function MessageUserBubbleElement(props: {
  readonly chipOnly: boolean;
  readonly children?: ReactNode | undefined;
}) {
  return (
    <div
      className={cn(
        "w-max max-w-full min-w-0 self-end bg-[var(--app-user-message-background)]",
        USER_MESSAGE_BUBBLE_RADIUS_CLASS_NAME,
        props.chipOnly ? "py-0.5 px-3" : USER_MESSAGE_BUBBLE_SHELL_CHROME_CLASS_NAME,
      )}
    >
      {props.children}
    </div>
  );
}

export function MessageAssistantRowElement(props: { readonly children?: ReactNode | undefined }) {
  return <div className="group min-w-0 py-0.5">{props.children}</div>;
}
