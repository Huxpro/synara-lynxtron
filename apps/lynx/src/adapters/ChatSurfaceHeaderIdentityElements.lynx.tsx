import type { ReactNode } from '@lynx-js/react';

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
  return <text className="SharedChatHeaderIdentityTitle">{props.title}</text>;
}
