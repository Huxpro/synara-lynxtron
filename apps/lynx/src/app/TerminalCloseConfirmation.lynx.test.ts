import { describe, expect, it, rs } from '@rstest/core';

import { confirmTerminalTabClose } from '@synara-web/lib/terminalCloseConfirmation';

describe('Lynx terminal close confirmation', () => {
  it('preserves the shared confirmation copy and cancellation result', async () => {
    const confirm = rs.fn(async () => false);

    await expect(
      confirmTerminalTabClose({
        dialogs: { confirm } as never,
        enabled: true,
        terminalTitle: 'Terminal',
      })
    ).resolves.toBe(false);
    expect(confirm).toHaveBeenCalledWith(
      'Close terminal "Terminal"?\nThis permanently clears the terminal history for this tab.'
    );
  });

  it('does not invoke host dialogs when confirmation is disabled', async () => {
    const confirm = rs.fn(async () => false);

    await expect(
      confirmTerminalTabClose({
        dialogs: { confirm } as never,
        enabled: false,
        terminalTitle: 'Terminal',
      })
    ).resolves.toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
});
