import { useEffect, useState } from "@lynx-js/react";
import { addWsTransportStateListener } from "@synara-web/wsTransportEvents";

import {
  noticeStateForWsTransportState,
  type TransportNoticeState,
} from "../app/transportRecovery.logic";

/**
 * Connection state for the transport notice and the recovery refetch. One
 * source: the state the shared transport publishes through upstream's
 * `wsTransportEvents` (the same events session sync and the composer notice
 * read), not a second observer of the host relay.
 */
export function useSynaraTransportState(): TransportNoticeState {
  const [state, setState] = useState<TransportNoticeState>("idle");

  useEffect(() => {
    "background only";
    let everOpen = false;
    return addWsTransportStateListener(
      (next) => {
        if (next === "open") everOpen = true;
        const projected = noticeStateForWsTransportState(next, everOpen);
        setState((current) => (current === projected ? current : projected));
      },
      { replayCurrent: true },
    );
  }, []);

  return state;
}
