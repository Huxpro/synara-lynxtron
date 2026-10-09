// FILE: ChatSurfaceHeaderIdentity.tsx
// Purpose: Shared provider/terminal glyph + title + optional suffix composition.

import type { ReactNode } from "react";

import {
  ChatSurfaceHeaderIdentityIconElement,
  ChatSurfaceHeaderIdentityRootElement,
  ChatSurfaceHeaderIdentityTitleElement,
} from "~/components/chat/ChatSurfaceHeaderIdentityElements";

export function ChatSurfaceHeaderIdentity(props: {
  readonly title: string;
  readonly displayTitle?: string | undefined;
  readonly icon?: ReactNode | undefined;
  readonly iconTitle?: string | undefined;
  readonly highlighted?: boolean | undefined;
  readonly suffix?: ReactNode | undefined;
  readonly onRename?: (() => void) | undefined;
}) {
  return (
    <ChatSurfaceHeaderIdentityRootElement highlighted={props.highlighted ?? false}>
      {props.icon ? (
        <ChatSurfaceHeaderIdentityIconElement title={props.iconTitle}>
          {props.icon}
        </ChatSurfaceHeaderIdentityIconElement>
      ) : null}
      <ChatSurfaceHeaderIdentityTitleElement
        title={props.title}
        displayTitle={props.displayTitle}
        onRename={props.onRename}
      />
      {props.suffix}
    </ChatSurfaceHeaderIdentityRootElement>
  );
}
