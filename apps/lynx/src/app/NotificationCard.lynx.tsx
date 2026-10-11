import type { ReactNode } from "@lynx-js/react";

/** Shared native notification structure; each host owns its delivery/lifetime. */
export function NotificationCard(props: {
  readonly className: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly close: ReactNode;
  readonly onHeight?: (height: number) => void;
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
}) {
  return (
    <view
      className={props.className}
      accessibility-element
      accessibility-label={props.label}
      bindlayoutchange={(event: { detail: { height?: number } }) => {
        if (typeof event.detail.height === "number" && event.detail.height > 0)
          props.onHeight?.(event.detail.height);
      }}
      bindmouseenter={props.onMouseEnter}
      bindmouseleave={props.onMouseLeave}
    >
      {props.icon}
      <view className={`${props.className.split(" ")[0]}Copy`}>
        {props.title}
        {props.description}
        {props.actions}
      </view>
      {props.close}
    </view>
  );
}
