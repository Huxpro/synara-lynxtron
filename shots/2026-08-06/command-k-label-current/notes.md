# Command K group label current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `d4bc7d8d`.
- The old Lynx group label used 12px/500 with an implicit 15px visual line
  box. A source-only reading initially suggested 18px, but current rendered
  Web measurement showed the real authority is 12px/16px/500.
- The temporary 18px change was corrected before commit. The final Lynx owner
  explicitly uses 12px/16px/500.
- Focused Command suite: 1 file, 9/9 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Shared server `59290`, trusted origin `localhost:9991`, same snapshot,
  Light/Comfortable, `1280x820`; served and built hashes match.
- Real rendered Search clicks opened Command K on both clients.
- Current Web Suggested label: 12px/16px/500, 22px outer group-label box.
- Current Lynx-for-Web Suggested label: 12px/16px/500, 22px outer box.
- Exact-owned Native bundle
  `fd7618f888b9e8f3500e4479446d4c68a80d5f42df3f17806b970260dea5cc89`,
  root PID `90786`, PID-derived `localhost:8904/session 1`. A real Search touch
  retained label/parent roles, a `2560x1576` frame, and an empty warning/error
  console.
