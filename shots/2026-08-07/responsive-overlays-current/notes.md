# Responsive overlay evidence

- Date: 2026-08-07
- Route: `synara://threads`
- Theme: light
- Native content viewport: `900x650`
- Device pixel ratio: `2`
- PNG dimensions: `1800x1300`
- Server: isolated real Synara service at `ws://127.0.0.1:58090`
- Lynxtron PID: `62116`
- PID-derived DevTool client/session: `localhost:8903` / `1`
- Staged bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`
- Bundle SHA-256:
  `71040b02bab2c9865208d1ddbcfd0519105710a5c38f86d0e33dc2af3d87d41e`
- Source revision before evidence notes:
  `46fdb6167e8169a97816b35c11df518b14cea71b`

## Search command dialog

- Opened through the real Sidebar Search action against the shared service
  snapshot.
- Dialog viewport: `x=0..900`, `y=0..650`.
- Popup: `x=162..738`, `y=103..476`.
- Result scroll owner: native `SCROLL-VIEW`, `x=163..737`,
  `y=153..429`.
- No horizontal or vertical viewport overflow.
- Frame: `search-900x650-before.png`.
- Frame SHA-256:
  `6573525e9b9328a65554cb6dd424c249b093ab93af053134b23c9dabd4d837ce`.

## Composer model menu

- Opened through the real `Choose model` trigger after restarting the exact
  owned production instance following a local-bundle `Page.reload` harness
  failure.
- Trigger state: `aria-expanded=true`.
- Menu layer: `x=0..900`, `y=0..650`.
- Popup: `x=472..732`, `y=131..431`.
- Provider scroll owner: native `SCROLL-VIEW`, `x=478..726`,
  `y=137..425`.
- No horizontal or vertical viewport overflow.
- Frame: `model-900x650.png`.
- Frame SHA-256:
  `457aec5011d67cd7d9e5df6cfda03f309d8d24830bbc75a2302fc807cadaa2c9`.

## Result

The shared native Menu primitive already measures the anchor, popup, and
viewport and clamps both coordinates. Search command and Composer model
overlays fit the Desktop minimum viewport and retain one internal vertical
scroll owner, so this evidence does not justify a product CSS change.

Desktop enforces a `900x650` minimum. The shared `compact` viewport band remains
necessary for Lynx-for-Web and future hosts, but widths below 900 are not
reachable in the current Native Desktop shell.

Fresh warning/error console capture was empty. Environment, diff/browser
docks, and selection-action overlays remain outside this evidence slice.
