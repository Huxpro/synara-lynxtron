import type { ReactNode } from 'react';

import { Button } from '../components/ui/button.lynx';
import {
  MenuItem,
  MenuPopupBase,
  MenuSubPopup,
} from '../components/ui/menu.lynx';

export function ComposerExtrasMenuTriggerElement() {
  return (
    <Button
      size="icon-sm"
      variant="chrome"
      className="ComposerExtrasTriggerLynx"
      aria-label="Composer extras"
    >
      +
    </Button>
  );
}

export function ComposerExtrasMenuPopupElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <MenuPopupBase side="top" align="start" className="ComposerExtrasPopupLynx">
      {props.children}
    </MenuPopupBase>
  );
}

export function ComposerExtrasSubPopupElement(props: {
  readonly children?: ReactNode;
}) {
  return <MenuSubPopup>{props.children}</MenuSubPopup>;
}

export function ComposerExtrasImageItemElement(props: {
  readonly available: boolean;
  readonly onPickAttachments?: (() => void) | undefined;
  readonly onAddPhotos: (files: File[]) => void;
}) {
  return (
    <MenuItem
      disabled={!props.available || !props.onPickAttachments}
      onClick={props.onPickAttachments}
    >
      {props.available ? 'Add files' : 'Add files — unavailable'}
    </MenuItem>
  );
}

export function ComposerExtrasPlanLabelElement() {
  return <text>Plan mode</text>;
}

export function ComposerExtrasFastLabelElement() {
  return <text>Fast</text>;
}
