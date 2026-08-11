# Current-head provider banner icon light 1280

- Scope: focused fast-loop follow-up for the provider-health banner icon.
- Web and Lynx-for-Web use the same isolated server/state, light theme,
  `1280x820` viewport, DPR 1, and Codex-unavailable product state.
- Residual: Web's `Alert variant="error"` colors the direct alert SVG with
  `--destructive`, while Lynx forced `.ProviderHealthBannerIcon` to
  `--foreground`, producing a black icon.
- Fix: Lynx now maps error icons to `--destructive` and warning icons to
  `--warning`; banner title, description, and dismiss control retain the
  notification foreground contract.
- Runtime computed color:
  - Web: `rgb(224, 46, 42)`
  - Lynx-for-Web: `rgb(224, 46, 42)`
- Both banner bounds remain exactly `736x68` at `(400,58)`, and both retained
  PNGs are exactly `1280x820`.
- Web and Lynx page-error files are empty. Lynx relay is OPEN with zero pending
  requests and no transport/RPC error. The only Lynx console warning is the
  named upstream WebAssembly initialization deprecation.
- Verification: focused component tests 3/3; Web and Desktop production builds
  pass; strict pull-request reuse remains `61.95%`; style coverage remains
  `98.07%`.
- This is a fast-loop light/1280 slice, not Native or global P10 certification.
