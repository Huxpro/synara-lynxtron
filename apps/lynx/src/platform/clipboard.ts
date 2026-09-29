// FILE: platform/clipboard.ts (Lynx impl)
// Purpose: L1 clipboard port for the Lynx target, contract-aligned with
//   synara/apps/web/src/platform/clipboard.ts (ClipboardPort). Text routes to
//   the Lynxtron main-process clipboard over the bridge; image PNG data-url
//   write is bridged too (nativeImage on the main side — wired when needed).
// Layer: L1 platform port (lynx implementation)

import "background-only";

import { bridgeCall } from "./bridge";

export interface ClipboardPort {
  writeText: (value: string) => Promise<void>;
  writeImagePngDataUrl: (dataUrl: string) => Promise<boolean>;
  writeImageBlob: (blob: Blob) => Promise<void>;
}

export interface ProfileShareExportInput {
  readonly svg: string;
}

export const clipboard: ClipboardPort = {
  writeText: async (value) => {
    if (!value) return;
    await bridgeCall("clipboardWriteText", { text: value });
  },
  writeImagePngDataUrl: async (dataUrl) => {
    const res = await bridgeCall<{ ok?: boolean }>("clipboardWriteImagePngDataUrl", { dataUrl });
    return res.ok === true;
  },
  writeImageBlob: async (_blob) => {
    // No Blob→native path yet on this target (needs arrayBuffer + nativeImage
    // marshalling); mirrors the web port's rejection contract.
    return Promise.reject(new Error("Clipboard image write unavailable."));
  },
};

/** Test/backchannel helper (not part of the port contract). */
export async function readClipboardText(): Promise<string> {
  const res = await bridgeCall<{ text: string }>("clipboardReadText");
  return res.text ?? "";
}

export async function exportProfileShareCard(
  input: ProfileShareExportInput,
): Promise<{ readonly ok: boolean }> {
  return bridgeCall("profileShareExport", input);
}
