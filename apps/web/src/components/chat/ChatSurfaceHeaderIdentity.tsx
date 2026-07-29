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
  readonly icon?: ReactNode;
  readonly iconTitle?: string;
  readonly highlighted?: boolean;
  readonly suffix?: ReactNode;
  readonly onRename?: () => void;
}) {
  return (
    <ChatSurfaceHeaderIdentityRootElement
      highlighted={props.highlighted ?? false}
    >
      {props.icon ? (
        <ChatSurfaceHeaderIdentityIconElement title={props.iconTitle}>
          {props.icon}
        </ChatSurfaceHeaderIdentityIconElement>
      ) : null}
      <ChatSurfaceHeaderIdentityTitleElement
        title={props.title}
        onRename={props.onRename}
      />
      {props.suffix}
    </ChatSurfaceHeaderIdentityRootElement>
  );
}
