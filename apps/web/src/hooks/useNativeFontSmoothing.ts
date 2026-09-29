// FILE: useNativeFontSmoothing.ts
// Purpose: Applies the optional platform font-smoothing preference to the app root.
// Layer: Web appearance override hook
// Exports: useNativeFontSmoothing

import { useEffect } from "react";
import { useAppSettings } from "../appSettings";
import { isMacPlatform } from "../lib/utils";

import { getNavigatorPlatform, getDocumentElement } from "~/platform/env";
export function useNativeFontSmoothing() {
  const { settings } = useAppSettings();
  const shouldApply = settings.enableNativeFontSmoothing && isMacPlatform(getNavigatorPlatform());

  useEffect(() => {
    const rootStyle = getDocumentElement()?.style;
    if (!rootStyle) return;
    if (shouldApply) {
      rootStyle.setProperty("-webkit-font-smoothing", "antialiased");
      rootStyle.setProperty("-moz-osx-font-smoothing", "grayscale");
    } else {
      rootStyle.removeProperty("-webkit-font-smoothing");
      rootStyle.removeProperty("-moz-osx-font-smoothing");
    }
  }, [shouldApply]);
}
