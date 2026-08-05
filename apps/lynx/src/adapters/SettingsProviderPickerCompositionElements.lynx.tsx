import type { ProviderKind } from '@synara/contracts';
import type {
  SettingsProviderPickerItem,
  SettingsProviderPickerMoveDirection,
} from '@synara-web/components/settings/SettingsProviderPickerComposition.logic';

import { Button } from '../components/ui/button';
import { Undo2Icon } from '../lib/icons.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';

function ProviderVisibilitySwitch(props: {
  readonly item: SettingsProviderPickerItem;
  readonly onHiddenChange: (provider: ProviderKind, hidden: boolean) => void;
}) {
  const checked = !props.item.hidden;
  const interaction = useLynxInteractiveState({
    baseClassName: `SharedSettingsProviderPickerSwitch${
      checked ? ' SharedSettingsProviderPickerSwitch--on' : ''
    }`,
    accessibleLabel: `Show ${props.item.title} in the provider picker`,
    accessibilityValue: checked ? 'On' : 'Off',
    onActivate: () =>
      props.onHiddenChange(props.item.provider, checked),
  });
  return (
    <view
      className={interaction.className}
      aria-label={`Show ${props.item.title} in the provider picker`}
      aria-checked={checked}
      {...interaction.eventProps}
    >
      <view className="SharedSettingsProviderPickerSwitchThumb" />
    </view>
  );
}

export function SettingsProviderPickerElement(props: {
  readonly sectionTitle: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly changed: boolean;
  readonly items: readonly SettingsProviderPickerItem[];
  readonly onReset: () => void;
  readonly onHiddenChange: (provider: ProviderKind, hidden: boolean) => void;
  readonly onMove: (provider: ProviderKind, direction: SettingsProviderPickerMoveDirection) => void;
  readonly onReorder: (provider: ProviderKind, overProvider: ProviderKind) => void;
}) {
  const resetInteraction = useLynxInteractiveState({
    baseClassName: 'SharedSettingsProviderPickerReset',
    accessibleLabel: 'Reset provider picker to default',
    onActivate: props.onReset,
  });
  return (
    <view className="SharedSettingsProviderPickerSection">
      <text className="SharedSettingsProviderPickerSectionTitle">
        {props.sectionTitle}
      </text>
      <view className="SharedSettingsProviderPickerCard">
        <view className="SharedSettingsProviderPickerHeader">
          <view className="SharedSettingsProviderPickerHeaderCopy">
            <view className="SharedSettingsProviderPickerTitleLine">
              <text className="SharedSettingsProviderPickerTitle">
                {props.title}
              </text>
              {props.changed ? (
                <view
                  className={resetInteraction.className}
                  aria-label="Reset provider picker to default"
                  {...resetInteraction.eventProps}
                >
                  <Undo2Icon size={14} color="var(--muted-foreground)" />
                </view>
              ) : null}
            </view>
            <text className="SharedSettingsProviderPickerDescription">
              {props.description}
            </text>
            <text className="SharedSettingsProviderPickerStatus">
              {props.status}
            </text>
          </view>
        </view>
        <view className="SharedSettingsProviderPickerList">
          {props.items.map((item) => (
            <view
              key={item.provider}
              className="SharedSettingsProviderPickerItem"
            >
              <text className="SharedSettingsProviderPickerItemTitle">
                {item.title}
              </text>
              <view className="SharedSettingsProviderPickerItemActions">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled={!item.canMoveUp}
                  aria-label={`Move ${item.title} up`}
                  onClick={() => props.onMove(item.provider, 'up')}
                >
                  ↑
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled={!item.canMoveDown}
                  aria-label={`Move ${item.title} down`}
                  onClick={() => props.onMove(item.provider, 'down')}
                >
                  ↓
                </Button>
                <ProviderVisibilitySwitch
                  item={item}
                  onHiddenChange={props.onHiddenChange}
                />
              </view>
            </view>
          ))}
        </view>
      </view>
    </view>
  );
}
