import shieldAccessSvg from "@synara-central-icons/shield-access.svg?raw";
import type { RuntimeMode } from "@synara/contracts";
import type { ReactNode } from "react";

import { MenuPopupBase } from "../components/ui/menu.lynx";
import { ChevronDownIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "./useTheme.lynx";

const HAND_RAISED_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002"/></svg>';

export function ComposerRuntimeModeTriggerElement(props: {
  readonly hideLabel: boolean;
  readonly runtimeMode: RuntimeMode;
}) {
  const { activeTheme, resolvedTheme } = useTheme();
  const label = props.runtimeMode === "full-access" ? "Full access" : "Default permissions";
  const fullAccess = props.runtimeMode === "full-access";
  const iconColor = fullAccess
    ? resolvedTheme === "dark"
      ? "#fe8549"
      : "#e25505"
    : activeTheme.theme.ink;
  return (
    <view
      className={`ComposerRuntimeTriggerLynx${
        fullAccess ? " ComposerRuntimeTriggerLynx--full-access" : ""
      }`}
      aria-label={`${label} — change permissions`}
    >
      <svg
        className="ComposerRuntimeTriggerPermissionIconLynx"
        content={colorizeLynxSvg(shieldAccessSvg, iconColor)}
      />
      {props.hideLabel ? null : (
        <>
          <text className="ComposerRuntimeTriggerLabelLynx">{label}</text>
          <ChevronDownIcon
            className="ComposerRuntimeTriggerChevronLynx"
            color={iconColor}
            size={12}
          />
        </>
      )}
    </view>
  );
}

export function ComposerRuntimeModePopupElement(props: { readonly children?: ReactNode }) {
  return (
    <MenuPopupBase side="top" align="start" className="ComposerRuntimePopupLynx">
      {props.children}
    </MenuPopupBase>
  );
}

export function ComposerRuntimeFullAccessLabelElement() {
  const { activeTheme } = useTheme();
  return (
    <view className="ComposerRuntimeOptionLabelLynx">
      <svg
        className="ComposerRuntimeOptionIconLynx"
        content={colorizeLynxSvg(shieldAccessSvg, activeTheme.theme.ink)}
      />
      <text className="ComposerRuntimeOptionTextLynx">Full access</text>
    </view>
  );
}

export function ComposerRuntimeRestrictedLabelElement() {
  const { activeTheme } = useTheme();
  return (
    <view className="ComposerRuntimeOptionLabelLynx">
      <svg
        className="ComposerRuntimeOptionIconLynx"
        content={colorizeLynxSvg(HAND_RAISED_SVG, activeTheme.theme.ink)}
      />
      <text className="ComposerRuntimeOptionTextLynx">Default permissions</text>
    </view>
  );
}
