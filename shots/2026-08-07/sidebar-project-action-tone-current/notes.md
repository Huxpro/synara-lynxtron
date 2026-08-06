# Sidebar Projects action icon tone current-head fidelity

Status: retained Lynx-for-Web and exact-owned Native state evidence plus Web
currentColor source/runtime authority

- Source base: `521f8332`.
- Web sidebar icon buttons derive central-icon paint from `currentColor`:
  muted by default and foreground on hover/focus.
- Lynx raw SVGs previously embedded muted foreground directly, so changing the
  parent action color did not update Sort/Add icon strokes.
- The Lynx action icon now renders theme-safe muted and foreground SVG layers.
  Default shows the muted layer; hover, focus, and pressed states atomically
  swap to the foreground layer.
- Fresh Lynx-for-Web evidence proves both actions default to muted opacity
  1 / foreground opacity 0. Real Sort hover and Add keyboard focus resolve to
  muted opacity 0 / foreground opacity 1. Raw SVG content records the expected
  light-theme muted and foreground stroke values.
- Retained hover/focus frames are `1280x820`; both Browser page-error logs are
  empty.
- Focused section-header action suite: 1 file, 4/4 tests. Configured
  Lynx-for-Web and Native/Desktop production builds pass with only existing
  warnings.
- Exact-owned Native bundle
  `3de82b29dcad816a228efbda31951f9ae914254d83b0d76cacfb565dcaf380cb`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8901/session 1`.
- During a supported Native pointer press on Sort, the action publishes
  `ui-pressed`, muted icon opacity resolves to 0, and foreground icon opacity
  resolves to 1. Warning/error console is empty.
- Cleanup: the owned pointer was released, the exact-owned root and child
  exited, and unrelated Lynxtron instances were not touched.
