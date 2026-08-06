import filterSvg from '@synara-central-icons/filter-2.svg?raw';
import plusSvg from '@synara-central-icons/plus-medium.svg?raw';
import type { ReactNode } from '@lynx-js/react';

import {
  SIDEBAR_PROJECT_SORT_OPTIONS,
  SIDEBAR_THREAD_SORT_OPTIONS,
} from '@synara-web/components/SidebarProjectSort.logic';
import type {
  SidebarProjectSortOrderValue,
  SidebarThreadSortOrderValue,
} from '@synara-web/sidebarSortDefaults';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import { useTheme } from './useTheme.lynx';
import './sidebar-list-section-header-elements.css';

interface ChildrenProps {
  readonly children?: ReactNode;
}

function SidebarListSectionHeaderActionIcon(props: {
  readonly content: string;
}) {
  const { svgColors } = useTheme();
  return (
    <>
      <svg
        className="SharedSidebarListSectionHeaderActionIcon SharedSidebarListSectionHeaderActionIcon--muted"
        content={colorizeLynxSvg(props.content, svgColors.mutedForeground)}
      />
      <svg
        className="SharedSidebarListSectionHeaderActionIcon SharedSidebarListSectionHeaderActionIcon--foreground"
        content={colorizeLynxSvg(props.content, svgColors.foreground)}
      />
    </>
  );
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
      <SidebarListSectionHeaderActionIcon content={plusSvg} />
    </view>
  );
}

export function SidebarListSectionHeaderSortElement(props: {
  readonly projectSortOrder: SidebarProjectSortOrderValue;
  readonly threadSortOrder: SidebarThreadSortOrderValue;
  readonly onProjectSortOrderChange: (
    value: SidebarProjectSortOrderValue
  ) => void;
  readonly onThreadSortOrderChange: (
    value: SidebarThreadSortOrderValue
  ) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        className="SharedSidebarListSectionHeaderAction"
        ariaLabel="Sort projects"
      >
        <SidebarListSectionHeaderActionIcon content={filterSvg} />
      </MenuTrigger>
      <MenuPopup
        side="bottom"
        align="end"
        className="SharedSidebarProjectSortPopup"
      >
        <MenuGroup>
          <MenuGroupLabel className="SharedSidebarProjectSortGroupLabel">
            Sort projects
          </MenuGroupLabel>
          <MenuRadioGroup
            value={props.projectSortOrder}
            onValueChange={(value) =>
              props.onProjectSortOrderChange(
                value as SidebarProjectSortOrderValue
              )
            }
          >
            {SIDEBAR_PROJECT_SORT_OPTIONS.map((option) => (
              <MenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
        <MenuGroup>
          <MenuGroupLabel className="SharedSidebarProjectSortGroupLabel SharedSidebarProjectSortGroupLabel--secondary">
            Sort threads
          </MenuGroupLabel>
          <MenuRadioGroup
            value={props.threadSortOrder}
            onValueChange={(value) =>
              props.onThreadSortOrderChange(
                value as SidebarThreadSortOrderValue
              )
            }
          >
            {SIDEBAR_THREAD_SORT_OPTIONS.map((option) => (
              <MenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
