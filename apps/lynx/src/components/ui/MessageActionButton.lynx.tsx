import type { ReactNode } from "@lynx-js/react";

export function MessageActionButtonLynx(props: {
  readonly children: ReactNode;
  readonly className: string;
  readonly eventProps: Record<string, unknown>;
}) {
  return (
    <view className={props.className} {...props.eventProps}>
      {props.children}
    </view>
  );
}
