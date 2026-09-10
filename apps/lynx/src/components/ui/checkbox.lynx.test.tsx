import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { CheckboxIndicator } from './checkbox.lynx';

describe('CheckboxIndicator', () => {
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
