# Current-head Pull Requests fidelity

## Harness

- Date: 2026-08-06.
- Route: Pull Requests, light / comfortable / `1280×820`, DPR 1.
- Owned server: `127.0.0.1:60480`.
- Trusted shared origin: `http://localhost:8925`.
- Snapshot:
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- Final Lynx-for-Web bundle:
  `b7c40d49c997abe399600755727a3506779f93cc8b9107f8c60af9a5f46a43c7`.
- Final Native bundle:
  `e0492c8052b1b3141626be80bc58c19753168ca69553c598c80e26067c99482e`.

Both Browser clients navigated through the rendered Pull Requests sidebar
control. Lynx-for-Web used a real pointer sequence at the measured visible
control center; no memory-history or SQLite fixture was injected. Web's URL was
`/pull-requests?involvement=all&state=open`.

## Measured residuals

The 2026-08-04 atlas had retained several differences without blocking them.
The current-head pair confirmed they still existed:

1. Route title: Web `14/20/500`; Lynx `14/20/600`.
2. Route inset: Web filters started at x=284; Lynx started at x=280 because
   `FeaturePageInner--pullRequests` used 24px rather than Web's 28px inset.
3. Active pills: both were `34.15625×26` with `4×10` padding, but Lynx used a
   6px radius versus Web's 8px.
4. Project filter: Web used a `24×24` icon-only trigger with the exact
   `filter-2` glyph; Lynx used a 96px text button.
5. Refresh: Web used a centered 16px refresh SVG; Lynx used the font glyph
   `↻`.
6. Both icon buttons inherited a transparent 1px primitive border, shrinking
   the intended 16px painted slot to 14px in Lynx.

These were fixed at the route/adapter owners, not with feature-local offsets:

- title weight 500;
- route inset 28px;
- pill radius 8px;
- exact Central `filter-2` SVG in a 16px slot;
- generated `RefreshCwIcon` in a 16px slot;
- 24px project-filter and 28px refresh owners explicitly remove the transparent
  border that consumed their icon slot.

The project trigger publishes the complete
`Filter pull requests by project: All projects` name plus
`aria-pressed=false` and a Native selected accessibility state. The active dot
remains conditional.

## Final Browser geometry

| Anchor | Web | Lynx-for-Web |
| --- | --- | --- |
| Title | `276/13/85.75/20`, 14/20/500 | exact |
| Active All pill | `284/62/34.15625/26`, radius 8 | exact |
| Refresh trigger | `1232/9/28/28` | exact |
| Refresh glyph | `1238/15/16/16` | exact |
| Project trigger | `1228/102/24/24`, radius 6 | exact |
| Project glyph | `1232/106/16/16` | exact |
| Empty title | `664.40625/192/207.1875/28` | exact |
| Empty description | `591.390625/224/353.21875/20` | exact |

The search row is an intentional capability delta. Web exposes an editable
search input; Lynx honestly renders `Search unavailable in this runtime`.
The row still owns the same x=284 start, 28px control height, and project-filter
right edge. It was not disguised as a fake input.

Both Browser PNGs are exactly `1280×820`; Browser page-error files are empty.
Lynx-for-Web logs only the known upstream initialization deprecation warning.

## Native

- Launch root PID: `6801`.
- Renderer PID: `6804`.
- PID-derived client: `localhost:8904`.
- Session: 1.
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.
- Raw PNG: `2560×1576`.
- Navigation: real `Input.emulateTouchFromMouseEvent` press/release on the
  visible Pull Requests sidebar row.
- Native title: `276/13/88/20`, computed `14/20/500`.
- Refresh and project SVGs: direct DOM nodes with `16×16` styles and the
  expected SVG content.
- Project trigger DOM publishes `aria-pressed=false`, accessibility label,
  button trait, and touch/tap handlers.
- Native warning/error console: empty.

Lynx DevTool's `DOM.getBoxModel` collapses several compound interactive VIEW
nodes to their text or icon child bounds in this build. Therefore the Native
evidence does not claim those returned `15×18` / `16×16` values are the full
button outer boxes. Outer-button geometry is established by the exact Browser
pair and CSS contract; Native directly certifies the title, SVG painted slots,
accessibility tree, real touch navigation, screenshot, and clean console.

## Gates and cleanup

- Focused PR controls: 1 file, 3/3.
- Lynx-for-Web production build: pass.
- Native/Desktop production build: pass with the existing unsupported CSS and
  optional `ws` native-module warnings.
- Owned server/static/Native processes and named Browser sessions exited.
- Normal SQLite, settings, Native KV, and window-state hashes remained
  byte-exact.
- Existing clients on 8901–8903 were not touched.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
