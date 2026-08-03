import type { SpaceIconName } from '@synara/contracts';
import type { ReactNode } from '@lynx-js/react';

import {
  BlocksIcon,
  BrainIcon,
  DeviceLaptopIcon,
  FolderIcon,
  PaletteIcon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from '../lib/icons.lynx';
import { Input } from '../components/ui/input.lynx';
import {
  Menu,
  MenuPopupBase,
  MenuTrigger,
} from '../components/ui/menu.lynx';
import { useLynxInteractiveState } from '../components/ui/interactive-state.lynx';

function ComposerProjectPickerTriggerElement(props: {
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly className?: string;
}) {
  return (
    <view className="ComposerProjectPickerTriggerContentLynx">
      <FolderIcon className="ComposerProjectPickerTriggerIconLynx" />
      <view className="ComposerProjectPickerTriggerCopyLynx">
        <text className="ComposerProjectPickerTriggerLabelLynx">
          {props.primaryLabel}
        </text>
        {props.secondaryLabel ? (
          <text className="ComposerProjectPickerTriggerSecondaryLynx">
            {props.secondaryLabel}
          </text>
        ) : null}
      </view>
    </view>
  );
}

export function ComposerProjectPickerFrameElement(props: {
  readonly children?: ReactNode;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly align: 'start' | 'center' | 'end';
  readonly side: 'top' | 'bottom';
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly triggerClassName?: string;
  readonly triggerLabel: string;
  readonly triggerTestId?: string;
}) {
  return (
    <Menu open={props.open} onOpenChange={props.onOpenChange}>
      <MenuTrigger
        className="LandingComposerProjectTrigger ComposerProjectPickerTriggerLynx"
        ariaLabel={props.triggerLabel}
      >
        <ComposerProjectPickerTriggerElement
          primaryLabel={props.primaryLabel}
          secondaryLabel={props.secondaryLabel}
          className={props.triggerClassName}
        />
      </MenuTrigger>
      <MenuPopupBase
        className="ComposerProjectPickerPopupLynx"
        side={props.side}
        align={props.align}
        sideOffset={6}
      >
        {props.children}
      </MenuPopupBase>
    </Menu>
  );
}

export function ComposerProjectPickerPanelElement(props: {
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  readonly placeholder: string;
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
}) {
  return (
    <view className="ComposerProjectPickerPanelLynx">
      <view className="ComposerProjectPickerSearchLynx">
        <Input
          type="search"
          size="sm"
          value={props.query}
          placeholder={props.placeholder}
          onChange={(event) => props.onQueryChange(event.target.value)}
          onKeyDown={() => undefined}
        />
      </view>
      <scroll-view
        className="ComposerProjectPickerListLynx"
        scroll-orientation="vertical"
      >
        {props.children}
      </scroll-view>
      {props.footer ? (
        <view className="ComposerProjectPickerFooterLynx">{props.footer}</view>
      ) : null}
    </view>
  );
}

export function ComposerProjectPickerGroupElement(props: {
  readonly children?: ReactNode;
  readonly separatorBefore: boolean;
}) {
  return (
    <view className="ComposerProjectPickerGroupLynx">
      {props.separatorBefore ? (
        <view className="ComposerProjectPickerSeparatorLynx" />
      ) : null}
      {props.children}
    </view>
  );
}

export function ComposerProjectPickerGroupLabelElement(props: {
  readonly children?: ReactNode;
  readonly icon: SpaceIconName | 'black-hole';
}) {
  const Icon =
    props.icon === 'black-hole'
      ? BlocksIcon
      : props.icon === 'home'
      ? DeviceLaptopIcon
      : props.icon === 'code-brackets'
        ? BlocksIcon
        : props.icon === 'light-bulb'
          ? BrainIcon
          : props.icon === 'color-palette'
            ? PaletteIcon
            : FolderIcon;
  return (
    <view className="ComposerProjectPickerGroupLabelLynx">
      <Icon className="ComposerProjectPickerSpaceIconLynx" />
      <text className="ComposerProjectPickerGroupLabelTextLynx">
        {props.children}
      </text>
    </view>
  );
}

export function ComposerProjectPickerOptionElement(props: {
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerProjectPickerOptionLynx${
      props.selected ? ' ComposerProjectPickerOptionLynx--selected' : ''
    }`,
    accessibleLabel: props.primaryLabel,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      aria-selected={props.selected}
      {...interaction.eventProps}
    >
      <FolderIcon className="ComposerProjectPickerOptionIconLynx" />
      <view className="ComposerProjectPickerOptionCopyLynx">
        <text className="ComposerProjectPickerOptionTitleLynx">
          {props.primaryLabel}
        </text>
        {props.secondaryLabel ? (
          <text className="ComposerProjectPickerOptionSecondaryLynx">
            {props.secondaryLabel}
          </text>
        ) : null}
      </view>
      <text className="ComposerProjectPickerCheckLynx">
        {props.selected ? '✓' : ''}
      </text>
    </view>
  );
}

export function ComposerProjectPickerEmptyElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <view className="ComposerProjectPickerEmptyLynx">
      <text className="ComposerProjectPickerEmptyTextLynx">
        {props.children}
      </text>
    </view>
  );
}

export function ComposerProjectPickerFooterElement(props: {
  readonly children?: ReactNode;
  readonly errorMessage: string | null;
}) {
  return (
    <>
      {props.children}
      {props.errorMessage ? (
        <text className="ComposerProjectPickerErrorLynx">
          {props.errorMessage}
        </text>
      ) : null}
    </>
  );
}

export function ComposerProjectPickerActionElement(props: {
  readonly children?: ReactNode;
  readonly kind: 'add' | 'reset' | 'retry';
  readonly disabled?: boolean;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'ComposerProjectPickerActionLynx',
    accessibleLabel:
      typeof props.children === 'string' ? props.children : undefined,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  const Icon =
    props.kind === 'add'
      ? PlusIcon
      : props.kind === 'reset'
        ? XIcon
        : RefreshCwIcon;
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <Icon className="ComposerProjectPickerActionIconLynx" />
      <text className="ComposerProjectPickerActionTextLynx">
        {props.children}
      </text>
    </view>
  );
}
