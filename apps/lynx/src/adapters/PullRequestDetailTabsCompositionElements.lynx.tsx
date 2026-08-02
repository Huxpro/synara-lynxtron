import type { ReactNode } from '@lynx-js/react';

import './pull-request-detail-tabs-composition-elements.css';
import { useLynxInteractiveState } from './useLynxInteractiveState';

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestDetailTabsRootElement(props: ChildrenProps) {
  return <view className="SharedPrDetailTabs">{props.children}</view>;
}

export function PullRequestDetailTabElement(props: {
  readonly active: boolean;
  readonly available: boolean;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedPrDetailTab${
      props.active ? ' SharedPrDetailTab--active' : ''
    }${props.available ? '' : ' SharedPrDetailTab--unavailable'}`,
    disabled: !props.available,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text
        className={`SharedPrDetailTabText${
          props.available ? '' : ' SharedPrDetailTabText--unavailable'
        }`}
      >
        {props.label}
      </text>
    </view>
  );
}

export function PullRequestDetailCapabilityElement(props: ChildrenProps) {
  return (
    <view className="SharedPrDetailCapability">
      <text className="SharedPrDetailCapabilityText">{props.children}</text>
    </view>
  );
}
