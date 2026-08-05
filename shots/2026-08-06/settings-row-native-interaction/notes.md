# Settings navigation Native interaction proof

## Identity

- Source commit: `0fa750e3f9cbce9a9574b22c7d720744c9fda9cc`.
- Online certification bundle SHA-256:
  `98083afbc10c3f6891fabcfa9b59db9d2274619a9d1b8046ea39be42a22bd780`.
- Shared snapshot SHA-256:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Route: `synara://settings/providers`.
- Exact-owned root PID `93295`, child `93332`,
  `localhost:8903/session 1`.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Target: rendered, inactive `Skills` Settings navigation row.

## Base

- Visible box: `x=6, y=490, 243x28`.
- Accessibility label: `Skills`.
- Accessibility traits: button.
- Focusable: true.
- Base background: transparent.
- Base opacity: `0.95`.
- The node publishes mouse/touch, focus/blur, keydown, and tap handlers.

## Press

The row was pressed with exact-client
`Input.emulateTouchFromMouseEvent(mousePressed)` and captured before release.
Release occurred outside the row, so the route did not activate.

- Runtime class: `SharedSettingsNavigationButton ui-pressed`.
- Background: `rgba(13,13,13,0.0392157)`.
- Opacity: `1`.
- The row does not use whole-row dimming for press feedback.
- Warning/error console: empty.

## Focus

The same rendered Skills row received the native `setFocus` command.

- Runtime class: `SharedSettingsNavigationButton ui-focus`.
- Background: transparent.
- Opacity: `0.95`.
- Box shadow: `inset 0 0 0 1px #0169cc`.
- Focus does not shift geometry or activate the route.
- Warning/error console: empty.

DevTool `mouseMoved` did not publish a Lynx `mouseenter` event in this
Desktop runtime. Hover remains CSS/source-covered and is not claimed as a
Native interaction result.

## Cleanup

- Owned Native and server processes exited.
- Default Native bundle was restored byte-exact to
  `eaf1b834841fd25fb135a59895be62f5d406ae867aaaaeedc71175703ca52dcb`
  and contains only `ws://127.0.0.1:58090`.
- KV remained
  `f53a83aac62fff4c8e7b6dac18d34ce8ffe27970a807a428fa0d9b0ba1a42474`.
- Window state remained
  `2dd961d318ba0c6680929b6f58d30c76e82e6aa6f9e3b719955d1e06d69e571b`.
- Server settings and SQLite remained byte-exact.

## Artifacts

- `base/`: base route, DOM, paint, screenshot, identity, and console.
- `pressed/`: retained `ui-pressed` state and semantic fill.
- `focus/`: retained `ui-focus` state and inset focus ring.
