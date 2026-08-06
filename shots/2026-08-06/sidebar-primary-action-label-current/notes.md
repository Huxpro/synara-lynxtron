# Sidebar primary-action label current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `6eb63574`.
- Current Web New thread, Search, and Settings labels all resolve to
  12px/18px/400 at 89% foreground tone. The shared Lynx owner previously used
  12px/18px/500 and full foreground.
- `.SharedSidebarPrimaryActionLabel` now owns weight 400 and opacity 0.89.
  Current Web and Lynx-for-Web text widths are exact for all three labels.
- Existing sidebar row y/width differences remain the previously registered
  shell/separator geometry boundary; this slice does not disguise them as text
  fixes.
- Both browser PNGs are `1280x820`; browser error logs are empty.
- Focused landing fidelity suite: 1 file, 2/2 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `be598d2b8127bd268e17433dbcb13b090e2e0414c07cc48f8ef3ed6cef2745d4`
  retained an interactive Settings row and shared label. Native measured the
  label at 12px/18px/400, opacity 0.89, with an 18px box; the row retained
  complete accessibility/keyboard/touch bindings. Raw frame is `2560x1576`
  and warning/error console empty.
