// FILE: app/chatWidthSetting.lynx.ts
// Purpose: The Chat width setting as renderer state: read once the storage mirror is
//   loaded, written merged into the app settings record. The root view turns it into
//   upstream's `--app-chat-max-width`, as upstream's `useChatWidth` does on the document.
// Why not upstream's `useAppSettings`: it re-encodes the whole record through its schema,
//   which drops keys this build does not know; Native merges only the key it writes.
// Layer: Lynx settings state

import { APP_SETTINGS_STORAGE_KEY } from "@synara-web/appSettingsStorageProjection.logic";
import { DEFAULT_CHAT_WIDTH, type ChatWidthMode } from "@synara-web/lib/chatWidth";
import { create } from "zustand";

import { setPersistedStorageItem, webStorage } from "../platform/storage";
import { readChatWidthSetting, writeChatWidthSetting } from "./chatWidthSetting.logic";

const useChatWidthStore = create<{ readonly chatWidth: ChatWidthMode }>(() => ({
  chatWidth: DEFAULT_CHAT_WIDTH,
}));

export function useChatWidthSetting(): ChatWidthMode {
  return useChatWidthStore((state) => state.chatWidth);
}

/** Call once the storage mirror has been loaded. */
export function hydrateChatWidthSetting(): void {
  "background only";
  useChatWidthStore.setState({
    chatWidth: readChatWidthSetting(webStorage.getItem(APP_SETTINGS_STORAGE_KEY)),
  });
}

/** Applies the mode now and persists it; a failed write puts the previous mode back. */
export async function setChatWidthSetting(mode: ChatWidthMode): Promise<void> {
  "background only";
  const previous = useChatWidthStore.getState().chatWidth;
  useChatWidthStore.setState({ chatWidth: mode });
  try {
    await setPersistedStorageItem(
      APP_SETTINGS_STORAGE_KEY,
      writeChatWidthSetting(webStorage.getItem(APP_SETTINGS_STORAGE_KEY), mode),
    );
  } catch (error) {
    useChatWidthStore.setState({ chatWidth: previous });
    throw error;
  }
}
