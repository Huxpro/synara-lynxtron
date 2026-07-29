// FILE: useNowMs.ts
// Purpose: Shared lightweight wall-clock tick for live elapsed labels.
// Layer: Web hook
// Exports: useNowMs

import { useEffect, useState } from "react";

export function useNowMs(enabled: boolean, intervalMs = 1_000): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return;
    }
    // Timeout-0 instead of a synchronous set: the immediate refresh lands a
    // tick after enabling, which is invisible for elapsed-time labels and
    // keeps this hook eligible for React Compiler optimization.
    const timeoutId = setTimeout(() => {
      setNowMs(Date.now());
    }, 0);
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, intervalMs);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [enabled, intervalMs]);

  return nowMs;
}
