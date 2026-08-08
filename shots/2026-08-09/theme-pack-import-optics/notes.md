# Theme Pack Import textarea optics

- Owned harness: server `58161`, Web `9962`, temporary home
  `.synara-theme-optics`.
- Three-client preflight resolved server instance
  `19d3c819-c926-4322-ac62-bb182ad244b1`, snapshot sequence `0`.
- Canonical Web authority was opened at `/settings?section=appearance`.
  Lynx-for-Web used `/lynx/index.html?route=/settings/appearance`.
- Both dialogs were opened through their rendered first `Import` control and
  both textareas were focused through the product input surface.

## Resolved values

| Theme | Web placeholder | Lynx internal placeholder | Web focus border | Lynx focus border |
| --- | --- | --- | --- | --- |
| Light | foreground/50 | `rgba(13,13,13,.5)` | foreground/30 | `rgba(13,13,13,.3)` |
| Dark | foreground/50 | `rgba(252,252,252,.5)` | foreground/30 | `rgba(252,252,252,.3)` |

- Lynx `x-textarea` exposes
  `placeholder-color="var(--theme-pack-import-placeholder)"`.
- Web Elements maps that attribute to the shadow textarea's inline
  `--placeholder-color`, and the real internal `textarea::placeholder`
  resolves to the expected 50% foreground.
- The textarea remains `434,371.25,412x94` in all four cells.
- Each retained PNG is exactly `1280x820`.
- Page errors are empty. Lynx relay diagnostics show one connection attempt,
  zero pending requests, and no transport or RPC error.
- Focused tests: `16/16` pass.
