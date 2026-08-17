# Draft issue 0002 — target: lynx-family/lynx

**Suggested title:** [Desktop] Keyboard events are not delivered to Lynx views: no view-level `keydown`, `<textarea>` swallows Arrow/Enter/Escape, Tab never focuses views

**Labels:** bug, platform/desktop, keyboard, a11y

---

## Environment

- Lynx SDK 4.1 (`@lynx-js/type-config` 4.1.1), ReactLynx (`@lynx-js/react-rsbuild-plugin` 0.18.1)
- Lynxtron desktop shell 0.0.7–0.0.9, macOS arm64

## Summary

We ran a systematic 25-event input probe (each event registered with a visible on-screen diagnostic, verified bindings present in the rendered tree) against both the Lynx-for-Web and the native desktop surface. Result: **25/25 bindings registered, but only 13/25 events delivered on native (9/25 on web)**. Everything pointer/scroll/IME-shaped works; everything key-shaped does not:

**Delivered (positive):** pointer enter/leave/down/up/tap; `<textarea>` focus/blur; ordinary and IME text input (real Pinyin IME emits `isComposing=true` updates and a Space-committed event); scroll wheel (`scrollTop` advances); host window focus/blur.

**Not delivered (negative):**

1. **View-level key events.** Enter/Space/ArrowUp/ArrowDown/Escape/Tab on focused/focusable views never reach JS. `bindkeydown` is present in the rendered tree, unit handlers pass, yet nothing fires. Tried `catchkeydown`, browser key names, PC key aliases (`Down`/`Up`/`Return`/`Esc`), and `global-bindkeydown` — all negative on both surfaces.
2. **`<textarea>` navigation keys.** The native textarea consumes ArrowUp/ArrowDown/Enter/Escape internally; JS never observes them (no local or global keydown). This makes combobox/command-menu/mention-menu patterns (filter in a textarea, navigate suggestions with arrows, confirm with Enter) impossible to implement.
3. **Tab never publishes focus to focusable views.** With a real window and no modal: real Tab presses ×4 produce no view focus (our `.ui-focus` instrumentation stays 0 and the macOS AX tree shows no change), while a real pointer click does move AX focus into the Lynx container — so host pointer focus works, host key focus traversal does not.
4. **`setFocus` contract.** `Element.invoke("setFocus")` resolves fulfilled without the OS actually granting focus, and the native blur at the end of a tap always overrides a programmatic `setFocus` issued synchronously, at 0ms, or at 50ms. A fulfilled promise that does not reflect the real outcome makes the race unfixable from the app side.

## Steps to reproduce (condensed)

1. Render a focusable `<view focusable bindkeydown=... bindtap=...>` and a `<textarea bindkeydown=...>`.
2. Click the view (tap delivers), then press Enter/Space/Arrow keys — no events.
3. Focus the textarea, type text (input events deliver), then press ArrowDown/Enter/Escape — no events.
4. Press Tab repeatedly — focus never lands on any focusable view.

## Expected

- Key events delivered to focused views (or a documented desktop-specific API for key handling);
- An opt-out (e.g. `catch`-style) for textarea-internal handling of navigation keys, so apps can implement menu/combobox interactions;
- Tab focus traversal across `focusable` views on desktop;
- `setFocus` resolving with the real outcome (or rejecting when focus was not granted).

## Impact

A desktop app cannot offer keyboard navigation at all: menus, command palettes, list selection, dialog Escape-dismiss all require pointer interaction. This compounds with screen-reader gaps into a keyboard-accessibility dead end. Application-menu accelerators are the only workaround we found, and they cannot express per-widget interactions.
