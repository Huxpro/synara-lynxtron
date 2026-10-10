import { useEffect, useState } from "@lynx-js/react";

import { bridgeCall } from "../platform/bridge";
import { resolveRuntimeSocketUrl } from "../platform/runtimeEndpoint.logic";
import { configuredRuntimeSocketUrl } from "../platform/runtimeEndpointSource";

const IS_WEB_RELAY_MODE = process.env.SYNARA_LYNX_WEB_RELAY === "1";
let hostReportedSocketUrl: string | null = null;

/**
 * The backend's socket URL, for building its HTTP routes (attachments).
 *
 * Native has it synchronously from the host's init data. On Lynx for Web the
 * build-time value is only a default, so nothing is returned until the host
 * reports the relay it is connected to (the Explorer preview's source too).
 */
export function useRuntimeSocketUrl(): string | null {
  const [socketUrl, setSocketUrl] = useState<string | null>(
    () =>
      hostReportedSocketUrl ??
      (IS_WEB_RELAY_MODE ? null : resolveRuntimeSocketUrl(null, configuredRuntimeSocketUrl())),
  );
  useEffect(() => {
    "background only";
    if (hostReportedSocketUrl) {
      setSocketUrl(hostReportedSocketUrl);
      return;
    }
    let active = true;
    void bridgeCall<{ readonly wsUrl?: unknown }>("runtimeGetSynaraWsUrl")
      .then((runtime) => {
        const wsUrl = typeof runtime?.wsUrl === "string" ? runtime.wsUrl.trim() : "";
        if (!wsUrl) return;
        hostReportedSocketUrl = wsUrl;
        if (active) setSocketUrl(wsUrl);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return socketUrl;
}
