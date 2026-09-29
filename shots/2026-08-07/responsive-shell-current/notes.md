# Responsive shell evidence

- Runtime: isolated real Synara service `ws://127.0.0.1:58090`, production
  staged `apps/lynx/dist/desktop/main.lynx.bundle`, background `showInactive`
  launches, and PID-derived DevTool clients. No fixture data or SQLite writes.
- The host probe is enabled only by `SYNARA_VIEWPORT_PROBE_SEQUENCE`. It uses
  `LynxWindow.setContentSize()` after renderer readiness; production behavior
  does not expose an arbitrary resize command to the UI.
- The 900px run started from persisted 1280px geometry, then resized live to
  900x650. Root attributes changed to
  `SliceRoot--viewport-medium data-viewport-width=900
data-viewport-height=650`, proving the resize event path.
- At 900x650: Sidebar border is x0..256, its own vertical scroll viewport is
  560px high, main content is x256..900 (644px), and the Composer is centered
  at x268..888 (620px). No whole-window horizontal overflow is present.
- At 1024x700: root becomes `wide`, Sidebar remains 256px, main becomes 768px,
  and Composer reaches its 736px cap.
- At 1440x900: Sidebar remains 256px, its scroll owner grows to 810px, main
  becomes 1184px, and Composer remains capped at 736px.
- Native screenshots: 900 cell is 1800x1300; 1440 cell is 2880x1800 (DPR 2).
  Warning/error console output was empty for all retained cells.
- `@media` is not treated as Native evidence: the pre-existing Settings media
  rule was absent from the encoded bundle. Responsive Native CSS consumes the
  root viewport classes produced by the user-space API.
