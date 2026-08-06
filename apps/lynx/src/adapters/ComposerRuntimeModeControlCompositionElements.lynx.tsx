import type { RuntimeMode } from '@synara/contracts';
import type { ReactNode } from 'react';

import { MenuPopupBase } from '../components/ui/menu.lynx';

export function ComposerRuntimeModeTriggerElement(props: {
  readonly hideLabel: boolean;
  readonly runtimeMode: RuntimeMode;
}) {
  const label =
    props.runtimeMode === 'full-access' ? 'Full access' : 'Default permissions';
  const fullAccess = props.runtimeMode === 'full-access';
  return (
    <view
      className={`ComposerRuntimeTriggerLynx${
        fullAccess ? ' ComposerRuntimeTriggerLynx--full-access' : ''
      }`}
      aria-label={`${label} — change permissions`}
    >
      <text className="ComposerRuntimeTriggerPermissionGlyphLynx">
        {fullAccess ? '◆' : '◇'}
      </text>
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
