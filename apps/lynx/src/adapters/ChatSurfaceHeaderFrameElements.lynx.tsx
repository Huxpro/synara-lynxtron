import type { ReactNode } from "@lynx-js/react";

export function ChatSurfaceHeaderFrameElement(props: {
  readonly className?: string;
  readonly children?: ReactNode;
  readonly padded?: boolean;
}) {
  return (
    <view
      className={`${props.className ?? ""} AppWindowDragRegion${
        props.padded ? " AppWindowDragRegion--padded" : ""
      }`.trim()}
    >
      {props.children}
    </view>
  );
}
