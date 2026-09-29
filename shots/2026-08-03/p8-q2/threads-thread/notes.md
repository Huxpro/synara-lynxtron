# P8-Q2 — Threads / Thread Browser matrix

## Scope

Fast Browser tier only. This slice covers:

- Screens: Threads landing and Thread transcript
- Themes: light and dark
- Viewports: `1280×820` and `1440×900`
- Clients: Web original and Lynx-for-Web
- Total: 8 paired cells / 16 retained PNGs

It does not certify Native platform semantics.

## Harness

- Shared origin: `http://localhost:63211`
  - Web original: `/`
  - Lynx-for-Web: `/lynx/`
- Shared server: `ws://127.0.0.1:62190`
- Server `devUrl`: `http://localhost:63211/`
- State:
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home/dev/state.sqlite`
- Snapshot SHA-256:
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`
- Snapshot content: 3 projects, 5 threads, 30 messages
- Product project: `Lynx Web Spike`
- Thread route:
  `thread:1785617357970-wy83hd92` (`Draft seed task`)

Both clients were served from one origin because the server intentionally
trusts one browser `devUrl`. The earlier two-origin diagnostic setup was
rejected by the CSRF origin gate and was discarded rather than treated as a
product failure.

## Product state

- Theme changes used Settings → Appearance → Light/Dark on both clients.
- Route changes used rendered `New thread` and `Draft seed task` controls.
- The Web-only Codex status failure banner was dismissed through its rendered
  product action before the Threads comparison. Lynx does not copy that
  environment-specific Web warning.
- No SQLite fixture writes or direct route-state injection were used.

## Threads

Retained cells:

- `threads/light-1280`
- `threads/light-1440`
- `threads/dark-1280`
- `threads/dark-1440`

Like-for-like results at both sizes and themes:

| Anchor            |  Web original | Lynx-for-Web | Delta |
| ----------------- | ------------: | -----------: | ----: |
| Hero heading X    |      centered |       `+8px` |  pass |
| Hero heading Y    |     authority |    `+7.75px` |  pass |
| Hero size         | `320.36×34.5` |  `320.36×35` |  pass |
| Hero font         |        `30px` |       `30px` |  pass |
| Project tray X    |     authority |       `+8px` |  pass |
| Project tray Y    |     authority |    `+7.25px` |  pass |
| Project tray size |      `736×58` |     `736×58` | exact |

The sidebar and header retain the documented Lynx host inset. It does not
change the shared 736px landing rail or typography.

## Thread

Retained cells:

- `thread/light-1280`
- `thread/light-1440`
- `thread/dark-1280`
- `thread/dark-1440`

The same long real transcript rendered on both clients. At `1440×900`, both
clients were exactly at their live edge. At `1280×820`, light was within 5px
and dark preserved the same 80px trailing-inset distance on both clients.

The outer scroll owner is intentionally platform-specific:

- Web original virtual timeline owns the full main content width.
- Lynx uses the registered 736px native `<list>` kernel.

Message row anatomy, transcript content, title, theme, bottom-follow state, and
composer placement remain product-equivalent. This is the existing list
platform boundary, not an unregistered large-area difference.

## Gates

- All 16 PNGs have exact requested pixel dimensions.
- Every runtime viewport and visual viewport matched the requested cell.
- DPR was 1 in every Browser cell.
- All retained `*-errors.txt` files are empty.
- Lynx console contains only the known upstream initialization deprecation.
- Web console contains only normal production/runtime messages.
- Both clients used the same snapshot hash and product state.

## Discarded diagnostics

- `.synara-pr84` exposed a valid protocol snapshot but current clients did not
  hydrate it; those frames were discarded.
- Starting clients before server readiness produced empty/offline states; those
  frames were discarded.
- Two separate browser origins caused the server to trust only one client; the
  harness was rebuilt under one origin instead of weakening CSRF.
- Dark Threads initially captured a stale Lynx Thread route. Route assertion
  caught it, and both dark cells were overwritten after rendered `New thread`
  navigation.
