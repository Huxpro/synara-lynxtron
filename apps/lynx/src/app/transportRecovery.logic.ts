import type { RpcTransportState } from "../data/rpcTransport.logic";

export function shouldRefetchAfterTransportRecovery(
  previous: RpcTransportState,
  current: RpcTransportState,
): boolean {
  return current === "connected" && (previous === "offline" || previous === "reconnecting");
}
