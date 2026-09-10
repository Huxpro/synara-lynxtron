import type { ReactNode } from '@lynx-js/react';

import { resolveSystemStateSemantics } from '@synara-web/components/systemStateSemantics';

import { useLynxSystemStateAnnouncement } from '../platform/system-state-announcement.lynx';
import './pull-request-list-composition-elements.css';

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestListRootElement(props: ChildrenProps) {
  return <view className="SharedPrList">{props.children}</view>;
}

export function PullRequestListGroupTitleElement(
  props: ChildrenProps & { readonly separated: boolean }
) {
  return (
    <text
      className={`SharedPrGroupTitle${
        props.separated ? ' SharedPrGroupTitle--separated' : ''
      }`}
      accessibility-element={true}
      accessibility-trait="header"
    >
      {props.children}
    </text>
  );
}

export function PullRequestListLoadingElement(props: {
  readonly rowCount: number;
  readonly label: string;
}) {
  const semantics = resolveSystemStateSemantics('status');
  useLynxSystemStateAnnouncement({
    intent: 'status',
    announcement: props.label,
  });
  return (
    <view
      className="SharedPrLoading"
      accessibility-element={semantics.announce}
      accessibility-label={props.label}
      accessibility-trait="updating"
    >
      {Array.from({ length: props.rowCount }, (_, index) => (
        <view key={index} className="SharedPrLoadingRow" />
      ))}
    </view>
  );
}

export function PullRequestListEmptyElement(props: {
  readonly title: string;
  readonly description: string;
  readonly intent: 'empty' | 'alert';
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  const announcement = `${props.title}. ${props.description}`;
  useLynxSystemStateAnnouncement({
    intent: props.intent,
    announcement,
  });
  return (
    <view
      className="SharedPrEmpty"
      accessibility-element={semantics.announce}
      accessibility-label={announcement}
      accessibility-trait="text"
    >
      <text className="SharedPrEmptyTitle">{props.title}</text>
      <text className="SharedPrEmptyDescription">{props.description}</text>
    </view>
  );
}
