# P9-D1 — Native host input probe

## Identity

- Exact repo bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`
- Probe bundle SHA-256:
  `05138a65af9bcdc1ff3309999aa0520fd6112f2ef9da01b9cc378289b9857629`
- Runtime: Lynxtron 0.0.7
- Isolated state: `/private/tmp/synara-p9-d1-native-state`
- Explicit report path:
  `shots/2026-08-03/p9-d1/native-probe/report.json`
- Initial outer bounds: `1280×820`; baseline DevTool content:
  `2560×1576` physical (`1280×788` logical at DPR 2)
- DevTool client: dynamically resolved from owned PID to
  `localhost:8903`, session 1
- Existing `localhost:8901` Lynxtron Fiddle and `localhost:8902` iOS Lynx Go
  were not touched.

## Retained sequence

1. `report-pointer.json`
   - visible unoccluded edge of exact-owned window
   - Native mouseenter/mousedown/mouseup/tap and host focus arrived
2. `report-view-keys.json`
   - real Tab, Shift+Tab, Enter, Space, ArrowDown, ArrowUp, Escape
   - no view focus/blur or key event arrived
3. `report-text-input.json`
   - textarea focus arrived
   - real ASCII typing produced 13 ordinary/committed input calls
4. `report-text-keys.json`
   - real ArrowUp/ArrowDown/Escape/Enter in textarea
   - no textarea key handler arrived
5. `report-scroll.json`
   - real CoreGraphics wheel input over the owned scroll-view
   - three `bindscroll` events, final `scrollTop=242`
6. `report-window-focus.json`
   - host blur/focus both arrived
   - Native mouseleave/mouseenter both arrived

Final retained matrix: **25/25 bindings, 11/25 delivered categories**.

## Harness failures kept separate

- The first click used a point covered by the user's Claude window. Report
  remained 0/25, so it was classified as occlusion rather than a product
  failure.
- Computer Use health check passed, but visual `act` was unavailable because
  `MIDSCENE_MODEL_NAME` was not configured. No product input occurred in that
  failed command.
- PID-targeted pointer events were ignored by Lynxtron. They were not counted.
- The isolated window was restarted at an alternate persisted bound to expose
  a safe strip without moving user windows.
- Real macOS IME remains blocked. A background textarea could receive Lynx
  focus, but it was not the frontmost Text Input Manager client. PID-targeted
  keycodes bypassed the real IME path and produced no input event. These
  attempts are not treated as an IME negative.

## Safety and cleanup

- No `open -a`, Raise, AppleScript show/focus, or user-process termination.
- No user window was moved or minimized.
- Input source was restored to `com.apple.keylayout.US`.
- Owned Lynxtron processes were stopped and `localhost:8903` released.
- Exact DevTool error/warning console is empty.
