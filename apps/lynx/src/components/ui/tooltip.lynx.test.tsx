import { act, fireEvent, render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { Tooltip, TooltipPopup, TooltipTrigger } from './tooltip.lynx';

describe('Tooltip', () => {
  it('declares the popup border color on every physical side', () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxTooltipPopup\s*\{[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s
    );
  });

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
