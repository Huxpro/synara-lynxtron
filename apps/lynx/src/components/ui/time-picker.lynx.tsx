import { formatTimePickerPart, parseTimePickerValue, TIME_PICKER_HOURS, TIME_PICKER_MINUTES } from '@synara/shared/timePicker';
import { Button } from './button.lynx';
import { Separator } from './separator.lynx';
import './primitives.css';

function TimeColumn(props: { readonly ariaLabel: string; readonly selected: number; readonly values: readonly number[]; readonly onSelect: (value: number) => void }) {
  return <scroll-view className="LxTimePickerColumn" scroll-orientation="vertical" aria-label={props.ariaLabel} accessibility-role="list">
    <view className="LxTimePickerColumnContent">{props.values.map((value) => { const selected = value === props.selected; return <Button key={value} className={`LxTimePickerOption${selected ? ' LxTimePickerOption--selected' : ''}`} size="sm" variant={selected ? 'default' : 'ghost'} aria-label={`${props.ariaLabel} ${formatTimePickerPart(value)}`} aria-selected={selected} buttonProps={{ 'accessibility-role': 'option', 'accessibility-state': { selected } }} onClick={() => props.onSelect(value)}>{formatTimePickerPart(value)}</Button>; })}</view>
  </scroll-view>;
}

export function TimePicker(props: { readonly value: string; readonly onChange: (value: string) => void; readonly className?: string; readonly disabled?: boolean }) {
  const { hour, minute } = parseTimePickerValue(props.value);
  return <view className={`LxTimePicker${props.className ? ` ${props.className}` : ''}`} style={{ opacity: props.disabled ? 0.64 : 1 }}>
    <TimeColumn ariaLabel="Hour" selected={hour} values={TIME_PICKER_HOURS} onSelect={(next) => { if (!props.disabled) props.onChange(`${formatTimePickerPart(next)}:${formatTimePickerPart(minute)}`); }} />
    <Separator orientation="vertical" />
    <TimeColumn ariaLabel="Minute" selected={minute} values={TIME_PICKER_MINUTES} onSelect={(next) => { if (!props.disabled) props.onChange(`${formatTimePickerPart(hour)}:${formatTimePickerPart(next)}`); }} />
  </view>;
}
