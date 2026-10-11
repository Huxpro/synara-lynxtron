import type { ReactNode } from "@lynx-js/react";

/** Native shell shared by composer attachments and their sent-message echoes. */
export function ReferenceAttachmentCard(props: {
  readonly className?: string;
  readonly icon: ReactNode;
  readonly title: string;
  readonly subtitle: ReactNode;
  readonly remove?: ReactNode;
}) {
  return (
    <view className={`ComposerReferenceCardLynx ${props.className ?? ""}`}>
      <view className="ComposerReferenceTileLynx">{props.icon}</view>
      <view className="ComposerReferenceCardCopyLynx">
        <text className="ComposerReferenceCardTitleLynx" text-maxline="1">
          {props.title}
        </text>
        {props.subtitle}
      </view>
      {props.remove}
    </view>
  );
}
