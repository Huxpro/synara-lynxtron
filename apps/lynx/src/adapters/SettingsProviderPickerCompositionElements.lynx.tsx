import type { ProviderKind } from "@synara/contracts";
import type {
  SettingsProviderPickerItem,
  SettingsProviderPickerMoveDirection,
} from "@synara-web/components/settings/SettingsProviderPickerComposition.logic";

import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch.lynx";
import { ChevronDownIcon } from "../lib/icons.lynx";
import { SettingsHeadingElement } from "./SettingsHeadingElement.lynx";
import { SettingsResetIcon } from "./SettingsResetIcon.lynx";
import { useLynxInteractiveState } from "./useLynxInteractiveState";

function ProviderVisibilitySwitch(props: {
  readonly item: SettingsProviderPickerItem;
  readonly onHiddenChange: (provider: ProviderKind, hidden: boolean) => void;
}) {
  const checked = !props.item.hidden;
  return (
    <Switch
      checked={checked}
      ariaLabel={`Show ${props.item.title} in the provider picker`}
      className={`SharedSettingsProviderPickerSwitch${checked ? " SharedSettingsProviderPickerSwitch--on" : ""}`}
      thumbClassName="SharedSettingsProviderPickerSwitchThumb"
      onCheckedChange={(next) => props.onHiddenChange(props.item.provider, !next)}
    />
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
    baseClassName: "SharedSettingsProviderPickerReset",
    accessibleLabel: "Reset provider picker to default",
    onActivate: props.onReset,
  });
  return (
    <view className="SharedSettingsProviderPickerSection">
      <SettingsHeadingElement className="SharedSettingsProviderPickerSectionTitle">
        {props.sectionTitle}
      </SettingsHeadingElement>
      <view className="SharedSettingsProviderPickerCard">
        <view className="SharedSettingsProviderPickerHeader">
          <view className="SharedSettingsProviderPickerHeaderCopy">
            <view className="SharedSettingsProviderPickerTitleLine">
              <SettingsHeadingElement className="SharedSettingsProviderPickerTitle">
                {props.title}
              </SettingsHeadingElement>
              {props.changed ? (
                <view
                  className={resetInteraction.className}
                  aria-label="Reset provider picker to default"
                  {...resetInteraction.eventProps}
                >
                  <SettingsResetIcon />
                </view>
              ) : null}
            </view>
            <text className="SharedSettingsProviderPickerDescription">{props.description}</text>
            <text className="SharedSettingsProviderPickerStatus">{props.status}</text>
          </view>
        </view>
        <view className="SharedSettingsProviderPickerList">
          {props.items.map((item) => (
            <view key={item.provider} className="SharedSettingsProviderPickerItem">
              <text className="SharedSettingsProviderPickerItemTitle">{item.title}</text>
              <view className="SharedSettingsProviderPickerItemActions">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled={!item.canMoveUp}
                  aria-label={`Move ${item.title} up`}
                  onClick={() => props.onMove(item.provider, "up")}
                >
                  <ChevronDownIcon
                    className="SharedSettingsProviderPickerMoveIcon SharedSettingsProviderPickerMoveIcon--up"
                    size={14}
                    color="var(--muted-foreground)"
                  />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled={!item.canMoveDown}
                  aria-label={`Move ${item.title} down`}
                  onClick={() => props.onMove(item.provider, "down")}
                >
                  <ChevronDownIcon
                    className="SharedSettingsProviderPickerMoveIcon"
                    size={14}
                    color="var(--muted-foreground)"
                  />
                </Button>
                <ProviderVisibilitySwitch item={item} onHiddenChange={props.onHiddenChange} />
              </view>
            </view>
          ))}
        </view>
      </view>
    </view>
  );
}
