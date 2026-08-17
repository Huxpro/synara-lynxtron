# Current Usage mixed-auth warning icon fidelity

## Newly discovered scope

This loop did not replay the older unavailable-only Usage state. It discovered
and certified the current real mixed provider state after the Codex binary
resolver changed:

- screen: Settings / Usage;
- route: Web `settings?section=usage`, Lynx/Native `/settings/usage`;
- state: Codex local fallback with a real limit and usage history, Claude local
  fallback while unauthenticated, Cursor unavailable;
- theme: dark;
- viewport: `1280x820`, comfortable density, 336px Settings sidebar;
- interaction: Web reached Appearance -> Dark -> Usage and resized its Sidebar
  through rendered controls; Lynx-for-Web resized through its real sash;
  Native used the product deep-link startup route.

The older Usage evidence from 2026-08-05/06 predates the current provider
resolver and does not cover this mixed-auth state.

## Harness preflight and classification

The retained clients all used:

- server: `127.0.0.1:58090`;
- server instance: `1405e4a2-b612-442d-bc23-504011bd416b`;
- snapshot sequence: `182`;
- SQLite SHA-256:
  `0169e90df754def0dc36efa62dfff8d688cf1ed6fc2c49e777419cd8827b2eae`;
- Web/Lynx-for-Web trusted origin: `http://localhost:8891`;
- viewport: `1280x820`;
- theme: dark;
- density: comfortable;
- Sidebar width: `336px`.

The complete connection preflight passed Web, Lynx-for-Web, and Native with the
same server instance and snapshot sequence.

Harness losses kept separate from product loss:

- `http://localhost:5733` and `http://127.0.0.1:5733` were rejected with HTTP
  403 because the long-running server's configured dev origin is
  `http://localhost:8891`; no product evidence was retained from those probes.
- An early Web AX snapshot was taken before hydration and was empty; the loaded
  DOM and later rendered-control path were healthy.
- Lynx-for-Web custom Settings rows and Refresh do not publish ordinary browser
  click semantics. Route initialization and system dark media were used for
  precise setup, while the retained real interaction is its Sidebar sash drag.
  The Refresh click is not claimed.

## P1 product loss

`lynx-usage-warning-icon-invisible`: P1 component contribution `1.00 -> 0.00`.

Before the fix, both Lynx warning owners had exact `14x14` SVG boxes at the
same coordinates as Web, and their text began at the correct x position, but
no icon pixels rendered. `TriangleAlertIcon` received
`var(--settings-usage-warning-text)`. The raw-SVG helper only resolves
foreground and muted-foreground tokens, so that unresolved CSS variable was
written into the serialized SVG `stroke`; the Lynx raw SVG renderer did not
resolve it.

The fix keeps ownership local to Settings Usage and projects explicit paints
that match the existing CSS tokens:

- light: `#e17100`;
- dark: `rgba(255, 210, 48, 0.9)`.

It does not broaden the shared SVG helper into an arbitrary CSS-variable
parser.

## Comparable final evidence

All three clients place the two warning icons at:

- Codex: `14x14 @ (513,211)`;
- Claude: `14x14 @ (513,509)`.

Web and Lynx-for-Web card boxes are exact:

- Codex: `624x286 @ (496,150)`;
- Claude: `624x188 @ (496,448)`;
- Cursor: `624x95.5 @ (496,648)`.

Native keeps the same outer width and x positions. Its line/card heights round
to integer device-independent pixels (for example warning text `20px` instead
of `19.5px`), classified as accepted rendering noise rather than product loss.

Paint evidence:

- Web warning text/icon: dark warning token;
- Lynx-for-Web serialized SVG stroke:
  `rgba(255, 210, 48, 0.9)`;
- Native serialized SVG stroke:
  `rgba(255, 210, 48, 0.9)`.

The final frames are:

- `web/raw.png`: `1280x820`;
- `lynx/raw.png`: `1280x820`;
- `native/raw.png`: `2560x1640` (DPR 2).

Web page errors, Lynx-for-Web page errors, and exact-client Native
warning/error console are empty. Lynx-for-Web reports one known upstream
initialization deprecation warning and no runtime error. Relay diagnostics show
one open socket, zero pending requests, and no transport/RPC error.

## Verification

- Settings Usage focused Rstest: `1 file / 6 tests`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed.
- Native bundle SHA-256:
  `12d35ee57093e6d9056161f7ce6b9e9ce8f6c8191a1a38738fbd162bd54a9141`.
- Rspeedy and staged Native bundles were byte-identical.
- Exact-owned Native PID: `11280`.
- PID-derived DevTool client: `localhost:8902`, session `1`.
- Native route was delivered by the product deep link
  `synara://settings/usage` and host logs include `server.listProviderUsage`.
- A real macOS system-mouse click on the exact-owned Native Refresh action
  emitted a second canonical
  `server.listProviderUsage { forceRefresh: true }` request; the PID and server
  connection remained stable.

## Screenshot budget rotation

Three new final frames replaced three superseded before frames that already
have retained after replacements:

- `shots/2026-08-14/studio/visual-matrix/lynx-wide-light-before.png` ->
  `lynx-wide-light-after.png`;
- `shots/2026-08-14/plugins/visual-matrix/lynx-skills-compact-light-before.png`
  -> `lynx-skills-compact-light-after.png`;
- `shots/2026-08-15/editor-interaction-starvation/lynx-changes-before.png` ->
  `lynx-changes-after.png`.

The removed bytes remain in Git history. The local screenshot count remains
exactly 100.
