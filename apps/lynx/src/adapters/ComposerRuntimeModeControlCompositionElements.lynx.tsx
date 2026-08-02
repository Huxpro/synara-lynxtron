import type { RuntimeMode } from '@synara/contracts';
import type { ReactNode } from 'react';

import { Button } from '../components/ui/button.lynx';
import { MenuPopupBase } from '../components/ui/menu.lynx';

export function ComposerRuntimeModeTriggerElement(props: {
  readonly hideLabel: boolean;
  readonly runtimeMode: RuntimeMode;
}) {
  const label =
    props.runtimeMode === 'full-access' ? 'Full access' : 'Default permissions';
  return (
    <Button
      size="sm"
      variant="chrome"
      className="ComposerRuntimeTriggerLynx"
      aria-label={`${label} — change permissions`}
    >
      {props.hideLabel
        ? props.runtimeMode === 'full-access'
          ? '◆'
          : '◇'
        : label}
    </Button>
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
