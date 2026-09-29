import { useEffect } from "react";
import { resolveTerminalFontFamilyStack, useAppSettings } from "../appSettings";
import { appTypographyCssVariables } from "../lib/appTypography";

import { getDocumentElement } from "~/platform/env";
const TERMINAL_FONT_FAMILY_CSS_VARIABLE = "--terminal-font-family";

export function useAppTypography() {
  const { settings } = useAppSettings();

  useEffect(() => {
    const rootStyle = getDocumentElement()?.style;
    if (!rootStyle) return;
    const variables = appTypographyCssVariables(
      settings.chatFontSizePx,
      settings.terminalFontSizePx,
    );
    for (const [cssVariable, value] of Object.entries(variables)) {
      rootStyle.setProperty(cssVariable, value);
    }

    // Terminal font family overrides the bundled default only when a non-default
    // font is chosen; otherwise leave the index.css value in place. The terminal
    // runtime observes inline `style` mutations and re-applies the font live.
    const terminalFontFamilyStack = resolveTerminalFontFamilyStack(settings.terminalFontFamily);
    if (terminalFontFamilyStack) {
      rootStyle.setProperty(TERMINAL_FONT_FAMILY_CSS_VARIABLE, terminalFontFamilyStack);
    } else {
      rootStyle.removeProperty(TERMINAL_FONT_FAMILY_CSS_VARIABLE);
    }

    return () => {
      for (const cssVariable of Object.keys(variables)) {
        rootStyle.removeProperty(cssVariable);
      }
      rootStyle.removeProperty(TERMINAL_FONT_FAMILY_CSS_VARIABLE);
    };
  }, [settings.chatFontSizePx, settings.terminalFontSizePx, settings.terminalFontFamily]);
}
