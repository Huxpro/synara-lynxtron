# Sidebar primary pressed state current-head fidelity

Status: retained real Web/Lynx-for-Web pressed evidence plus exact-owned Native
bundle/runtime evidence

- Source base: `3f490411`.
- Current Web New thread pointer-down keeps the row at `opacity: 1` and uses
  `--sidebar-accent-active` plus `--sidebar-accent-foreground`.
- Before this slice, Lynx used the ordinary hover surface for `ui-pressed` and
  dimmed the entire row to `opacity: 0.8`.
- The shared Lynx pressed owner now uses the active surface/foreground tokens
  and no longer changes whole-row opacity.
- Real Lynx-for-Web pointer-down publishes `ui-pressed`, resolves to
  `opacity: 1`, and uses the same active token semantics as Web. Pointer-up
  removes `ui-pressed` and restores the base row. Web and Lynx-for-Web pressed
  PNGs are `1280x820`; browser error logs are empty.
- In the current light and dark token sets, hover and active background values
  may resolve to the same numeric color. This slice preserves the distinct Web
  semantic owner rather than inventing a stronger pressed color.
- Focused suites: 2 files, 6/6 tests. Configured Lynx-for-Web and
  Native/Desktop production builds pass with only the existing encoder and
  optional `ws` warnings.
- Exact-owned Native bundle
  `db6de0885eb9b2072a0c8587f1c3350bf9b0a56f54017efbb9ab824e88badc26`
  ran from `apps/lynx/dist/desktop/main.lynx.bundle`. The owned child PID was
  resolved dynamically to `localhost:8901/session 1`; the staged bundle
  contains the primary-row and active surface/foreground markers, and the
  warning/error console is empty.
- Native screenshot capture was rejected as harness evidence because the
  non-raised window emitted no `Page.screencastFrame` within the timeout. The
  app was not raised and the capture was not retried in a loop. Native pressed
  visuals are therefore not claimed; Native class publication remains covered
  by the real Lynx interaction-state contract.
- Cleanup: the exact-owned root and child exited, and unrelated Lynxtron
  instances were not touched.
