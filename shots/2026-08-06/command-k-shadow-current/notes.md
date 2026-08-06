# Command K shadow current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `779f8d84`.
- Old retained styles showed Web's Command outer dialog with `shadow-lg/5`
  while Lynx had no shadow. A first current probe also showed that Web's inner
  panel carries `shadow-xs/5`; this was not covered by the previous geometry
  roles.
- The Lynx outer dialog now owns the same two 5% soft-lift layers:
  `0 10px 15px -3px` and `0 4px 6px -4px`.
- The Lynx inner panel owns the matching 5% hairline lift:
  `0 1px 2px 0`.
- The focused Command contract locks both material layers.
- Configured Web and Lynx-for-Web used server `58690`, trusted origin
  `localhost:9391`, the same snapshot, Light/Comfortable, and `1280x820`.
  The served bundle hash matched the built artifact.
- Both clients opened Command K through rendered Search controls. Current
  computed styles match semantically: Web includes transparent utility ring
  entries followed by the same 5% shadow layers; Lynx reports those painted
  layers directly. Final Lynx screenshot is `1280x820`, and browser errors are
  empty.
- Exact-owned Native bundle
  `5238d1cceab12a15cc179744576a49955b2c74d485992834a481328f74b9aab2`,
  root PID `17696`, PID-derived `localhost:8904/session 1`, and a real Search
  touch retained popup/panel roles, a `2560x1576` frame, and an empty
  warning/error console.
- The first Native attempt incorrectly guessed `8903`; PID/lsof showed the
  owned endpoint was `8904`, the failed output was deleted, and only the
  helper-verified `8904` capture is retained.
- Focused Command suite: 1 file, 9/9 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
