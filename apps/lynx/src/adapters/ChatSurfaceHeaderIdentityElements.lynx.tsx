import type { ReactNode } from "@lynx-js/react";
import { useLynxInteractiveState } from "./useLynxInteractiveState";

export function ChatSurfaceHeaderIdentityRootElement(props: {
  readonly highlighted: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <view
      className={`SharedChatHeaderIdentity${
        props.highlighted ? " SharedChatHeaderIdentity--highlighted" : ""
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

interface ChatSurfaceHeaderIdentityTitleProps {
  readonly title: string;
  readonly displayTitle?: string;
  readonly onRename?: () => void;
}

function RenamableChatSurfaceHeaderIdentityTitle(
  props: ChatSurfaceHeaderIdentityTitleProps & { readonly onRename: () => void },
) {
  const rename = useLynxInteractiveState({
    baseClassName: "SharedChatHeaderIdentityTitle",
    accessibleLabel: `Rename thread ${props.title}`,
    onActivate: props.onRename,
  });
  return (
    <text className={rename.className} maxlines={1} {...rename.eventProps}>
      {props.displayTitle ?? props.title}
    </text>
  );
}

export function ChatSurfaceHeaderIdentityTitleElement(props: ChatSurfaceHeaderIdentityTitleProps) {
  if (!props.onRename) {
    return (
      <text className="SharedChatHeaderIdentityTitle" maxlines={1}>
        {props.displayTitle ?? props.title}
      </text>
    );
  }
  return <RenamableChatSurfaceHeaderIdentityTitle {...props} onRename={props.onRename} />;
}
