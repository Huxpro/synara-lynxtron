// FILE: BrowserPanel.logic.ts
// Purpose: Holds the address-bar sync rules and suggestions for the in-app browser panel.
// Layer: Component logic helper
// Exports: browserAddressDisplayValue, normalizeBrowserAddressInput, buildBrowserAddressSuggestions
// Depends on: shared browser URL rules, browser tab metadata, and thread-local browser history

import {
  BROWSER_BLANK_URL,
  buildBrowserAddressSuggestions,
  normalizeBrowserUrlInput,
  type BrowserAddressSuggestion,
} from "@synara/shared/browserSession";
export {
  buildBrowserAddressSuggestions,
  type BrowserAddressSuggestion,
} from "@synara/shared/browserSession";
import type { BrowserTabState } from "@synara/contracts";

interface ResolveBrowserAddressSyncInput {
  activeTabId: string | null;
  previousActiveTabId: string | null;
  savedDraft: string | undefined;
  nextDisplayValue: string;
  lastSyncedValue: string | undefined;
  isEditing: boolean;
}

type BrowserAddressSyncDecision =
  | {
      type: "keep";
    }
  | {
      type: "replace";
      value: string;
      syncedValue: string | undefined;
    };

export interface BrowserChromeStatus {
  tone: "default" | "error";
  label: string;
}

// Hides about:blank from the address bar so new tabs behave like real browsers.
export function browserAddressDisplayValue(
  tab: Pick<BrowserTabState, "url"> | null | undefined,
): string {
  const nextUrl = tab?.url?.trim() ?? "";
  return nextUrl === BROWSER_BLANK_URL ? "" : nextUrl;
}

// Component-facing alias for the shared desktop/web browser URL normalizer.
export const normalizeBrowserAddressInput = normalizeBrowserUrlInput;

// Only shows transient browser state; the address field already reflects the active URL.
export function resolveBrowserChromeStatus(input: {
  localError: string | null;
  threadLastError: string | null | undefined;
  activeTabStatus: string;
  hasActiveTab: boolean;
  workspaceReady: boolean;
}): BrowserChromeStatus | null {
  if (input.localError) {
    return {
      tone: "error",
      label: input.localError,
    };
  }

  if (input.threadLastError) {
    return {
      tone: "error",
      label: input.threadLastError,
    };
  }

  if (!input.hasActiveTab) {
    return {
      tone: "default",
      label: input.workspaceReady ? "No tabs open" : "Starting browser...",
    };
  }

  if (input.activeTabStatus === "suspended") {
    return {
      tone: "default",
      label: "Restoring tab...",
    };
  }

  return null;
}

// Decides when browser state should replace the visible address input.
export function resolveBrowserAddressSync(
  input: ResolveBrowserAddressSyncInput,
): BrowserAddressSyncDecision {
  if (!input.activeTabId) {
    return {
      type: "replace",
      value: "",
      syncedValue: undefined,
    };
  }

  if (input.activeTabId !== input.previousActiveTabId) {
    if (input.savedDraft !== undefined) {
      return {
        type: "replace",
        value: input.savedDraft,
        syncedValue: input.lastSyncedValue,
      };
    }

    return {
      type: "replace",
      value: input.nextDisplayValue,
      syncedValue: input.nextDisplayValue,
    };
  }

  if (input.isEditing || input.lastSyncedValue === input.nextDisplayValue) {
    return { type: "keep" };
  }

  return {
    type: "replace",
    value: input.nextDisplayValue,
    syncedValue: input.nextDisplayValue,
  };
}
