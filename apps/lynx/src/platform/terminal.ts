import 'background-only';

import type {
  TerminalCloseInput,
  TerminalOpenInput,
  TerminalSessionSnapshot,
  TerminalWriteInput,
} from '@synara/contracts';

import { bridgeCall } from './bridge';

async function withTerminalRuntimeEndpoint<T extends Record<string, unknown>>(
  input: T
): Promise<T & { readonly baseUrl?: string }> {
  const runtime = await bridgeCall<{ readonly wsUrl?: unknown }>(
    'runtimeGetSynaraWsUrl'
  ).catch(() => null);
  const baseUrl =
    typeof runtime?.wsUrl === 'string' ? runtime.wsUrl.trim() : '';
  return baseUrl ? { ...input, baseUrl } : input;
}

export const platformTerminal = {
  open: async (
    input: TerminalOpenInput
  ): Promise<TerminalSessionSnapshot> =>
    bridgeCall('terminalOpen', await withTerminalRuntimeEndpoint(input)),
  write: async (input: TerminalWriteInput): Promise<void> => {
    await bridgeCall(
      'terminalWrite',
      await withTerminalRuntimeEndpoint(input)
    );
  },
  close: async (input: TerminalCloseInput): Promise<void> => {
    await bridgeCall(
      'terminalClose',
      await withTerminalRuntimeEndpoint(input)
    );
  },
};
