# Sidebar primary active state current-head fidelity

Status: retained Lynx-for-Web and exact-owned Native interaction evidence plus
Web source-contract authority

- Source base: `def16c42`.
- Web primary navigation owns selected/open rows with
  `--sidebar-accent-active` and `--sidebar-accent-foreground`.
- Lynx previously used the ordinary hover accent for
  `.SharedSidebarPrimaryActionButton--active`.
- The Lynx active owner now uses the same active surface and foreground tokens.
  Current light/dark palettes resolve hover and active backgrounds to the same
  numeric value, so this is semantic-owner alignment rather than an invented
  color difference.
- Fresh Lynx-for-Web Search activation opens the real Command dialog and adds
  `SharedSidebarPrimaryActionButton--active`; the row resolves through the
  active/foreground variables at opacity 1. Browser errors are empty and the
  retained frame is `1280x820`.
- Focused primary-navigation suite: 1 file, 3/3 tests. Configured Lynx-for-Web
  and Native/Desktop production builds pass with only existing warnings.
- Exact-owned Native bundle
  `87d0b64b244dc9f1688668501a91a207f8b02a6eeaf19c750c5d310a3e1fc491`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8901/session 1`.
- Supported Native touch opens Search; the active row resolves to dark active
  background alpha 0.0352941, foreground rgb(252,252,252), and opacity 1. Raw
  frame is `2560x1576` and warning/error console is empty.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
