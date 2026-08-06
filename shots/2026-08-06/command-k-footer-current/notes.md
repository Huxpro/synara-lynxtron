# Command K footer current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `9895b71e`.
- Ordinary Dialog source was inspected but not changed: Web `rounded-3xl`
  resolves through a different token path than the Lynx native shell. That
  surface still requires a rendered like-for-like comparison before any
  conclusion or patch.
- The Command footer had a concrete token mismatch. Web uses
  `calc(var(--radius-2xl) - 1px)`; with `--radius: 10px` and
  `--radius-2xl: 1.8 * radius`, the result is `17px`. Lynx remained fixed at
  `15px`.
- `.LxCommandFooter` now owns 17px bottom corners, and the focused Command
  contract locks both sides.
- Configured Web and Lynx-for-Web used server `58590`, trusted origin
  `localhost:9291`, the same snapshot, Light/Comfortable, and `1280x820`.
  The served bundle hash matched the built artifact.
- Both rendered Search controls opened Command K through real pointer events.
  Web and Lynx-for-Web footer geometry is identical: `574x41`, padding
  `12px 20px`, radius `0 0 17px 17px`. Both browser error logs are empty.
- Exact-owned Native bundle
  `d1544c342de1f836c346b63f170beb66d99c289243b7982a6c687e692d12d934`,
  root PID `89672`, PID-derived `localhost:8903/session 1`, and a real Search
  touch retained popup/footer roles, a `2560x1576` frame, and an empty
  warning/error console.
- Native numeric radius is not claimed because compound `VIEW` radius is not
  reported by this DevTool. Source/test plus current browser computed styles
  certify the radius; Native certifies bundle/class/interaction/screenshot.
- Focused Command suite: 1 file, 9/9 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
