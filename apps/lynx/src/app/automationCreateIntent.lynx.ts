// FILE: automationCreateIntent.lynx.ts
// Purpose: Whether the "New automation" dialog is open. Upstream's ThreadSidebar owns
//   this flag and hands it to both the rail's Automations panel and the route; the Lynx
//   panel and page are separate trees, so they share it here.

import { useSyncExternalStore } from "@lynx-js/react";

let createOpen = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readCreateOpen(): boolean {
  return createOpen;
}

export function setAutomationCreateOpen(open: boolean): void {
  if (createOpen === open) return;
  createOpen = open;
  for (const listener of listeners) listener();
}

export function useAutomationCreateOpen(): boolean {
  return useSyncExternalStore(subscribe, readCreateOpen, readCreateOpen);
}
