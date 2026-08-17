# Draft issue 0007 — target: lynx-family/lynx

Filed: https://github.com/lynx-family/lynx/issues/8664

**Suggested title:** [Desktop] `alignMouseEventWithW3C` still reports primary
`MouseEvent.button` as `1`

**Labels:** bug, events, platform/desktop

---

## Environment

- macOS arm64
- Lynxtron `0.0.12-dev`
- DevTool-reported Lynx SDK `4.2`
- production ReactLynx bundle
- `alignMouseEventWithW3C: true`

## Reproduction

Attach a `bindmousedown` listener to a view and press the primary mouse button:

```tsx
<view
  bindmousedown={(event) => {
    console.log(event.button, event.buttons, event.x, event.pageX);
  }}
/>
```

## Actual

Desktop reports:

```text
button = 1
buttons = 1
```

`buttons = 1` is the expected primary-button bit field. `button = 1` is not
the W3C primary-button value and causes W3C-compatible guards such as
`event.button === 0` to reject real primary drags.

## Expected

With `alignMouseEventWithW3C: true`:

```text
button = 0
buttons = 1
```

## Source finding

The Desktop Clay path stores the changed button as a bit-mask delta:

```cpp
if (buttons_state_ != event.buttons) {
  button_state_ = event.buttons ^ buttons_state_;
  buttons_state_ = event.buttons;
}
```

It forwards `button_state_` directly through
`LynxEventDispatcher::OnMouseEvent`. The primary button bit is
`kClayPointerMouseButtonsMousePrimary = 1 << 0`.

Relevant upstream files:

- `clay/ui/component/page_view.cc`
- `clay/ui/component/page_view.h`
- `clay/lynx_adaptor/lynx_event_dispatcher.cc`
- `clay/public/clay.h`

`buttons` should remain a bit field. `button` needs W3C button-number
conversion when alignment is enabled.

## Verified impact and workaround

Synara's Sidebar resize sash hovered correctly but never mounted its drag
overlay because its primary-button guard accepted only `button === 0`.

The compatibility boundary now accepts:

```ts
event.button === 0 || (event.button === 1 && event.buttons === 1);
```

With that workaround, a real macOS mouse drag:

- moved the Sidebar from 256px to 336px;
- persisted `chat_thread_sidebar_width = 336`;
- restored 336px after a cold app restart.

Evidence is retained in:

- `shots/2026-08-18/native-sidebar-resize-connection-audit/notes.md`.
