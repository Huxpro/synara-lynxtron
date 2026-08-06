import plusSvg from '@synara-central-icons/plus-medium.svg?raw';
import type { ReactNode } from '@lynx-js/react';

import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import { useTheme } from './useTheme.lynx';
import './sidebar-list-section-header-elements.css';

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarListSectionHeaderContainerElement({ children }: ChildrenProps) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedSidebarListSectionHeader LynxWebHoverOwner',
    focusable: false,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {children}
    </view>
  );
}

export function SidebarListSectionHeaderLabelElement({ children }: ChildrenProps) {
  return (
    <view className="SharedSidebarListSectionHeaderLabel">
      <text className="SharedSidebarListSectionHeaderText">{children}</text>
    </view>
  );
}

export function SidebarListSectionHeaderToolbarElement({ children }: ChildrenProps) {
  return <view className="SharedSidebarListSectionHeaderToolbar">{children}</view>;
}

export function SidebarListSectionHeaderAddProjectElement(props: {
  readonly elementId?: string;
  readonly onActivate: () => void;
}) {
  const { svgColors } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedSidebarListSectionHeaderAction',
    accessibleLabel: 'Add project',
    onActivate: props.onActivate,
  });
  return (
    <view
      id={props.elementId}
      className={interaction.className}
      {...interaction.eventProps}
    >
      <svg
        className="SharedSidebarListSectionHeaderActionIcon"
        content={colorizeLynxSvg(plusSvg, svgColors.mutedForeground)}
      />
    </view>
  );
}
