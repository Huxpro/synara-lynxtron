import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { Button } from './button.lynx';

describe('Lynx Button accessibility contract', () => {
  it('exposes visible-text actions as Native buttons by default', () => {
    render(<Button>Save</Button>);

    const button = elementTree.root?.querySelector('.LxButton');
    expect(button?.getAttribute('accessibility-element')).toBe('true');
    expect(button?.getAttribute('accessibility-traits')).toBe('button');
    expect(button?.textContent).toBe('Save');
  });

  it('honors explicit passive accessibility ownership', () => {
    render(
      <Button buttonProps={{ 'accessibility-element': false }}>
        Visual only
      </Button>
    );

    const button = elementTree.root?.querySelector('.LxButton');
    expect(button?.getAttribute('accessibility-element')).toBe('false');
    expect(button?.getAttribute('accessibility-traits')).toBeNull();
  });

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
