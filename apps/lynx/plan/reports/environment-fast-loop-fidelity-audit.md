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
| Load Environment data without destabilizing the relay | initial-open fast loop uses bounded batches for local status/branches/servers and config/repository; `git.statusLocal` never refreshes remote refs, and the measured >8s Usage request remains excluded; one relay connection, zero duplicate Environment RPCs, zero retained transport errors | PASS |
| Match current Editor composition | Lynx adds Web's real `Editor view` row and opens the existing Explorer dock through `setExplorerVisibility(true)`; external editor picker remains below it | PASS |
| Verify top/middle/bottom scroll geometry | paired light/dark 1280x480 cells: exact 288x330 surface at x=980/y=138, 328px viewport, Web 0/82/164 and Lynx 0/75/149 top/mid/bottom positions | PASS FOR STATIC GEOMETRY |
| Verify real wheel publication | Chromium wheel over the Lynx-for-Web custom element does not update the nested scroll-view; programmatic positions are retained for visual evidence only | RECORDED WEB ELEMENTS LIMIT |
| Preserve honest Git/usage failure states | `git.statusLocal` reuses the existing local/remote status split, skips upstream refresh, and returns working-tree statistics without network access; the >8s Usage request remains excluded | PASS |
| Close loaded-content height residual | stable external Git fixture (`README.md`, fixed +1/−1) proves Web and Lynx light/dark all resolve to 427px content, 408px viewport, and 0/10/19 top/mid/bottom positions | PASS — previous 15px delta closed |
| Native certification | Lynxtron `0.0.9` loads the current bundle and a canonical project/thread fixture was created through product RPCs. The loaded panel still cannot be opened through the current exact-client synthetic touch path: hit testing reaches the right-header toggle, but activation is not published. No hidden open-state injection is used | PARTIAL — REGISTERED RIGHT-HEADER INPUT BOUNDARY |

## Result

The Environment surface is now a legitimate fast-loop target rather than an
unreachable mounted panel. Its shell can be opened through a trusted rendered
control in both themes and at both audited widths. The Web Elements-specific
scroll-view stretch that created a false full-height empty panel is normalized
at the host boundary without changing Native CSS or behavior.

Retained evidence is under
`shots/2026-08-09/environment-fast-loop-current/`. The evidence deliberately
keeps the original shell matrix. The loaded-data continuation is under
`shots/2026-08-09/environment-loaded-current/`: all four screenshots are
1280x480, all four page-error arrays are empty, and both themes retain the
same shell and scroll geometry. Lynx-for-Web now renders real branch, local
server, repository, editor, project-instruction, and notepad content.

The follow-up under
`shots/2026-08-09/environment-local-status-current/` closes the remaining
content-height delta. A dedicated local-only status RPC returns the same +1/−1
working-tree statistics without refreshing remote refs. The fixed external Git
fixture then produces exact 427px content height and 0/10/19 scroll positions
in Web and Lynx-for-Web, in both themes.

`shots/2026-08-09/environment-header-transport-current/` closes a separate
Native precondition defect discovered after the SDK blocker was removed. The
transport notice previously occupied `1158..1268` while the Files/Environment
control cluster occupied `1204..1260`, so the visible Environment center
hit-tested to the reconnecting notice text. The notice now ends at `x=1204`
and the control cluster begins at `x=1204`; the same center resolves to the
Environment icon.

Normal `closeWhenIdle` reconnects also remain `connecting`/`idle` instead of
being mislabeled as failure recovery solely because the manager connected
before. A real socket failure still publishes `reconnecting`.

The current Native loaded-data cell remains incomplete for a narrower reason:
exact-client synthetic touch still does not activate the right-header toggle
after hit testing resolves correctly. The canonical fixture, current bundle,
and thread route are valid; no hidden `initialEnvironmentOpen` data is injected
to bypass that product interaction boundary.
