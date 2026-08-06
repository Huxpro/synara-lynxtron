# Command K outer shell current-head fidelity

Status: retained Lynx-for-Web and exact-owned Native follow-up

- Source base: `1fad6289`.
- The previous Command K slice closed the panel and item radii but left the
  outer dialog at the old Lynx `16px` value. Current Web authority is `18px`.
- `.LxDialogPopup.LxCommandDialogPopup` now owns `18px`; the Command contract
  locks all three layers together: outer `18px`, panel top corners `14px`, and
  item `10px`.
- Configured Lynx-for-Web bundle was served from the trusted `localhost:9191`
  origin against server `58490`; served and built hashes matched.
- The rendered Search control opened Command K through real pointer events.
  Final computed styles are outer `18px`, panel `14px 14px 0 0`, item `10px`.
  The retained frame is `1280x820` and the browser error log is empty.
- Exact-owned Native bundle
  `1579d96479bf6f4bce6f163a898231df17f0eada6f58fca1be797c71a7e833dc`,
  root PID `65639`, PID-derived `localhost:8903/session 1`, and a real Search
  touch retained root/popup/panel/item roles, a `2560x1576` frame, and an empty
  warning/error console.
- Native numeric radius is not claimed because this DevTool reports `0px` for
  compound `VIEW` nodes. The production source/test contract plus current
  Lynx-for-Web computed styles close the numeric radius; Native certifies the
  current bundle, rendered classes, real interaction, screenshot, and console.
- Focused Command suite: 1 file, 9/9 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
