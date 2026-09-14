import { act, fireEvent, render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from '@rstest/core';

import { Tooltip, TooltipPopup, TooltipTrigger } from './tooltip.lynx';

describe('Tooltip', () => {
  it('reuses shared disclosure motion while closing', async () => {
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger className="Trigger"><text>Toggle</text></TooltipTrigger>
        <TooltipPopup className="Popup">Details</TooltipPopup>
      </Tooltip>
    );

    expect(elementTree.root?.querySelector('.Popup')?.getAttribute('class')).toContain(
      'LynxDisclosureMotion--open'
    );

    await act(async () => {
      fireEvent.tap(elementTree.root!.querySelector('.Trigger')!);
    });

    const closingPopup = elementTree.root?.querySelector('.Popup');
    expect(closingPopup?.getAttribute('class')).toContain('LynxDisclosureMotion--closed');
    expect(closingPopup?.getAttribute('aria-hidden')).toBe('true');
  });
});
