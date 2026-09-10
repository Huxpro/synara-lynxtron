import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { Switch } from './switch.lynx';

describe('Switch', () => {
  it('publishes checked and disabled accessibility state', () => {
    render(<Switch checked disabled ariaLabel="Notifications" onCheckedChange={() => {}} />);
    const control = elementTree.root?.querySelector('.LxSwitch');
    expect(control?.getAttribute('accessibility-role')).toBe('switch');
    expect(control?.getAttribute('accessibility-state')).toBe('{"checked":true,"disabled":true}');
  });

  it('toggles through the shared activation path', () => {
    const onCheckedChange = rs.fn();
    render(<Switch checked={false} ariaLabel="Notifications" onCheckedChange={onCheckedChange} />);
    const control = elementTree.root?.querySelector('.LxSwitch');
    if (!control) throw new Error('expected switch');
    fireEvent.tap(control);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
