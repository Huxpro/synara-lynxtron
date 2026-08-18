import { describe, expect, it, rs } from '@rstest/core';

import { copyIntegrationText } from './settingsIntegrationsClipboard.logic';

describe('Settings Integrations clipboard outcomes', () => {
  it('returns the action-specific success message', async () => {
    const writeText = rs.fn(async () => undefined);

    await expect(
      copyIntegrationText({
        value: 'setup prompt',
        successMessage: 'Setup prompt copied.',
        writeText,
      })
    ).resolves.toEqual({
      intent: 'success',
      message: 'Setup prompt copied.',
    });
    expect(writeText).toHaveBeenCalledWith('setup prompt');
  });

  it('turns clipboard rejection into a visible error outcome', async () => {
    await expect(
      copyIntegrationText({
        value: 'configuration',
        successMessage: 'Configuration copied.',
        writeText: async () => {
          throw new Error('Clipboard permission denied');
        },
      })
    ).resolves.toEqual({
      intent: 'error',
      message: 'Could not copy: Clipboard permission denied',
    });
  });

  it('uses a stable fallback for non-Error rejection', async () => {
    await expect(
      copyIntegrationText({
        value: 'example',
        successMessage: 'Example prompt copied.',
        writeText: async () => Promise.reject('denied'),
      })
    ).resolves.toEqual({
      intent: 'error',
      message: 'Could not copy to clipboard.',
    });
  });
});
