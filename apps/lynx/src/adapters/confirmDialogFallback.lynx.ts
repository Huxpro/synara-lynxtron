// Lynx replacement for `~/components/ui/confirmDialogFallback` (a DOM dialog
// built with document.createElement). Shared modules import it on both Lynx
// threads, so the host dialog port is reached lazily from a background-only
// function instead of a module-level `background-only` import.

export async function showConfirmDialogFallback(message: string): Promise<boolean> {
  "background only";
  const { dialogs } = await import(/* webpackMode: "eager" */ "../platform/dialogs");
  return dialogs.confirm(message);
}
