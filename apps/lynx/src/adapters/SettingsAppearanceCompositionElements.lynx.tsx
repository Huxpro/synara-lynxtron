import type { ReactNode } from '@lynx-js/react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DeviceLaptopIcon,
  MoonIcon,
  SunIcon,
  type LynxIcon,
} from '../lib/icons.lynx';
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

type Option = { readonly value: string; readonly label: string };

const THEME_OPTION_ICONS: Readonly<Record<string, LynxIcon>> = {
  light: SunIcon,
  dark: MoonIcon,
  system: DeviceLaptopIcon,
};

export function SettingsAppearanceRootElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="SharedSettingsAppearanceRoot">{props.children}</view>;
}

export function SettingsAppearanceSectionElement(props: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className="SharedSettingsAppearanceSection">
      <text className="SharedSettingsAppearanceSectionTitle">{props.title}</text>
      {props.children}
    </view>
  );
}

export function SettingsAppearanceCardElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="SharedSettingsAppearanceCard">{props.children}</view>;
}

export function SettingsAppearanceRowElement(props: {
  readonly title: string;
  readonly description: string;
  readonly resetLabel: string;
  readonly changed: boolean;
  readonly onReset: () => void;
  readonly children?: ReactNode;
}) {
  const resetInteraction = useLynxInteractiveState({
    baseClassName: 'SharedSettingsAppearanceReset',
    accessibleLabel: `Reset ${props.resetLabel} to default`,
    onActivate: props.onReset,
  });
  return (
    <view
      id={settingRowAnchorId(props.title)}
      className="SharedSettingsAppearanceRow"
    >
      <view className="SharedSettingsAppearanceRowCopy">
        <view className="SharedSettingsAppearanceTitleLine">
          <text className="SharedSettingsAppearanceRowTitle">{props.title}</text>
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
        <text className="SharedSettingsAppearanceRowDescription">
          {props.description}
        </text>
      </view>
      <view className="SharedSettingsAppearanceControl">{props.children}</view>
    </view>
  );
}

export function SettingsAppearanceSegmentedControlElement(props: {
  readonly value: string;
  readonly ariaLabel: string;
  readonly options: readonly Option[];
  readonly onChange: (value: string) => void;
}) {
  return (
    <view className="SharedSettingsAppearanceSegments">
      {props.options.map((option) => {
        const Icon =
          props.ariaLabel === 'Theme preference'
            ? THEME_OPTION_ICONS[option.value]
            : undefined;
        return (
          <Button
            key={option.value}
            size="sm"
            variant={option.value === props.value ? 'secondary' : 'ghost'}
            aria-label={`${props.ariaLabel}: ${option.label}`}
            onClick={() => props.onChange(option.value)}
          >
            {Icon ? <Icon size={14} color="var(--foreground)" /> : null}
            {option.label}
          </Button>
        );
      })}
    </view>
  );
}

export function SettingsAppearanceBooleanControlElement(props: {
  readonly checked: boolean;
  readonly ariaLabel: string;
  readonly onChange: (checked: boolean) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedSettingsAppearanceSwitch${
      props.checked ? ' SharedSettingsAppearanceSwitch--on' : ''
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
      <view className="SharedSettingsAppearanceSwitchThumb" />
    </view>
  );
}

export function SettingsAppearanceNumberControlElement(props: {
  readonly value: number;
  readonly suffix: string;
  readonly ariaLabel: string;
  readonly onChange: (value: number) => void;
}) {
  return (
    <view className="SharedSettingsAppearanceInputLine">
      <Input
        type="number"
        value={String(props.value)}
        accessibility-label={props.ariaLabel}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
      <text className="SharedSettingsAppearanceSuffix">{props.suffix}</text>
    </view>
  );
}

export function SettingsAppearanceTextControlElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly ariaLabel: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Input
      value={props.value}
      placeholder={props.placeholder}
      accessibility-label={props.ariaLabel}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}

export function SettingsAppearanceSelectControlElement(props: {
  readonly value: string;
  readonly ariaLabel: string;
  readonly options: readonly Option[];
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
          className="SharedSettingsAppearanceSelect"
          aria-label={props.ariaLabel}
        >
          {selected?.label ?? props.value}
        </Button>
      </MenuTrigger>
      <MenuPopup className="SharedSettingsAppearanceSelectPopup">
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

export function SettingsAppearanceThemePacksElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <view className="SharedSettingsAppearanceThemePacks">
      {props.children}
    </view>
  );
}
