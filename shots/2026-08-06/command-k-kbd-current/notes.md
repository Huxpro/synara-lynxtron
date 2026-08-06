# Command K keyboard-pill current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `9a2a63f8`.
- Web's shared `Kbd` primitive is a 20px/radius-4 pill with
  12px/16px/500 text. Lynx matched the box but retained 11px text with an
  implicit line box.
- `.LxKbd__text` now explicitly owns 12px/16px/500, and the focused Command
  contract locks the identity.
- Focused Command suite: 1 file, 9/9 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Shared server `59390`, trusted origin `localhost:10091`, same snapshot,
  Light/Comfortable, `1280x820`; served and built hashes match.
- Current Web shared Kbd sample: 20x20, radius 4px, 12px/16px/500. The first
  `[data-slot=kbd]` sample is the sidebar shortcut, but it consumes the same
  Web primitive as Command K.
- Current Lynx-for-Web Command K sample: 20x20, radius 4px; text
  12px/16px/500.
- Exact-owned Native bundle
  `1e73100b7d81709d3c1786f29120341748f346483f7c048f5ad477c8aea26348`,
  root PID `14037`, PID-derived `localhost:8905/session 1`. A real Search touch
  retained Kbd/text roles, a `2560x1576` frame, and an empty warning/error
  console.
