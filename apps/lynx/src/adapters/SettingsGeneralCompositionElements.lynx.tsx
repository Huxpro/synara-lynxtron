import type { ReactNode } from '@lynx-js/react';
import type {
  SettingsGeneralKey,
  SettingsGeneralOption,
} from '@synara-web/components/settings/SettingsGeneralComposition.logic';

import { ChevronDownIcon } from '../lib/icons.lynx';
import { Button } from '../components/ui/button';
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu';
import { SettingsResetIcon } from './SettingsResetIcon.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import { settingRowAnchorId } from '@synara-web/settingsNavigation';

export function SettingsGeneralRootElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="SharedSettingsGeneralRoot">{props.children}</view>;
}

export function SettingsGeneralSectionElement(props: {
  readonly title: string;
  readonly targetId?: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className="SharedSettingsGeneralSection">
      <text className="SharedSettingsGeneralSectionTitle">{props.title}</text>
      <view className="SharedSettingsGeneralCard">{props.children}</view>
    </view>
  );
}

export function SettingsGeneralRowElement(props: {
  readonly terminal?: boolean;
  readonly title: string;
  readonly description: string;
  readonly resetLabel: string;
  readonly changed: boolean;
  readonly onReset: () => void;
  readonly children?: ReactNode;
}) {
  const resetInteraction = useLynxInteractiveState({
    baseClassName: 'SharedSettingsGeneralReset',
    accessibleLabel: `Reset ${props.resetLabel} to default`,
    onActivate: props.onReset,
  });
  return (
    <view
      id={settingRowAnchorId(props.title)}
      className={`SharedSettingsGeneralRow${
        props.terminal ? ' SharedSettingsGeneralRow--terminal' : ''
      }`}
    >
      <view className="SharedSettingsGeneralRowCopy">
        <view className="SharedSettingsGeneralRowTitleLine">
          <text className="SharedSettingsGeneralRowTitle">{props.title}</text>
          {props.changed ? (
            <view
              className={resetInteraction.className}
              aria-label={`Reset ${props.resetLabel} to default`}
              {...resetInteraction.eventProps}
            >
              <SettingsResetIcon />
            </view>
          ) : null}
        </view>
        <text className="SharedSettingsGeneralRowDescription">
          {props.description}
        </text>
      </view>
      <view className="SharedSettingsGeneralRowControl">{props.children}</view>
    </view>
  );
}

export function SettingsGeneralBooleanControlElement(props: {
  readonly checked: boolean;
  readonly ariaLabel: string;
  readonly onChange: (checked: boolean) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedSettingsGeneralSwitch${
      props.checked ? ' SharedSettingsGeneralSwitch--on' : ''
    }`,
    accessibleLabel: props.ariaLabel,
    accessibilityValue: props.checked ? 'On' : 'Off',
    onActivate: () => props.onChange(!props.checked),
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.ariaLabel}
      aria-checked={props.checked}
      {...interaction.eventProps}
    >
      <view className="SharedSettingsGeneralSwitchThumb" />
    </view>
  );
}

export function SettingsGeneralSelectControlElement(props: {
  readonly settingKey: SettingsGeneralKey;
  readonly value: string;
  readonly ariaLabel: string;
  readonly options: readonly SettingsGeneralOption[];
  readonly onChange: (value: string) => void;
}) {
  const selected =
    props.options.find((option) => option.value === props.value) ??
    props.options[0];

  return (
    <Menu>
      <MenuTrigger>
        <Button
          variant="outline"
          className="SharedSettingsGeneralSelectTrigger SharedSettingsGeneralSelectTrigger--general"
          aria-label={props.ariaLabel}
        >
          <view className="SharedSettingsGeneralSelectContent">
            <text className="SharedSettingsGeneralSelectLabel">
              {selected?.label ?? props.value}
            </text>
            <ChevronDownIcon
              className="SharedSettingsGeneralSelectChevron"
              size={12}
              color="var(--foreground)"
            />
          </view>
        </Button>
      </MenuTrigger>
      <MenuPopup
        side="bottom"
        align="end"
        className="SharedSettingsGeneralSelectPopup"
      >
        <MenuRadioGroup value={props.value} onValueChange={props.onChange}>
          {props.options.map((option) => (
            <MenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
