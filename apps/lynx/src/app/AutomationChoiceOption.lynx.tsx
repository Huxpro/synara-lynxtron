import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";

export function AutomationChoiceOption({
  disabled,
  label,
  selected,
  onSelect,
}: {
  readonly disabled: boolean;
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `AutomationCreateChoice${selected ? " AutomationCreateChoice--selected" : ""}`,
    accessibleLabel: label,
    accessibilityValue: selected ? "Selected" : undefined,
    disabled,
    onActivate: onSelect,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="AutomationCreateChoiceText">{label}</text>
    </view>
  );
}
