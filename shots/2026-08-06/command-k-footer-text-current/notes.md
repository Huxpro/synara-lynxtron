# Command K footer text current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `d4f9b1b7`.
- Web's Command footer inherits 12px/16px text from its `text-xs` owner.
  Lynx set only 12px and therefore used an implicit engine line box.
- `.LxCommandFooter > text` now explicitly owns 12px/16px, and the focused
  Command contract locks it.
- Focused Command suite: 1 file, 9/9 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Shared server `59490`, trusted origin `localhost:10191`, same snapshot,
  Light/Comfortable, `1280x820`; served and built hashes match.
- Both clients opened Command K through rendered Search controls.
- Current Web and Lynx-for-Web left/right footer texts have identical widths,
  16px heights, and 12px/16px typography.
- Exact-owned Native bundle
  `4dbeaf8115937a3e393fb8ceff164da745c10fae116cff2bf508e97ae08a8e79`,
  root PID `34264`, PID-derived `localhost:8904/session 1`. A real Search touch
  retained the footer role, a `2560x1576` frame, and an empty warning/error
  console.
