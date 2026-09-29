import "background-only";

import type { DesktopAppSnapState } from "@synara/contracts";

import { bridgeCall, onGlobalEvent } from "./bridge";
import type { PickedFile } from "./dialogs";

export interface LynxAppSnapCapture {
  readonly captureId: string;
  readonly capturedAt: string;
  readonly sourceAppName: string | null;
  readonly sourceBundleIdentifier: string | null;
  readonly sourceWindowTitle: string | null;
  readonly file: PickedFile;
}

export interface LynxAppSnapError {
  readonly capturedAt: string;
  readonly code: string;
  readonly message: string;
}

export const appSnap = {
  getState: () => bridgeCall<DesktopAppSnapState>("appSnapGetState"),
  setEnabled: (enabled: boolean) =>
    bridgeCall<DesktopAppSnapState>("appSnapSetEnabled", { enabled }),
  requestPermissions: () => bridgeCall<DesktopAppSnapState>("appSnapRequestPermissions"),
  setPlayCaptureSound: (enabled: boolean) =>
    bridgeCall<DesktopAppSnapState>("appSnapSetPlaySound", { enabled }),
  previewCaptureSound: () =>
    bridgeCall<{ readonly played?: boolean }>("appSnapPreviewSound").then(
      (result) => result.played === true,
    ),
  listPendingCaptures: () =>
    bridgeCall<{ readonly captures: readonly LynxAppSnapCapture[] }>(
      "appSnapListPendingCaptures",
    ).then((result) => result.captures),
  acknowledgeCapture: (captureId: string) => bridgeCall("appSnapAcknowledgeCapture", { captureId }),
  onCaptured: (listener: (capture: LynxAppSnapCapture) => void) =>
    onGlobalEvent("synara:appsnap-captured", listener),
  onError: (listener: (error: LynxAppSnapError) => void) =>
    onGlobalEvent("synara:appsnap-error", listener),
  onState: (listener: (state: DesktopAppSnapState) => void) =>
    onGlobalEvent("synara:appsnap-state", listener),
};
