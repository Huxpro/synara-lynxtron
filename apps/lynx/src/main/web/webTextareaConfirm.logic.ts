// Lynx-for-Web host: Enter in a `confirm-type="send"` textarea confirms.
//
// @lynx-js/web-core 0.26.2 listens for `keydown`/`keyup` on `document`. An
// event that starts inside the <lynx-view> shadow tree is retargeted there to
// the <lynx-view> host, so web-core's bubble path is empty and no element-level
// `bindkeydown`/`catchkeydown` handler runs (only `global-bindkeydown` does).
// The composer sends from such a handler, so on this host Enter only inserted a
// line break. The handler could not stop that line break anyway: the event
// reaches it on the background thread, after the browser's default action.
//
// The host therefore decides the key synchronously and raises the element's own
// `confirm` event, the one <x-textarea> raises for its `confirm-enter`
// attribute, which the composer already handles through `bindconfirm`.
// `confirm-enter` itself is not used: it fires on keyup, after the line break,
// and for Shift+Enter and IME commits as well.
//
// Remove when web-core delivers element keydown handlers for events from the
// shadow tree and gives them a synchronous way to cancel the default action.

export const WEB_TEXTAREA_CONFIRM_EVENT = "confirm";
export const WEB_TEXTAREA_CONFIRM_TYPE = "send";

export interface WebTextareaKey {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly isComposing: boolean;
}

/**
 * Enter confirms; Shift+Enter keeps its line break; an Enter that commits an
 * IME composition belongs to the composition. The same rule as the composer's
 * key handler on the desktop host.
 */
export function isWebTextareaConfirmKey(
  event: WebTextareaKey,
  confirmType: string | null,
): boolean {
  return (
    confirmType === WEB_TEXTAREA_CONFIRM_TYPE &&
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  );
}

/** Same init as web-elements' own component events: handled where dispatched. */
export function webTextareaConfirmEventInit(value: string): CustomEventInit<{ value: string }> {
  return { bubbles: false, composed: false, cancelable: true, detail: { value } };
}
