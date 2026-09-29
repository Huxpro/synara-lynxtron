import { useEffect, useState } from "@lynx-js/react";

import type { RpcTransportState } from "./rpcTransport.logic";
import { sleepOnHost } from "../platform/timer";

async function readTransportState(): Promise<RpcTransportState> {
  "background only";
  const { getSynaraTransportState } = await import(/* webpackMode: "eager" */ "./synaraClient");
  return getSynaraTransportState();
}

export function useSynaraTransportState(): RpcTransportState {
  const [state, setState] = useState<RpcTransportState>("idle");

  useEffect(() => {
    "background only";
    let cancelled = false;

    async function observe(): Promise<void> {
      "background only";
      while (!cancelled) {
        try {
          const next = await readTransportState();
          if (!cancelled) {
            setState((current) => (current === next ? current : next));
          }
        } catch {
          // Query failures carry the typed transport error. This observer is a
          // presentation aid and must never become a second failure source.
        }
        if (!cancelled) await sleepOnHost(100);
      }
    }

    void observe();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
