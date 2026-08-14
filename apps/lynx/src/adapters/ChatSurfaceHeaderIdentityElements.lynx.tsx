import type { ReactNode } from '@lynx-js/react';
import { useLynxInteractiveState } from './useLynxInteractiveState';

export function ChatSurfaceHeaderIdentityRootElement(props: {
  readonly highlighted: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <view
      className={`SharedChatHeaderIdentity${
        props.highlighted ? ' SharedChatHeaderIdentity--highlighted' : ''
      }`}
    >
      {props.children}
    </view>
  );
}

export function ChatSurfaceHeaderIdentityIconElement(props: {
  readonly title?: string;
  readonly children?: ReactNode;
}) {
  return <view className="SharedChatHeaderIdentityIcon">{props.children}</view>;
}

export function ChatSurfaceHeaderIdentityTitleElement(props: {
  readonly title: string;
  readonly onRename?: () => void;
}) {
  const rename = useLynxInteractiveState({
    baseClassName: 'SharedChatHeaderIdentityTitle',
    accessibleLabel: props.onRename
      ? `Rename thread ${props.title}`
      : props.title,
    disabled: !props.onRename,
    onActivate: props.onRename ?? (() => {}),
  });
  return (
    <text
      className={rename.className}
      {...rename.eventProps}
    >
      {props.title}
    </text>
  );
}
