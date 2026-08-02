# P8-Q2 — Projects overview Browser matrix

- Screen: Kanban project overview
- Themes: light / dark
- Sizes: `1280×820` / `1440×900`
- Clients: Web original / Lynx-for-Web
- Cells: 4 paired / 8 PNGs
- Shared snapshot SHA-256:
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`
- Shared browser origin: `http://localhost:63211`

All navigation and theme changes used rendered product controls. The overview
was opened from the visible `Kanban` sidebar row. Light and dark were selected
through Settings → Appearance on both clients.

## Geometry

At both sizes and themes:

- Page title: Lynx `x +8px`, `y +7px`, exact `14px` font.
- Project heading: Lynx `x +8px`, `y +6px`, exact `13px` font.
- Chats heading: Lynx `x +8px`, `y +6px`, exact `13px` font.

The Lynx project and Chats heading elements own their full column width, while
Web headings shrink-wrap their text. Width is therefore not a like-for-like
text metric for these two anchors. Position and typography satisfy the ≤8px /
≤2px contract in every retained cell.

## Gates

- All PNG dimensions match the requested viewport at DPR 1.
- Visual viewport and inner viewport match every cell.
- All page-error files are empty.
- Web light uses its empty-class default; Web dark resolves `html.dark`.
- Lynx resolves `SliceRoot--theme-light` / `SliceRoot--theme-dark`.
- Web console is empty.
- Lynx console contains only the named upstream initialization warning:
  `using deprecated parameters for the initialization function`.
- Focused Kanban overview/route tests passed: 4 files / 9 tests.
- Strict reuse and style audits passed.
- No direct SQLite writes or hidden route injection.
- Browser-only certification; Native remains pending.
