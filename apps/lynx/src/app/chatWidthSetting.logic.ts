// FILE: app/chatWidthSetting.logic.ts
// Purpose: The "Chat width" app setting (`chatWidth` in upstream's AppSettingsSchema) read
//   from and merged into the stored app settings record, and upstream's width variable
//   (`getChatWidthCssVariables`) in the units Lynx lays out with.
// Layer: Lynx settings logic

import {
  DEFAULT_CHAT_WIDTH,
  getChatWidthCssVariables,
  normalizeChatWidthMode,
  type ChatWidthMode,
} from "@synara-web/lib/chatWidth";

export const CHAT_WIDTH_SETTING_KEY = "chatWidth";

/** Upstream's `CHAT_WIDTH_OPTIONS` (routes/_chat.settings.tsx): value and label. */
export const CHAT_WIDTH_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "wide", label: "Wide" },
  { value: "full", label: "Full" },
] as const satisfies ReadonlyArray<{ value: ChatWidthMode; label: string }>;

/** The Web app's root font size: upstream writes the column widths in rem. */
const REM_PX = 16;

function parseRecord(raw: string | null): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function readChatWidthSetting(raw: string | null): ChatWidthMode {
  return normalizeChatWidthMode(parseRecord(raw)[CHAT_WIDTH_SETTING_KEY], DEFAULT_CHAT_WIDTH);
}

/** The stored record with this one key replaced; every other key is written back untouched. */
export function writeChatWidthSetting(raw: string | null, mode: ChatWidthMode): string {
  return JSON.stringify({ ...parseRecord(raw), [CHAT_WIDTH_SETTING_KEY]: mode });
}

/**
 * Upstream's `--app-chat-max-width` for the root inline variable map: 46rem and 72rem as
 * pixels (Lynx has no rem), `100%` as it is.
 */
export function resolveChatWidthVariables(mode: ChatWidthMode): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getChatWidthCssVariables(mode)).map(([name, value]) => {
      const rem = /^(\d+(?:\.\d+)?)rem$/.exec(value);
      return [name, rem ? `${Number(rem[1]) * REM_PX}px` : value];
    }),
  );
}
