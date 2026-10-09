import { getLocationProtocol } from "~/platform/env";
export const APP_BASE_NAME = "Synara";
const isCanaryDesktop = getLocationProtocol() === "synara-canary:";
const isBetaDesktop = getLocationProtocol() === "synara-beta:";
export const APP_DISPLAY_NAME = isCanaryDesktop
  ? "Synara Canary"
  : isBetaDesktop
    ? "Synara Beta"
    : import.meta.env.DEV
      ? `${APP_BASE_NAME} (Dev)`
      : APP_BASE_NAME;
export const APP_VERSION = import.meta.env.APP_VERSION || "0.0.0";
