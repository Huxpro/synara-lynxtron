import 'background-only';

import type {
  TerminalCloseInput,
  TerminalOpenInput,
  TerminalSessionSnapshot,
  TerminalWriteInput,
} from '@synara/contracts';

import { bridgeCall } from './bridge';

export const platformTerminal = {
  open: (input: TerminalOpenInput): Promise<TerminalSessionSnapshot> =>
    bridgeCall('terminalOpen', input),
  write: async (input: TerminalWriteInput): Promise<void> => {
    await bridgeCall('terminalWrite', input);
  },
  close: async (input: TerminalCloseInput): Promise<void> => {
    await bridgeCall('terminalClose', input);
  },
};
