import { useTheme } from '../../adapters/useTheme.lynx';
import { CheckIcon } from '../../lib/icons.lynx';
import { cx } from './shared.lynx';
import './primitives.css';

export function CheckboxIndicator(props: {
  readonly checked?: boolean;
  readonly className?: string;
  readonly mixed?: boolean;
  readonly size?: 'sm' | 'default';
}) {
  const { svgColors } = useTheme();
  const selected = props.checked || props.mixed;
  return (
    <view className={cx('LxCheckboxIndicator', `LxCheckboxIndicator--${props.size ?? 'default'}`, selected && 'LxCheckboxIndicator--selected', props.mixed && 'LxCheckboxIndicator--mixed', props.className)} style={selected ? undefined : { backgroundColor: svgColors.checkboxUncheckedSurface }}>
      {props.checked ? <CheckIcon className="LxCheckboxIndicatorIcon" color={svgColors.inverse ?? 'var(--primary-foreground)'} size={props.size === 'sm' ? 10 : 12} /> : null}
      {props.mixed ? <view className="LxCheckboxIndicatorMixedBar" /> : null}
    </view>
  );
}
