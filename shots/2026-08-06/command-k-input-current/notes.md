# Command K input typography current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `33e25116`.
- Web's Command search input explicitly resolves to 12px/18px. Lynx retained
  the 12px size but depended on an implicit engine line height.
- `.LxCommandTextarea` now explicitly owns 12px/18px, and the focused Command
  contract locks it.
- Focused Command suite: 1 file, 9/9 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Shared server `59590`, trusted origin `localhost:10291`, same snapshot,
  Light/Comfortable, `1280x820`; served and built hashes match.
- Real rendered Search clicks opened Command K. Current Web and Lynx-for-Web
  input nodes both compute to 12px/18px. The Lynx custom textarea reports a
  zero inner box in the browser harness, so only computed typography is used.
- Exact-owned Native bundle
  `6657bf09425d5fbd97f92581b7ad5baad1f22dfaf9fbd0e93966f80b931baca2`,
  root PID `52798`, PID-derived `localhost:8904/session 1`. A real Search touch
  retained input/textarea roles, a `2560x1576` frame, and an empty
  warning/error console.
