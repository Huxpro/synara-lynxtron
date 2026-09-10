import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { TimePicker } from './time-picker.lynx';

describe('TimePicker', () => {
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
