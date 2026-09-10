import type { ReactNode } from 'react';

import './sidebar-primary-action-elements.css';
import { useLynxInteractiveState } from './useLynxInteractiveState';

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarPrimaryActionItemElement({ children }: ChildrenProps) {
  return <view className="SharedSidebarPrimaryActionItem">{children}</view>;
}

export function SidebarPrimaryActionButtonElement({
  active,
  elementId,
  accessibleLabel,
  disabled,
  onActivate,
  onMouseEnter,
  onFocus,
  visualState,
  children,
}: ChildrenProps & {
  readonly active: boolean;
  readonly elementId?: string;
  readonly accessibleLabel: string;
  readonly disabled: boolean;
  readonly onActivate?: (() => void) | undefined;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onFocus?: (() => void) | undefined;
  readonly visualState?: 'default' | 'hover' | 'focus' | 'pressed';
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedSidebarPrimaryActionButton${
      active ? ' SharedSidebarPrimaryActionButton--active' : ''
    }${disabled ? ' SharedSidebarPrimaryActionButton--disabled' : ''}${
      visualState && visualState !== 'default' ? ` ui-${visualState}` : ''
    }`,
    accessibleLabel,
    accessibilityValue: active ? 'Current page' : undefined,
    disabled,
    programmaticFocusId: elementId,
    onActivate,
  });
  const eventProps = {
    ...interaction.eventProps,
    bindmouseenter: disabled
      ? undefined
      : () => {
          interaction.eventProps.bindmouseenter?.();
          onMouseEnter?.();
        },
    bindfocus: disabled
      ? undefined
      : () => {
          interaction.eventProps.bindfocus?.();
          onFocus?.();
        },
  };
  return (
    <view
      id={elementId}
      className={interaction.className}
      accessibility-state={disabled ? { disabled: true } : undefined}
      {...eventProps}
    >
      {children}
    </view>
  );
}

export function SidebarPrimaryActionLeadingElement({ children }: ChildrenProps) {
  return <view className="SharedSidebarPrimaryActionLeading">{children}</view>;
}

export function SidebarPrimaryActionLabelElement({ children }: ChildrenProps) {
  return <text className="SharedSidebarPrimaryActionLabel">{children}</text>;
}

export function SidebarPrimaryActionTrailingElement({ children }: ChildrenProps) {
  return <view className="SharedSidebarPrimaryActionTrailing">{children}</view>;
}
