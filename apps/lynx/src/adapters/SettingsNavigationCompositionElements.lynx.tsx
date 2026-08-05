import type { ReactNode } from '@lynx-js/react';

import { SettingsIconElement } from './SettingsIcon.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';

type ChildrenProps = {
  readonly children?: ReactNode;
};

export function SettingsNavigationRootElement(props: ChildrenProps) {
  return <view className="SharedSettingsNavigation">{props.children}</view>;
}

export function SettingsNavigationGroupElement(props: ChildrenProps & {
  readonly groupId: string;
}) {
  return (
    <view
      className={`SharedSettingsNavigationGroup${
        props.groupId === 'synara' ? ' SharedSettingsNavigationGroup--following' : ''
      }`}
    >
      {props.children}
    </view>
  );
}

export function SettingsNavigationGroupLabelElement(props: ChildrenProps & {
  readonly groupId: string;
}) {
  return <text className="SharedSettingsNavigationGroupLabel">{props.children}</text>;
}

export function SettingsNavigationListElement(props: ChildrenProps) {
  return <view className="SharedSettingsNavigationList">{props.children}</view>;
}

export function SettingsNavigationItemElement(props: ChildrenProps) {
  return <view className="SharedSettingsNavigationItem">{props.children}</view>;
}

export function SettingsNavigationItemButtonElement(props: ChildrenProps & {
  readonly active: boolean;
  readonly accessibleLabel: string;
  readonly disabled: boolean;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedSettingsNavigationButton${
      props.active ? ' SharedSettingsNavigationButton--active' : ''
    }${props.disabled ? ' SharedSettingsNavigationButton--disabled' : ''}`,
    accessibleLabel: props.accessibleLabel,
    accessibilityValue: props.active ? 'Current section' : undefined,
    disabled: props.disabled,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      aria-selected={props.active}
      {...interaction.eventProps}
    >
      {props.children}
    </view>
  );
}

export function SettingsNavigationIconElement(props: {
  readonly name: string;
}) {
  return (
    <SettingsIconElement
      className="SharedSettingsNavigationIcon"
      name={props.name}
    />
  );
}

export function SettingsNavigationItemLabelElement(props: ChildrenProps) {
  return <text className="SharedSettingsNavigationItemLabel">{props.children}</text>;
}
