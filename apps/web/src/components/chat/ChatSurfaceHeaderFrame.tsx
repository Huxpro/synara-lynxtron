import type { ReactNode } from "react";

import { ChatSurfaceHeaderFrameElement } from "~/components/chat/ChatSurfaceHeaderFrameElements";

import {
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  CHAT_SURFACE_HEADER_HEIGHT_CLASS,
  CHAT_SURFACE_HEADER_PADDING_X_CLASS,
} from "./chatSurfaceHeaderStyles";

export interface ChatSurfaceHeaderFrameProps {
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly editorRail?: boolean | undefined;
}

/**
 * Shared visual frame for the main chat chrome. Platform-specific host elements
 * stay below this boundary; height, divider, padding, and flex anatomy stay in
 * the same physical source for Web and Lynx.
 */
export function ChatSurfaceHeaderFrame({
  children,
  className,
  editorRail = false,
}: ChatSurfaceHeaderFrameProps) {
  const frameClassName = [
    CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
    !editorRail ? CHAT_SURFACE_HEADER_PADDING_X_CLASS : null,
    "flex shrink-0 items-center",
    editorRail ? "h-10" : CHAT_SURFACE_HEADER_HEIGHT_CLASS,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ChatSurfaceHeaderFrameElement className={frameClassName} padded={!editorRail}>
      {children}
    </ChatSurfaceHeaderFrameElement>
  );
}
