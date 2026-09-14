import { describe, expect, it, rs } from '@rstest/core';
import { readFileSync } from 'node:fs';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { TimePicker, timePickerInitialScrollOffset } from './time-picker.lynx';

describe('TimePicker', () => {
  it('centers the initial hour and minute without child scrollIntoView calls', () => {
    expect(timePickerInitialScrollOffset(0)).toBe(0);
    expect(timePickerInitialScrollOffset(9)).toBe(200);
    expect(timePickerInitialScrollOffset(30)).toBe(830);
    const source = readFileSync(new URL('./time-picker.lynx.tsx', import.meta.url), 'utf8');
    expect(source).toContain(
      'initial-scroll-offset={timePickerInitialScrollOffset(props.selected)}'
    );
    expect(source).not.toContain('scrollLynxElementIntoViewById');
  });

  it('renders complete hour/minute columns with selected semantics', () => {
    render(<TimePicker value="09:30" onChange={() => {}} />);
    expect(elementTree.root?.querySelectorAll('.LxTimePickerOption')).toHaveLength(84);
    expect(elementTree.root?.querySelectorAll('.LxTimePickerOption--selected')).toHaveLength(2);
  });

  it('emits canonical HH:MM values', () => {
    const onChange = rs.fn();
    render(<TimePicker value="09:30" onChange={onChange} />);
    const options = elementTree.root?.querySelectorAll('.LxTimePickerOption') ?? [];
    fireEvent.tap(options[7]!);
    expect(onChange).toHaveBeenCalledWith('07:30');
    fireEvent.tap(options[24 + 5]!);
    expect(onChange).toHaveBeenCalledWith('09:05');
  });
});
