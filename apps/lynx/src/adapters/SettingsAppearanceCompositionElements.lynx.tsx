import { useState, type ReactNode } from '@lynx-js/react';
import { TERMINAL_FONT_FAMILY_SUGGESTIONS } from '@synara-web/components/settings/SettingsAppearanceComposition.logic';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  ChevronDownIcon,
  DeviceLaptopIcon,
  MoonIcon,
  SunIcon,
  XIcon,
  type LynxIcon,
} from '../lib/icons.lynx';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu';
import { SettingsHeadingElement } from './SettingsHeadingElement.lynx';
import { SettingsResetIcon } from './SettingsResetIcon.lynx';
import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from './useLynxInteractiveState';
import { settingRowAnchorId } from '@synara-web/settingsNavigation';

type Option = { readonly value: string; readonly label: string };

const THEME_OPTION_ICONS: Readonly<Record<string, LynxIcon>> = {
  light: SunIcon,
  dark: MoonIcon,
  system: DeviceLaptopIcon,
};

export function filterTerminalFontSuggestions(
  value: string
): ReadonlyArray<string> {
  const query = value.trim().toLowerCase();
  return query
    ? TERMINAL_FONT_FAMILY_SUGGESTIONS.filter((font) =>
        font.toLowerCase().includes(query)
      )
    : TERMINAL_FONT_FAMILY_SUGGESTIONS;
}

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
      <SettingsHeadingElement className="SharedSettingsAppearanceSectionTitle">
        {props.title}
      </SettingsHeadingElement>
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
  readonly terminal?: boolean;
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
      className={`SharedSettingsAppearanceRow${
        props.terminal ? ' SharedSettingsAppearanceRow--terminal' : ''
      }`}
    >
      <view className="SharedSettingsAppearanceRowCopy">
        <view className="SharedSettingsAppearanceTitleLine">
          <SettingsHeadingElement className="SharedSettingsAppearanceRowTitle">
            {props.title}
          </SettingsHeadingElement>
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
    <view
      className="SharedSettingsAppearanceSegments"
      role="radiogroup"
      aria-label={props.ariaLabel}
    >
      {props.options.map((option) => {
        const active = option.value === props.value;
        const Icon =
          props.ariaLabel === 'Theme preference'
            ? THEME_OPTION_ICONS[option.value]
            : undefined;
        return (
          <Button
            key={option.value}
            size="sm"
            variant={active ? 'secondary' : 'ghost'}
            className={`SharedSettingsAppearanceSegment${
              Icon ? '' : ' SharedSettingsAppearanceSegment--text-only'
            }${
              active
                ? ' SharedSettingsAppearanceSegment--active'
                : ' SharedSettingsAppearanceSegment--inactive'
            }`}
            role="radio"
            aria-checked={active}
            aria-label={`${props.ariaLabel}: ${option.label}`}
            buttonProps={{
              'accessibility-state': { selected: active },
            }}
            onClick={() => props.onChange(option.value)}
          >
            {Icon ? (
              <Icon
                className="SharedSettingsAppearanceSegmentIcon"
                size={16}
                color={active ? 'var(--foreground)' : 'var(--muted-foreground)'}
              />
            ) : null}
            <text className="LxButton__text">{option.label}</text>
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
      accessibility-role="switch"
      accessibility-state={{ checked: props.checked }}
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
        size="sm"
        variant="soft"
        value={String(props.value)}
        accessibility-label={props.ariaLabel}
        onChange={(event) => {
          const value = event.target.value.trim();
          if (value) props.onChange(Number(value));
        }}
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
  const [open, setOpen] = useState(false);
  const clearInteraction = useLynxInteractiveState({
    baseClassName: 'SharedSettingsAppearanceFontAction',
    accessibleLabel: 'Clear terminal font family',
    onActivate: () => {
      props.onChange('');
      setOpen(true);
    },
  });
  const suggestions = filterTerminalFontSuggestions(props.value);
  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger
        className="SharedSettingsAppearanceFontTrigger"
        ariaLabel={props.ariaLabel}
        onActivate={() => setOpen(true)}
      >
        <view className="SharedSettingsAppearanceFontInput">
          <Input
            size="sm"
            variant="soft"
            value={props.value}
            placeholder={props.placeholder}
            accessibility-label={props.ariaLabel}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              props.onChange(event.target.value);
              setOpen(true);
            }}
          />
          {props.value.length > 0 ? (
            <view
              className={clearInteraction.className}
              aria-label="Clear terminal font family"
              {...lynxNestedInteractiveEventProps(clearInteraction.eventProps)}
            >
              <XIcon size={14} color="var(--muted-foreground)" />
            </view>
          ) : (
            <view className="SharedSettingsAppearanceFontAction" aria-hidden="true">
              <ChevronDownIcon size={14} color="var(--muted-foreground)" />
            </view>
          )}
        </view>
      </MenuTrigger>
      <MenuPopup
        className="SharedSettingsAppearanceFontPopup"
        align="end"
      >
        <scroll-view
          className="SharedSettingsAppearanceFontList"
          scroll-y
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <MenuItem
                key={suggestion}
                onClick={() => props.onChange(suggestion)}
              >
                {suggestion}
              </MenuItem>
            ))
          ) : (
            <text className="SharedSettingsAppearanceFontEmpty">
              No matching suggested fonts.
            </text>
          )}
        </scroll-view>
      </MenuPopup>
    </Menu>
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
      <MenuTrigger ariaLabel={props.ariaLabel}>
        <Button
          variant="outline"
          className="SharedSettingsAppearanceSelect"
          aria-label={props.ariaLabel}
        >
          <text className="SharedSettingsAppearanceSelectLabel">
            {selected?.label ?? props.value}
          </text>
          <ChevronDownIcon
            className="SharedSettingsAppearanceSelectChevron"
            size={14}
            color="var(--muted-foreground)"
          />
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
