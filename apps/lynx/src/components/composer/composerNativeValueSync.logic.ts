/**
 * Decides whether a draft projection change must be pushed into the native
 * editor (`setValue` + `setSelectionRange`).
 *
 * The editor is uncontrolled: keystrokes land in the host textarea first and
 * reach the background thread later through `bindinput`. Echoing those edits
 * back is never needed and is actively harmful: when keystrokes arrive faster
 * than the background round trip, the echo carries an older value and
 * overwrites characters the host has already applied.
 */
export function shouldPushDraftProjectionToNativeEditor(input: {
  /** Display text of the projection the effect was rendered with. */
  readonly renderedDisplayText: string;
  /** Display text derived from the draft store at effect time. */
  readonly latestDisplayText: string;
  /**
   * Display text the native editor is known to hold, either because we pushed
   * it or because the editor reported it via `bindinput`. `null` forces a push
   * (e.g. after switching drafts while the editor still shows the old one).
   */
  readonly appliedDisplayText: string | null;
  /** Latest native editor value reported by `bindinput` or pushed by us. */
  readonly nativeEditorValue: string;
}): boolean {
  // The render lags behind the store: newer native input already moved the
  // draft on, and a follow-up render will carry the current projection.
  if (input.renderedDisplayText !== input.latestDisplayText) return false;
  return (
    input.appliedDisplayText !== input.latestDisplayText ||
    input.nativeEditorValue !== input.latestDisplayText
  );
}
