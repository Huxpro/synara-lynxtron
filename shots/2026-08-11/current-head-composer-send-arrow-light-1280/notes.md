# Current-head composer send arrow light 1280

- Scope: focused fast-loop follow-up for the disabled Composer send action.
- Web and Lynx-for-Web use the same isolated server/state, light theme,
  `1280x820` viewport, and DPR 1.
- Residual: the Lynx 28px disabled send action rendered only its gray circular
  background; the white up-arrow was absent. The raw SVG helper had replaced
  `currentColor` with the literal CSS variable
  `var(--color-background-surface)`, which Lynx raw SVG content did not paint.
- Fix: `useTheme().svgColors` now exposes the resolved theme surface, and the
  send arrow plus sending spinner inject that concrete color into raw SVG.
  This preserves live theme updates without embedding an unresolved CSS
  variable in SVG content.
- Runtime evidence:
  - Web and Lynx button bounds are `28x28`.
  - Web and Lynx disabled button opacity is `0.2`.
  - Lynx arrow bounds are `20x20`, centered at `(1103,525)`.
  - Lynx raw SVG contains `stroke="#ffffff"` in the light theme.
- Both retained PNGs are exactly `1280x820`; Web and Lynx page-error files are
  empty. Lynx relay is OPEN with zero pending requests and no transport/RPC
  error. Its only console warning is the named upstream WebAssembly
  initialization deprecation.
- Verification: the focused primary-action/theme contract passes 3/3; Web and
  Desktop production builds pass; strict pull-request reuse remains `61.95%`;
  style coverage remains `98.07%`.
- The older aggregate Composer adapter test is independently stale at its
  model-group hover assertion (it expects a shared hover token while current
  source uses light/dark `rgba(...)`). That unrelated assertion was not used as
  evidence for this slice.
- This is a fast-loop light/1280 slice, not Native or global P10 certification.
