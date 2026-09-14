import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { Button } from './button.lynx';

describe('Lynx Button accessibility contract', () => {
  it('uses variant-owned pressed paint without globally dimming or scaling', () => {
    const styles = readFileSync(
      new URL('./primitives.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.LxButton\.ui-active,\s*\.LxButton\.ui-hover,\s*\.LxButton\.ui-pressed\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/s
    );
    expect(styles).toMatch(
      /\.LxButton--ghost\.ui-hover\s*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s
    );
    expect(styles).toMatch(
      /\.LxButton--ghost \.LxButton__text,\s*\.LxButton--chrome \.LxButton__text\s*\{[^}]*color:\s*var\(--color-text-foreground-secondary\);/s
    );
    expect(styles).toMatch(
      /\.LxButton--ghost\.ui-hover \.LxButton__text,[^{]*\.LxButton--chrome\.ui-pressed \.LxButton__text,[^{]*\.LxButton--link \.LxButton__text\s*\{[^}]*color:\s*var\(--foreground\);/s
    );
    expect(styles).toMatch(
      /\.LxButton--ghost\.ui-active,\s*\.LxButton--ghost\.ui-pressed\s*\{[^}]*background-color:\s*var\(--color-background-button-secondary\);/s
    );
    expect(styles).toMatch(
      /\.LxButton--destructive\s*\{[^}]*border-top-color:\s*var\(--destructive\);[^}]*border-right-color:\s*var\(--destructive\);[^}]*border-bottom-color:\s*var\(--destructive\);[^}]*border-left-color:\s*var\(--destructive\);[^}]*background-color:\s*var\(--destructive\);/s
    );
    expect(styles).toMatch(
      /\.LxButton--destructive \.LxButton__text\s*\{[^}]*color:\s*#ffffff;/s
    );
    expect(styles).toMatch(
      /\.LxButton--chrome\.ui-active,[^{]*\{[^}]*background-color:\s*var\(--color-background-elevated-secondary\);/s
    );
    expect(styles).not.toMatch(
      /\.LxButton\.ui-(?:active|hover|pressed)[^{]*\{[^}]*(?:opacity:\s*0\.|scale\(0\.)/s
    );
  });

  it('exposes visible-text actions as Native buttons by default', () => {
    render(<Button>Save</Button>);

    const button = elementTree.root?.querySelector('.LxButton');
    expect(button?.getAttribute('accessibility-element')).toBe('true');
    expect(button?.getAttribute('accessibility-trait')).toBe('button');
    expect(button?.textContent).toBe('Save');
    expect(
      button?.querySelector('.LxButton__text')?.getAttribute(
        'accessibility-element'
      )
    ).toBe('false');
  });

  it('honors explicit passive accessibility ownership', () => {
    render(
      <Button buttonProps={{ 'accessibility-element': false }}>
        Visual only
      </Button>
    );

    const button = elementTree.root?.querySelector('.LxButton');
    expect(button?.getAttribute('accessibility-element')).toBe('false');
    expect(button?.getAttribute('accessibility-trait')).toBeNull();
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
