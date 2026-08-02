# P8-Q2 — Settings Browser matrix

- Screen: Settings → General
- Themes: light / dark
- Sizes: `1280×820` / `1440×900`
- Clients: Web original / Lynx-for-Web
- Cells: 4 paired / 8 PNGs
- Shared snapshot SHA-256:
  `7dfc4c8d755bb0656df7f4fba2ff4cebe3602189854605508ace4ae278147540`
- Shared browser origin: `http://localhost:63211`

All navigation and theme changes used rendered Settings controls.

## Geometry

At both sizes and themes:

- Description X: Lynx `+5px`
- Description Y: Lynx `+8px`
- Description width: exact `363.89px`
- Description font: exact `14px`
- First section card X: Lynx `+5px`
- First section card Y: Lynx `+5.25px`
- Card width: exact `624px`
- Card height: Web `155px`, Lynx `156px`

These values satisfy the ≤8px / ≤2px contract.

The Lynx title probe initially selected the duplicate `General` navigation row;
the retained comparison uses the unique description and first content card as
the panel anchors. This is selector noise, not a product difference.

## Gates

- All PNG dimensions match the requested viewport.
- DPR and visual viewport match every cell.
- All page-error files are empty.
- Theme classes resolve to light/dark on both clients.
- No direct SQLite writes or hidden route injection.
- Browser-only certification; Native remains pending.
