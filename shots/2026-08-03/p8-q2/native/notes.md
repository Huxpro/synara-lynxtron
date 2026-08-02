# P8-Q2 — Native certification batch

- Screens: Threads, Thread, Settings, Projects overview, Project Kanban,
  Pull Requests
- Themes: light / dark
- Outer window sizes: `1280×820` / `1440×900`
- Frames: 24 Native LynxView PNGs
- Shared snapshot SHA-256:
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`
- Certification bundle SHA-256:
  `119b43ad13d836ac3d00887cbaacec26ab4ef9a780353040f069b7d64f3c7b32`
- Exact DevTool client: `localhost:8903`, resolved from the owned Lynxtron PID
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`

## Process Ownership

Two background-inactive launches were used:

- PID `16313`: outer `1280×820`
- PID `42620`: outer `1440×900`

Both used:

- `NODE_ENV=production`
- `SYNARA_ENABLE_DEVTOOL=1`
- `SYNARA_BACKGROUND_LAUNCH=1`
- `SYNARA_ALLOW_PARALLEL_INSTANCE=1`
- isolated `SYNARA_LYNX_USER_DATA_DIR`
- `SYNARA_WS_URL=ws://127.0.0.1:62190`

The app was never raised or activated. Other DevTool clients (`8901`, `8902`)
were left untouched.

## Window Evidence

Persisted state was written only while the owned process was stopped:

- `1280×820` state SHA-256:
  `d9c6f3fd0c08c7affbd2db5c209ecebc8c4110d6656ce32033264fadf98911dd`
- `1440×900` state SHA-256:
  `bdee1a50d96bb7f52a4a7a109ce6f2498a015e08536e5c41e1bbeabcb7514087`

CoreGraphics reported exact outer bounds for both launches. DevTool LynxView
captures were:

- `2560×1576` at `1280×820`
- `2880×1736` at `1440×900`

The 32 logical-pixel titlebar difference and DPR 2 mapping are exact.

## Interaction Evidence

Every route and theme transition used rendered Native controls:

- DevTool DOM search located exact accessibility labels.
- `DOM.getBoxModel` provided the real hit box.
- `Input.emulateTouchFromMouseEvent` delivered press/release events.
- Each retained frame has a route-specific DOM assertion.

The project overview card has a text child without an accessibility hit box, so
its visible main-content card center was tapped from the measured box position.
No hidden route state or app command was injected.

## Gates

- 24/24 Native frames have the expected physical dimensions.
- 24/24 route assertions passed.
- 24/24 error/warning console files are empty.
- Both themes were verified through the `SliceRoot--theme-*` class.
- The certification bundle loaded from `apps/lynx/dist/desktop`.
- The shared SQLite snapshot hash remained unchanged.
- The default user window-state file remained byte-identical.
- Owned `62190` and `8903` listeners were stopped.
- The final product desktop bundle was rebuilt and contains only
  `ws://127.0.0.1:58090`.

This Native batch certifies platform rendering and rendered-control navigation.
It does not resolve P9-D1's separate real macOS IME composition blocker.
