import type { ReactNode } from '@lynx-js/react';

export function ChatSurfaceHeaderFrameElement(props: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className={`${props.className ?? ''} AppWindowDragRegion`.trim()}>
      {props.children}
    </view>
  );
}
