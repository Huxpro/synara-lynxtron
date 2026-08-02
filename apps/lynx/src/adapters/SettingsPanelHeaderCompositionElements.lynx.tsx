import type { ReactNode } from '@lynx-js/react';

import { Button } from '../components/ui/button';

type ChildrenProps = {
  readonly children?: ReactNode;
};

export function SettingsPanelHeaderRootElement(props: ChildrenProps) {
  return <view className="SharedSettingsPanelHeader">{props.children}</view>;
}

export function SettingsPanelHeaderCopyElement(props: ChildrenProps) {
  return <view className="SharedSettingsPanelHeaderCopy">{props.children}</view>;
}

export function SettingsPanelHeaderTitleElement(props: ChildrenProps) {
  return <text className="SharedSettingsPanelHeaderTitle">{props.children}</text>;
}

export function SettingsPanelHeaderDescriptionElement(props: ChildrenProps) {
  return <text className="SharedSettingsPanelHeaderDescription">{props.children}</text>;
}

export function SettingsPanelHeaderRestoreElement(props: {
  readonly disabled: boolean;
  readonly onRestore: () => void;
}) {
  return (
    <Button
      variant="outline"
      disabled={props.disabled}
      onClick={props.onRestore}
    >
      Restore defaults
    </Button>
  );
}
