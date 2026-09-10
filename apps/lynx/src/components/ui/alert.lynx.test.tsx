import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { Alert, AlertDescription, AlertTitle } from './alert.lynx';

describe('Alert', () => {
  it('publishes alert semantics and shared anatomy', () => {
    render(<Alert accessibilityLabel="Provider status" variant="warning"><AlertTitle>Status</AlertTitle><AlertDescription><text>Reconnect.</text></AlertDescription></Alert>);
    const alert = elementTree.root?.querySelector('.LxAlert');
    expect(alert?.getAttribute('accessibility-role')).toBe('alert');
    expect(alert?.getAttribute('accessibility-label')).toBe('Provider status');
    expect(elementTree.root?.querySelector('.LxAlertTitle')?.textContent).toBe('Status');
  });
});
