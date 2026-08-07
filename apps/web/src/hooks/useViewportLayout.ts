import { useSyncExternalStore } from "react";

import { getViewportHeight, getViewportWidth, isBrowser } from "~/platform/env";
import {
  resolveViewportLayout,
  UNKNOWN_VIEWPORT_SIZE,
  type ViewportLayout,
  type ViewportSize,
} from "~/responsiveLayout.logic";

function readViewportSize(): ViewportSize {
  if (!isBrowser()) return UNKNOWN_VIEWPORT_SIZE;
  return {
    width: getViewportWidth(),
    height: getViewportHeight(),
  };
}

function subscribe(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}

function readSnapshot(): string {
  const size = readViewportSize();
  return `${size.width}x${size.height}`;
}

export function useViewportLayout(): ViewportLayout {
  useSyncExternalStore(subscribe, readSnapshot, () => "0x0");
  return resolveViewportLayout(readViewportSize());
}
