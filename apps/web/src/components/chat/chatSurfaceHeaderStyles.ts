import { CHAT_SURFACE_HEADER_HEIGHT_PX } from "@synara/shared/desktopChrome";

export const CHAT_SURFACE_HEADER_HEIGHT_CLASS: `h-[${typeof CHAT_SURFACE_HEADER_HEIGHT_PX}px]` =
  "h-[46px]";

export const CHAT_SURFACE_HEADER_PADDING_X_CLASS = "px-3 sm:px-5";

export const CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME = "chat-surface-divider";

export const CHAT_SURFACE_HEADER_ROW_CLASS_NAME =
  `flex shrink-0 items-center ${CHAT_SURFACE_HEADER_HEIGHT_CLASS} ${CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME}`;
