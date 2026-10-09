import type { WsTransportState } from "@synara-web/wsTransportEvents";

/** What the transport notice shows; `idle` and `connected` show nothing. */
export type TransportNoticeState = "idle" | "connected" | "reconnecting" | "offline";

/**
 * The shared transport's state (`adapters/wsTransport.lynx.ts` maps the host
 * relay onto upstream's `WsTransportState`) as the notice reads it. The first
 * connection attempt is not a reconnect, so `connecting` stays silent until
 * the socket has been open once.
 */
export function noticeStateForWsTransportState(
  state: WsTransportState,
  everOpen: boolean,
): TransportNoticeState {
  switch (state) {
    case "open":
      return "connected";
    case "connecting":
      return everOpen ? "reconnecting" : "idle";
    case "closed":
      return "offline";
    case "incompatible":
    case "disposed":
      return "idle";
  }
}

export function shouldRefetchAfterTransportRecovery(
  previous: TransportNoticeState,
  current: TransportNoticeState,
): boolean {
  return current === "connected" && (previous === "offline" || previous === "reconnecting");
}
