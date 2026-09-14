import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';
import { render } from '@lynx-js/react/testing-library';

import { Alert, AlertDescription, AlertTitle } from './alert.lynx';

describe('Alert', () => {
  it('matches the Electron default and compact type tiers', () => {
    const styles = readFileSync(new URL('./primitives.css', import.meta.url), 'utf8');
    expect(styles).toMatch(
      /\.LxAlertTitle\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.LxAlertDescription\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.LxAlert--sm \.LxAlertTitle, \.LxAlert--sm \.LxAlertDescription\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
  });

  it('publishes alert semantics and shared anatomy', () => {
    render(<Alert accessibilityLabel="Provider status" variant="warning"><AlertTitle>Status</AlertTitle><AlertDescription><text>Reconnect.</text></AlertDescription></Alert>);
    const alert = elementTree.root?.querySelector('.LxAlert');
    expect(alert?.getAttribute('accessibility-role')).toBe('alert');
    expect(alert?.getAttribute('accessibility-label')).toBe('Provider status');
    expect(elementTree.root?.querySelector('.LxAlertTitle')?.textContent).toBe('Status');
  });
});
