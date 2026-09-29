import { useLynxInteractiveState } from "./interactive-state.lynx";
import { cx } from "./shared.lynx";
import "./primitives.css";

export function Switch(props: {
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly ariaLabel: string;
  readonly className?: string;
  readonly thumbClassName?: string;
  readonly onCheckedChange: (checked: boolean) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: cx("LxSwitch", props.checked && "LxSwitch--checked", props.className),
    accessibleLabel: props.ariaLabel,
    accessibilityValue: props.checked ? "On" : "Off",
    disabled: props.disabled,
    onActivate: () => props.onCheckedChange(!props.checked),
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.ariaLabel}
      aria-checked={props.checked}
      accessibility-role="switch"
      accessibility-state={{
        checked: props.checked,
        ...(props.disabled ? { disabled: true } : {}),
      }}
      {...interaction.eventProps}
    >
      <view className={cx("LxSwitchThumb", props.thumbClassName)} />
    </view>
  );
}
