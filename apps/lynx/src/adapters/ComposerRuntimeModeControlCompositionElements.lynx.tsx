import shieldAccessSvg from '@synara-central-icons/shield-access.svg?raw';
import type { RuntimeMode } from '@synara/contracts';
import type { ReactNode } from 'react';

import { MenuPopupBase } from '../components/ui/menu.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from './useTheme.lynx';

export function ComposerRuntimeModeTriggerElement(props: {
  readonly hideLabel: boolean;
  readonly runtimeMode: RuntimeMode;
}) {
  const { activeTheme, resolvedTheme } = useTheme();
  const label =
    props.runtimeMode === 'full-access' ? 'Full access' : 'Default permissions';
  const fullAccess = props.runtimeMode === 'full-access';
  const iconColor = fullAccess
    ? resolvedTheme === 'dark'
      ? '#fe8549'
      : '#e25505'
    : activeTheme.theme.ink;
  return (
    <view
      className={`ComposerRuntimeTriggerLynx${
        fullAccess ? ' ComposerRuntimeTriggerLynx--full-access' : ''
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
          <text className="ComposerRuntimeTriggerChevronLynx">⌄</text>
        </>
      )}
    </view>
  );
}

export function ComposerRuntimeModePopupElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <MenuPopupBase side="top" align="start" className="ComposerRuntimePopupLynx">
      {props.children}
    </MenuPopupBase>
  );
}

export function ComposerRuntimeFullAccessLabelElement() {
  return <text>Full access</text>;
}

export function ComposerRuntimeRestrictedLabelElement() {
  return <text>Default permissions</text>;
}
