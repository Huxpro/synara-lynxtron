import { fireEvent, render } from '@lynx-js/react/testing-library';
import { describe, expect, it, rs } from '@rstest/core';

import { ThreadErrorBanner } from './ThreadErrorBanner.lynx';

describe('Lynx ThreadErrorBanner', () => {
  it('renders the complete runtime error and dismisses it', () => {
    const onDismiss = rs.fn();
    render(
      <ThreadErrorBanner
        error="You've hit your usage limit. Try again later."
        onDismiss={onDismiss}
      />
    );

    expect(
      elementTree.root?.querySelector('.ThreadErrorBannerText')?.textContent
    ).toBe("You've hit your usage limit. Try again later.");
    const dismiss = elementTree.root?.querySelector(
      '[accessibility-label="Dismiss error"]'
    );
    if (!dismiss) throw new Error('expected dismiss control');
    fireEvent.tap(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders nothing without an error', () => {
    render(<ThreadErrorBanner error={null} />);
    expect(elementTree.root?.querySelector('.ThreadErrorBanner')).toBeNull();
  });
});
