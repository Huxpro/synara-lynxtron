// FILE: platform/clipboard.ts
// Purpose: L1 platform port — clipboard writes. Web impl = navigator.clipboard
//   with the legacy execCommand fallback, plus the desktop bridge for images.
//   The Lynx impl routes through the Lynxtron clipboard via contextBridge.
// Layer: L1 platform port (web implementation)
// Exports: ClipboardPort, clipboard, copyTextToClipboard

export interface ClipboardPort {
  writeText: (value: string) => Promise<void>;
  writeImagePngDataUrl: (dataUrl: string) => Promise<boolean>;
  /** navigator.clipboard.write(ClipboardItem) path; rejects when unsupported. */
  writeImageBlob: (blob: Blob) => Promise<void>;
}

function fallbackCopyTextToClipboard(value: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    return false;
  }

  const activeElement =
    typeof HTMLElement !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const selection = document.getSelection();
  const savedRanges =
    selection == null
      ? []
      : Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index));
  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand("copy");
  } finally {
    textarea.remove();

    if (selection) {
      selection.removeAllRanges();
      for (const range of savedRanges) {
        selection.addRange(range);
      }
    }

    activeElement?.focus();
  }
}

export async function copyTextToClipboard(value: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Clipboard API unavailable.");
  }

  if (!value) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      if (fallbackCopyTextToClipboard(value)) {
        return;
      }
      throw error;
    }
  }

  if (fallbackCopyTextToClipboard(value)) {
    return;
  }

  throw new Error("Clipboard API unavailable.");
}

export const clipboard: ClipboardPort = {
  writeText: copyTextToClipboard,
  writeImagePngDataUrl: (dataUrl) =>
    typeof window !== "undefined"
      ? (window.desktopBridge?.clipboard?.writeImagePngDataUrl(dataUrl) ?? Promise.resolve(false))
      : Promise.resolve(false),
  writeImageBlob: (blob) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.write) {
      return Promise.reject(new Error("Clipboard image write unavailable."));
    }
    return navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
  },
};
