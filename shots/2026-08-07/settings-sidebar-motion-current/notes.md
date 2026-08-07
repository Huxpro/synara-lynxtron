# Settings sidebar disclosure motion

- Scope: the Settings sidebar only. The regular project/thread sidebar retains
  its prior instant mount/unmount behavior because every retained-tree variant
  tested against Lynxtron 0.0.7 triggered a background JSRuntime
  `toLowerCase` rejection and repeated renderer reconstruction. Those failing
  experiments were reverted rather than traded for visual fidelity.
- The Settings sidebar now reuses the canonical 220ms disclosure timing. Its
  shell animates width 256px to 0 while the fixed-width inner surface translates
  left. Reduced motion resolves the same state change at 0.01ms.
- Exact-owned production runtime used isolated service `ws://127.0.0.1:58090`,
  staged bundle SHA-256
  `9793e65400e18a589d4c684f0e6290ca93fe14110bfde114eda21ac049a94c7e`,
  Lynxtron PID `9246`, and PID-derived `localhost:8902/session 1`.
- At 28ms after the real Toggle press the retained exit tree already published
  `aria-hidden=true`, `accessibility-elements-hidden=true`, zero
  `focusable=true` descendants, 20 explicit `focusable=false` descendants, and
  a disabled/readonly Search input. The tree then unmounted and a second real
  Toggle press restored the open state.
- Rapid reversal before cleanup kept the same Settings controller alive and
  restored the shell without losing Search/section/save ownership.
- The retained open frame is 2560x1640. Final warning/error console output is
  empty. The DevTool connector became too latent for trustworthy sub-220ms box
  interpolation samples in the final run, so `native-geometry.json` is
  diagnostic only and is not claimed as temporal geometry proof.
- Focused tests pass 20/20 and the Native/Desktop production build passes.
  The heavyweight fmt/lint/typecheck pass remains unrun under the current
  instruction boundary.
