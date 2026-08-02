# P8-Q2 — Project Kanban Browser matrix

- Screen: project-scoped Kanban board
- Project: `Lynx Web Spike`
- Themes: light / dark
- Sizes: `1280×820` / `1440×900`
- Clients: Web original / Lynx-for-Web
- Cells: 4 paired / 8 PNGs
- Shared snapshot SHA-256:
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`
- Shared browser origin: `http://localhost:63211`

All navigation and theme changes used rendered product controls. The board was
opened through the visible `Kanban` row and `Lynx Web Spike` overview card.
Light and dark were selected through Settings → Appearance on both clients.

## Corrective cut

The first measurement found cumulative column drift: Lynx used a bespoke
`16px` inter-column gap while Web's canonical board uses `12px`. The third
column began more than 10px to the right of its Web counterpart, so those
initial metrics and frames were discarded rather than certified.

`apps/lynx/src/app/App.css` now uses the canonical `12px` gap. After rebuilding,
all three Lynx column shells begin exactly `8px` to the right of Web at both
sizes and themes, with no cumulative drift.

## Geometry

At both sizes and themes:

- Route title: Lynx `x +4px`, `y +7px`, exact `14px` font.
- All three column shells: Lynx `x +8px`, `y +6px`.
- Column widths: exact on all three columns.
- Column heights: Lynx `+2px`.

These values satisfy the ≤8px / ≤2px contract in every retained cell.

## Gates

- All PNG dimensions match the requested viewport at DPR 1.
- Visual viewport and inner viewport match every cell.
- All page-error files are empty.
- Web light uses its empty-class default; Web dark resolves `html.dark`.
- Lynx resolves `SliceRoot--theme-light` / `SliceRoot--theme-dark`.
- Web console is empty.
- Lynx console contains only the named upstream initialization warning:
  `using deprecated parameters for the initialization function`.
- Focused Kanban board/route/DnD tests passed: 5 files / 14 tests.
- Strict reuse and style audits passed.
- Default Lynx-for-Web artifact was rebuilt with only
  `ws://127.0.0.1:58090`; the certification endpoint is absent.
- No direct SQLite writes or hidden route injection.
- Browser-only certification; Native remains pending.
