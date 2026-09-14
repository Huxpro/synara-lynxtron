import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';
import { render } from '@lynx-js/react/testing-library';

import { CheckboxIndicator } from './checkbox.lynx';

describe('CheckboxIndicator', () => {
  it('uses the Electron light-border token for its unselected outline', () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxCheckboxIndicator\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-color:\s*var\(--color-border-light\);/s
    );
    expect(styles).toMatch(
      /\.LxCheckboxIndicator--selected\s*\{[^}]*border-color:\s*var\(--primary\);/s
    );
  });

  it('renders the shared selected visual', () => {
    render(<CheckboxIndicator checked />);
    expect(elementTree.root?.querySelector('.LxCheckboxIndicator--selected')).not.toBeNull();
    expect(elementTree.root?.querySelector('.LxCheckboxIndicatorIcon')).not.toBeNull();
  });

  it('renders the compact mixed visual without pretending to own interaction', () => {
    render(<CheckboxIndicator mixed size="sm" />);
    expect(elementTree.root?.querySelector('.LxCheckboxIndicator--sm')).not.toBeNull();
    expect(elementTree.root?.querySelector('.LxCheckboxIndicator--mixed')).not.toBeNull();
    expect(elementTree.root?.querySelector('.LxCheckboxIndicatorMixedBar')).not.toBeNull();
    expect(elementTree.root?.querySelector('.LxCheckboxIndicator')?.getAttribute('accessibility-role')).toBeNull();
  });
});
