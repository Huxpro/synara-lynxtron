# P8-Q2 — Pull Requests Browser matrix

- Screen: Pull Requests list empty/filter state
- Themes: light / dark
- Sizes: `1280×820` / `1440×900`
- Clients: Web original / Lynx-for-Web
- Cells: 4 paired / 8 PNGs
- Shared snapshot SHA-256:
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`
- Shared browser origin: `http://localhost:63211`

The shared real snapshot has no pull requests matching the default All + Open
filters, so both clients render the canonical filter rail and empty state. No
PR fixture was fabricated. All navigation and theme changes used rendered
product controls.

## Corrective cut

The first measurement found a `2.5px` filter-stack height mismatch: Lynx used a
`24.5px` pill row plus a `32px` unavailable-search row, totaling `68.5px`;
Web uses a `26px` pill row plus a `28px` search row, totaling `66px`. This
pushed the empty state to `y +10.5px`, so those initial metrics were discarded.

The Lynx adapter now matches Web's measured `12px / 18px` pill typography and
`28px` search/project-filter row. The retained filter stack is exactly `66px`.

## Geometry

At both sizes and themes:

- Route title: Lynx `x +8px`, `y +8px`, exact `14px` font.
- Filter stack: Lynx `x +4px`, `y +8px`, exact height.
- Empty-state shell: Lynx `x +4px`, `y +8px`, exact height.
- Filter and empty shells are `8px` wider because the Lynx page uses 24px
  horizontal padding while Web's responsive cell resolves to 28px.

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
- Focused shared PR composition tests passed: 2 files / 5 tests.
- Strict reuse and style audits passed.
- Default Lynx-for-Web artifact was rebuilt with only
  `ws://127.0.0.1:58090`; the certification endpoint is absent.
- No direct SQLite writes or hidden route injection.
- Browser-only certification; Native remains pending.
