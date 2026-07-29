// FILE: platform/download.ts
// Purpose: L1 platform port — file downloads. Web impl uses the DOM anchor
//   download trick; the Lynx impl routes through dialogs.saveFile + sidecar
//   write (no DOM anchors exist there).
// Layer: L1 platform port (web implementation)
// Exports: downloadBlob

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.trim() || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
