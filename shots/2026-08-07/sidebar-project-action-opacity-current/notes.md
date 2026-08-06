# Sidebar Projects action opacity current-head fidelity

Status: retained Lynx-for-Web and exact-owned Native pressed evidence plus Web
sidebar-icon-button source authority

- Source base: `b56362cd`.
- Web sidebar icon buttons keep whole-control opacity 1 during hover and press.
- Lynx Sort reused generic `LxMenuTrigger` feedback, which lowered hover opacity
  to 0.9 and pressed opacity to 0.72.
- A Projects-action scoped override now keeps Sort opacity 1 for hover and
  pressed states while preserving its surface/icon feedback.
- Fresh Lynx-for-Web pointer evidence resolves hover and `ui-pressed` opacity
  to 1. The pressed action keeps the existing sidebar-accent surface.
- Retained Browser frame is `1280x820`; page-error log is empty.
- Focused section-header suite: 1 file, 4/4 tests. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only existing warnings.
- Exact-owned Native bundle
  `7cf49c8d8b94f12eb10de58a66e6b85717b4003c9da8ce177a479c158c25b0ed`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8901/session 1`.
- During supported Native pointer press, Sort publishes `ui-pressed` and
  computes opacity 1 with the active surface. Warning/error console is empty.
- Cleanup: the pointer was released, the exact-owned root and child exited, and
  unrelated Lynxtron instances were not touched.
