# Environment fast-loop fidelity audit

Date: 2026-08-09

## Completion matrix

| Requirement | Evidence | Status |
| --- | --- | --- |
| Use one isolated server and one real snapshot | server `58560`, server instance `41643b36-84e9-4fc5-b816-a7d11af62543`, canonical `project-env-fidelity` / `thread-env-fidelity` fixture | PASS |
| Prove Web authority route through product interaction | rendered sidebar thread click resolved canonical Web route `/thread-env-fidelity` | PASS |
| Prove real Lynx-for-Web target | recursive shadow probe found `X-VIEW SliceRoot`; staged and built bundle hashes match | PASS |
| Make Environment open/close reachable in fast loop | trusted pointer click on `EnvironmentToggle` writes idempotent `environment=open|closed` URL target; focused click/Enter/disabled tests | PASS |
| Preserve Native behavior | Native bundle contains no Web URL marker or Web-host style rule; Native keeps original `bindtap` path | PASS |
| Match open panel shell in dark mode | paired dark 1280x820 screenshots: exact x/y, 312px overlay, 288px surface, radius 18, border, padding, gap, and title box | PASS |
| Verify light shell appearance after the final host rule | fresh isolated 58620/9321 harness, canonical product-route click, nonblank paired 1280x820 frames, matching x/y/width/radius/background/foreground | PASS — loaded-content height remains under recorded SDK limit |
| Verify narrow layout | paired 900x700 dark screenshots and runtime dimensions | PASS |
| Correct Lynx-for-Web scroll-view stretch | Environment-scoped `injectStyleRules` override removes Web Elements' `flex:1;height:100%` default while retaining max-height overflow boundary | PASS |
| Verify page-error gate | `web-errors.json` and `lynx-errors.json` contain empty error arrays | PASS |
| Verify focused tests | Environment + thread polling + Web interaction bridge: 3 files / 17 tests | PASS |
| Verify production builds | Lynx-for-Web and Native/Desktop production builds pass; known encoder and optional `ws` warnings only | PASS |
| Loaded Environment data and top/middle/bottom scroll parity | nested Git/local-server/usage owners do not publish RPC in the current ReactLynx/Web Elements runtime; no loaded/scroll pass is claimed | RECORDED SDK LIMIT |
| Native certification | blocked by the separately documented Lynxtron snapshot parser issue | BLOCKED BY SDK |

## Result

The Environment surface is now a legitimate fast-loop target rather than an
unreachable mounted panel. Its shell can be opened through a trusted rendered
control in both themes and at both audited widths. The Web Elements-specific
scroll-view stretch that created a false full-height empty panel is normalized
at the host boundary without changing Native CSS or behavior.

Retained evidence is under
`shots/2026-08-09/environment-fast-loop-current/`. The evidence deliberately
does not promote nested Environment data loading or scroll positions to PASS;
those remain tied to the current ReactLynx/Web Elements owner limitation and
the Native SDK blocker.
