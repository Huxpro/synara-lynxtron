import type { ReactNode } from 'react';

import {
  GaugeIcon,
  PaperclipIcon,
  PlusIcon,
  BlocksIcon,
} from '../lib/icons.lynx';
import { Button } from '../components/ui/button.lynx';
import {
  MenuTrigger,
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
      <PlusIcon className="ComposerExtrasTriggerIconLynx" />
    </Button>
  );
}

export function ComposerExtrasMenuTriggerHostElement(_props: {
  readonly open: boolean;
}) {
  return (
    <MenuTrigger
      className="ComposerExtrasTriggerLynx"
      ariaLabel="Composer extras"
    >
      <ComposerExtrasMenuTriggerElement />
    </MenuTrigger>
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
      <view className="ComposerExtrasItemLabelLynx">
        <PaperclipIcon className="ComposerExtrasItemIconLynx" />
        <text>
          {props.available ? 'Add files' : 'Add files — unavailable'}
        </text>
      </view>
    </MenuItem>
  );
}

export function ComposerExtrasPlanLabelElement() {
  return (
    <view className="ComposerExtrasItemLabelLynx">
      <BlocksIcon className="ComposerExtrasItemIconLynx" />
      <text>Plan mode</text>
    </view>
  );
}

export function ComposerExtrasFastLabelElement() {
  return (
    <view className="ComposerExtrasItemLabelLynx">
      <GaugeIcon className="ComposerExtrasItemIconLynx" />
      <text>Fast</text>
    </view>
  );
}
