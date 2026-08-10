import type { ReactNode } from '@lynx-js/react';
import type { SettingsGitWritingModelOption } from '@synara-web/components/settings/SettingsGitWritingModelComposition.logic';

import { ChevronDownIcon } from '../lib/icons.lynx';
import { Button } from '../components/ui/button';
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

export function SettingsGitWritingModelRootElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="SharedSettingsGeneralRoot">{props.children}</view>;
}

export function SettingsGitWritingModelSectionElement(props: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className="SharedSettingsGeneralSection">
      <SettingsHeadingElement className="SharedSettingsGeneralSectionTitle">
        {props.title}
      </SettingsHeadingElement>
      <view className="SharedSettingsGeneralCard">{props.children}</view>
    </view>
  );
}

export function SettingsGitWritingModelRowElement(props: {
  readonly title: string;
  readonly description: string;
  readonly changed: boolean;
  readonly onReset: () => void;
  readonly children?: ReactNode;
}) {
  const resetInteraction = useLynxInteractiveState({
    baseClassName: 'SharedSettingsGeneralReset',
    accessibleLabel: 'Reset git writing model to default',
    onActivate: props.onReset,
  });
  return (
    <view className="SharedSettingsGeneralRow SharedSettingsGeneralRow--terminal">
      <view className="SharedSettingsGeneralRowCopy">
        <view className="SharedSettingsGeneralRowTitleLine">
          <SettingsHeadingElement className="SharedSettingsGeneralRowTitle">
            {props.title}
          </SettingsHeadingElement>
          {props.changed ? (
            <view
              className={resetInteraction.className}
              aria-label="Reset git writing model to default"
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

export function SettingsGitWritingModelSelectElement(props: {
  readonly value: string;
  readonly ariaLabel: string;
  readonly options: readonly SettingsGitWritingModelOption[];
  readonly onChange: (value: string) => void;
}) {
  const selected = props.options.find(
    (option) => `${option.provider}:${option.model}` === props.value
  );
  return (
    <Menu>
      <MenuTrigger ariaLabel={props.ariaLabel}>
        <Button
          variant="outline"
          className="SharedSettingsGeneralSelectTrigger SharedSettingsGeneralSelectTrigger--writing-model"
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
          {props.options.map((option) => {
            const value = `${option.provider}:${option.model}`;
            return (
              <MenuRadioItem key={value} value={value}>
                {option.label}
              </MenuRadioItem>
            );
          })}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
