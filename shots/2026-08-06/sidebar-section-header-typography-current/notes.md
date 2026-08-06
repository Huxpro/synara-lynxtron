# Sidebar section-header typography current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `e1b57158`.
- Current Web Projects section label uses the shared sidebar section identity:
  `12px/18px/400` at muted-foreground/58.
- Before this slice, Lynx Projects rendered at `10px`, implicit line-height,
  weight `600`, and full muted foreground.
- `.SharedSidebarListSectionHeaderText` now uses the shared `12px/18px/400`
  identity and applies `opacity: 0.58` over the theme-safe muted foreground.
- Current Web and Lynx-for-Web direct text boxes are both
  `46.28125x18` with exact `12px/18px/400` typography. Web resolves its
  combined dark-theme tone to alpha `0.336627`; Lynx keeps the theme muted
  color at alpha `0.596` plus element opacity `0.58`, yielding the same
  hierarchy.
- No populated Pinned section exists in the current shared snapshot, so this
  slice does not fabricate a second visual consumer. The shared adapter owner
  and focused source contract cover all section-header consumers.
- Web and Lynx-for-Web frames are `1280x820`; browser error logs are empty.
- Focused suites: 2 files, 6/6 tests. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only existing encoder and
  optional `ws` warnings.
- Exact-owned Native bundle
  `968dc10da81464a8e529f327a17c6d27cc4df98dc2d4b2936c1b2101dd9e2f80`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8904/session 1`.
- Native directly measures the Projects TEXT at `12px/18px/400`, opacity
  `0.58`, and an 18px-high box. The raw frame is `2560x1576` and warning/error
  console is empty.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
