import type { ReactNode } from '@lynx-js/react';
import type {
  SettingsGeneralKey,
  SettingsGeneralOption,
} from '@synara-web/components/settings/SettingsGeneralComposition.logic';

import { ChevronDownIcon } from '../lib/icons.lynx';
import { Button } from '../components/ui/button';
import {
  OpenAIProviderIcon,
  hasLynxProviderIcon,
} from '../components/OpenAIProviderIcon.lynx';
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu';
import { SettingsHeadingElement } from './SettingsHeadingElement.lynx';
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
    <view id={props.targetId} className="SharedSettingsGeneralSection">
      <SettingsHeadingElement className="SharedSettingsGeneralSectionTitle">
        {props.title}
      </SettingsHeadingElement>
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
          <SettingsHeadingElement className="SharedSettingsGeneralRowTitle">
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
  readonly disabled?: boolean;
  readonly ariaLabel: string;
  readonly onChange: (checked: boolean) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedSettingsGeneralSwitch${
      props.checked ? ' SharedSettingsGeneralSwitch--on' : ''
    }${props.disabled ? ' SharedSettingsGeneralSwitch--disabled' : ''}`,
    accessibleLabel: props.ariaLabel,
    accessibilityValue: props.checked ? 'On' : 'Off',
    disabled: props.disabled,
    onActivate: () => props.onChange(!props.checked),
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.ariaLabel}
      aria-checked={props.checked}
      accessibility-role="switch"
      accessibility-state={{
        checked: props.checked,
        disabled: props.disabled ?? false,
      }}
      {...interaction.eventProps}
    >
      <view className="SharedSettingsGeneralSwitchThumb" />
    </view>
  );
}

function SettingsGeneralProviderOption(props: {
  readonly provider: string;
  readonly label: string;
}) {
  return (
    <view className="SharedSettingsGeneralProviderOption">
      {hasLynxProviderIcon(props.provider) ? (
        <OpenAIProviderIcon provider={props.provider} />
      ) : (
        <view className="SharedSettingsGeneralProviderFallback">
          <text className="SharedSettingsGeneralProviderFallbackText">
            {props.label.slice(0, 1).toUpperCase()}
          </text>
        </view>
      )}
      <text className="SharedSettingsGeneralProviderLabel">{props.label}</text>
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
  const provider = props.settingKey === 'defaultProvider';

  return (
    <Menu>
      <MenuTrigger ariaLabel={props.ariaLabel}>
        <Button
          variant="outline"
          className="SharedSettingsGeneralSelectTrigger SharedSettingsGeneralSelectTrigger--general"
          buttonProps={{ 'accessibility-element': false }}
        >
          <view className="SharedSettingsGeneralSelectContent">
            {provider && selected ? (
              <SettingsGeneralProviderOption
                provider={selected.value}
                label={selected.label}
              />
            ) : (
              <text className="SharedSettingsGeneralSelectLabel">
                {selected?.label ?? props.value}
              </text>
            )}
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
              {provider ? (
                <SettingsGeneralProviderOption
                  provider={option.value}
                  label={option.label}
                />
              ) : (
                option.label
              )}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
