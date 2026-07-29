// FILE: useUniqueId.ts
// Purpose: React 17-safe replacement for React 18+ `useId` (P1-F5): stable per
//   component instance for its lifetime, unique per app session. Used for aria
//   linkage ids and SVG gradient/pattern prefixes where SSR-hydration stability
//   is not required (desktop app, no SSR).
// Layer: Web UI utility hook
// Exports: useUniqueId

import { useRef } from "react";

let uniqueIdCounter = 0;

export function useUniqueId(prefix = "synara-id"): string {
  const idRef = useRef<string | null>(null);
  if (idRef.current === null) {
    uniqueIdCounter += 1;
    idRef.current = `${prefix}-${uniqueIdCounter}`;
  }
  return idRef.current;
}
