# Sidebar primary-action icon current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `5a9f3c19`.
- Current Web New thread and Search icons are 15x15 at 89% foreground tone;
  Settings is a 15x15 central icon at 95% tone. All use an 8.5px left inset in
  a 16px leading shell.
- Lynx New thread/Search geometry was already exact but used full foreground.
  Settings used a 16x19 text `⚙` at muted 60% tone.
- The shared leading shell now owns opacity 0.89; the footer scope owns 0.95.
  Settings renders generated `SettingsIcon` at 15px instead of text.
- Current Web and Lynx-for-Web geometry/insets are exact for all three icons.
  Both PNGs are `1280x820`; browser error logs are empty.
- Focused landing fidelity suite: 1 file, 2/2 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `927d8c91794f4182973c4e66268b5a9009c59898dc279165c25a9ff8761e40e7`
  retained the footer leading shell at 16x16/opacity 0.95 and generated
  Settings SVG at 15x15 with theme-foreground raw content. Raw frame is
  `2560x1576` and warning/error console empty.
- New thread/Search numeric Native closure is intentionally not claimed from
  the ambiguous repeated leading class; current browser measurements plus the
  shared owner/source contract cover those roles.
