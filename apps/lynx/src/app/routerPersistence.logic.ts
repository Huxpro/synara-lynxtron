import type { LastThreadRoute } from '@synara-web/chatRouteRestore';

export async function readPersistedLastThreadRouteFallback(
  read: () => Promise<LastThreadRoute | null>
): Promise<LastThreadRoute | null> {
  return read().catch(() => null);
}
