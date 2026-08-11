# Current-head Landing system-dark 1440

- Scope: current-head fast-loop Landing at `1440x900`, DPR 1, with the product
  theme mode set to System and browser system appearance set to dark.
- Residual fixed: Web followed `prefers-color-scheme: dark`, while Lynx always
  called `resolveThemeVariant(mode, false)` and rendered the light slot.
- Fix: the Web host injects `initialSystemDark` from `matchMedia`; App root,
  router, and shared Lynx theme consumers resolve System mode against that host
  signal. Native/Desktop still keeps its explicitly documented light fallback
  until a reliable native appearance event is available.
- Runtime proof after switching the rendered Lynx Appearance control back to
  System:
  - `initialSystemDark=true`
  - root class contains `SliceRoot--theme-dark`
  - resolved canvas is `rgb(16, 16, 16)`
- Web and Lynx retained PNGs are exactly `1440x900`; page-error files are empty.
  Lynx relay is OPEN with zero pending requests and no transport/RPC error.
- Geometry remains converged: the provider banner is `736x68` at `(480,58)`;
  heading y differs by `0.25px`.
- Verification: focused theme/interaction coverage passes 17/17;
  Lynx-for-Web production build passes.
- This certifies the fast-loop Landing system-dark/1440 cell only; it does not
  certify Native system appearance or the full current-head matrix.
