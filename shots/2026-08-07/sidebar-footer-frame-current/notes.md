# Sidebar footer frame current-head fidelity

Status: retained Lynx-for-Web and exact-owned Native evidence plus current Web
source/runtime geometry authority

- Source base: `1a08255f`.
- Current Web footer uses uniform 8px padding, no top divider, and no extra
  menu-item bottom margin. Settings is 28px high at x=8 with an 8px viewport
  bottom inset.
- Before this slice, Lynx footer used `8px 10px 12px` padding, painted an extra
  top divider, and inherited a 2px primary-item bottom margin. Settings rendered
  at x=10, width 235, and bottom inset 14px.
- Lynx footer now uses uniform 8px padding, no divider, and a footer-scoped
  zero item margin.
- Current Lynx-for-Web resolves the footer frame to 44px high with Settings at
  x=8, y=784, height 28, and bottom inset 8px. The row width is 239px versus
  Web's 240px solely because the Lynx sidebar retains its registered one-pixel
  separator boundary.
- Lynx-for-Web frame is `1280x820` and page-error log is empty. Fresh Web
  sessions had a real provider socket error and were rejected; Web values come
  from the same current-head owner inventory and the canonical `p-2` footer
  source rather than an invalid retained frame.
- Focused primary-navigation suite: 1 file, 3/3 tests. Configured Lynx-for-Web
  and Native/Desktop production builds pass with only existing warnings.
- Exact-owned Native bundle
  `f861bbe036ee66d430b524a41f95bd1380a2010fb33e289e5b0ad47b37521fec`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8901/session 1`.
- Native computes footer padding 8px, top border 0, item margin 0, and a 28px
  Settings row. The content frame retains the same one-pixel sidebar boundary;
  raw frame is `2560x1576` and warning/error console is empty.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
