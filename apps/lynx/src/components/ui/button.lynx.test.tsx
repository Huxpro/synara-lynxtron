import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { Button } from './button.lynx';

describe('Lynx Button accessibility contract', () => {
  it('publishes disabled state and remains inert', () => {
    const onClick = rs.fn();
    render(
      <Button
        disabled
        aria-label="Retry loading preferences"
        onClick={onClick}
      >
        Retry
      </Button>
    );

    const button = elementTree.root?.querySelector('.LxButton');
    if (!button) throw new Error('expected disabled Button');
    expect(button.getAttribute('accessibility-label')).toBe(
      'Retry loading preferences'
    );
    expect(button.getAttribute('accessibility-state')).toBe(
      '{"disabled":true}'
    );
    fireEvent.tap(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('merges disabled state with existing selected metadata', () => {
    render(
      <Button
        disabled
        aria-label="Selected option"
        buttonProps={{
          'accessibility-state': { selected: true },
        }}
      >
        Selected
      </Button>
    );

    const button = elementTree.root?.querySelector('.LxButton');
    expect(button?.getAttribute('accessibility-state')).toBe(
      '{"selected":true,"disabled":true}'
    );
  });
});
