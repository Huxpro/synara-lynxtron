# P10 perceptual fidelity completion audit

Status: final audit complete

Updated: 2026-08-04

Objective: complete
`apps/lynx/plan/reports/p10-perceptual-fidelity-goal-prompt.md` with a
repeatable Web → Lynx-for-Web → exact-owned Native perceptual convergence
system, current-build evidence, zero unregistered major residuals, and all
final verification gates.

This document is the final prompt-to-artifact checklist. A green verifier is
used only for the requirements it directly validates; completion also depends
on the independent specimen SSOT, production builds, focused tests, audits,
heavy checks, exact-client identity, and cleanup evidence.

## Completion criteria audit

| Requirement | Concrete artifact / result | Status |
| --- | --- | --- |
| Residual Atlas is the comparison SSOT | `shots/2026-08-04/p10-perceptual-fidelity/{manifest.json,manifest.js,comparison.html}`; `perceptual-evidence.mjs` | PASS |
| Final route/theme/size/overlay matrix | 40 declared coordinates represented by 44 explicit states and 132 retained client cells | PASS |
| Zero incomplete required cells | strict perceptual verifier: `44 states / 0 incomplete / 0 blocking` | PASS |
| Zero P0/P1 residuals | verifier blocks open P0/P1; final run reports zero blocking residuals | PASS |
| Zero unregistered major differences | route residuals plus strict 15-control/12-temporal specimen inventory | PASS |
| Typography roles measured in three clients | `p10-typography-calibration.md`; route/overlay matrix; semantic chip specimen | PASS |
| Surface roles converge in light/dark | `p10-surface-material-contract.md`; all route and overlay cells in both themes | PASS |
| Golden controls converge | `specimens/manifest.json`; `optical-metrics.json`; strict `15 controls / 0 incomplete` | PASS |
| Motion has static and temporal proof | `p10-motion-contract.md`; fixed-time runtime sequences; strict `12 temporal / 0 incomplete` | PASS |
| Masks are narrow and justified | only named 32px macOS titlebar normalization; no additional product mask | PASS |
| Intentional platform deltas complete | Project Picker host folders, Native/Lynx mouseenter, host Tab focus, collapsed-work close guardrail | PASS |
| Web baseline does not regress | Web authority retained for every route/overlay coordinate; final Web build passes | PASS |
| Native identity/console/state/cleanup | PID-derived client/session/bundle metadata, empty retained consoles, frozen snapshots, owned cleanup | PASS |
| Production builds | Web 8940 modules; Lynx-for-Web 2685.9kB; Native/Desktop 2583.5kB | PASS |
| Focused tests and strict audits | evidence 21/21, Native helper 4/4, Lynx 39/39, Web 195/195, reuse/style strict pass | PASS |
| Final heavy pass | `bun fmt` completed; `bun lint` 0 errors after harness cleanup; `bun typecheck` 7/7 | PASS |
| React Doctor conditional gate | previous Composer source scan 0 issues; final remaining source diff is CSS/test; current CLI start blocked by npm `EOVERRIDE` and is recorded | NOT APPLICABLE |
| Coherent commits pushed | route, overlay, specimen declaration, and specimen closure commits are on origin | PASS |
| Local HEAD equals origin and worktree clean | checked after the final audit commit | FINALIZATION GATE |

## Prompt phases

### Phase 0 — honest baseline

| Numbered requirement | Evidence | Status |
| --- | --- | --- |
| Six canonical surfaces | P10 manifest IDs: landing, sidebar, composer, project picker, filtered skill menu, Settings General | PASS |
| Same isolated data and three clients | per-state snapshot identity; final filtered state `c3703ba8…` | PASS |
| Screenshot, geometry, resolved style, console, build/snapshot identity | verifier-enforced retained artifacts | PASS |
| Residual schema/taxonomy/severity/owner/disposition | manifest and verifier tests | PASS |
| Overlay/split/geometry/style/residual review | standalone `comparison.html` and generated `manifest.js` | PASS |
| No stale/mismatched/Browser-as-Native evidence | strict client tier, dimensions, state echo, identity checks | PASS |

Phase 0 is complete.

### Phase 1 — typography

| Required role | Current consumer/evidence | Status |
| --- | --- | --- |
| Sidebar primary row and group label | semantic UI row/supporting/meta variables; final route frames | PASS |
| Route/page title | Landing, Thread, Settings, Kanban, and PR in light/dark at both sizes | PASS |
| Body/transcript | current Thread matrix and transcript guardrail suites | PASS |
| Status/meta | picker, Settings, transcript, loading/error/status specimens | PASS |
| Composer body/placeholder | three-client default and input-dependent overlay evidence | PASS |
| Popup title/description/meta | Project Picker, Extras, Command K, skill, and mention matrix | PASS |
| Button/control label | Settings, route actions, menu and command control specimens | PASS |
| Chip/token | current-build semantic mention chip specimen | PASS |
| Light/dark and both sizes | final route and overlay matrix | PASS |

Phase 1 is complete. The final route and overlay matrix covers light/dark and
both sizes; the specimen atlas adds current-build chip, status, loading/error,
button, disabled, selected, and focused dispositions.

### Phase 2 — surface material

Current product authority:

- Web semantic tokens in `apps/web/src/tokens.css`;
- generated Native light/dark projection in
  `apps/lynx/src/generated/native-theme-variables.css`;
- canonical consumers for canvas/sidebar/content/elevated/popover/accent/ring/
  separator/status;
- canonical Composer, Settings, picker, and command-menu measurements;
- P7-I4 dark product-consumer evidence.

Current evidence:

- `p10-surface-material-contract.md` is complete;
- all required surface roles have light/dark current-build route or overlay
  consumers;
- selected/pressed/focus/loading/error/success/empty dispositions are in the
  strict specimen manifest;
- nested semantic chip material is retained;
- host shadows and capability differences are registered.

Phase 2 is complete.

### Phase 3 — optical controls

Required 15 specimens and current product owners:

| Specimen | Product owner | Current state coverage |
| --- | --- | --- |
| Sidebar row | shared Sidebar row + Native interaction adapter | default/selected/hover/pressed/focus source; older runtime proof |
| Segmented control | shared Sidebar segmented picker | selected/hover/pressed/focus source; older runtime proof |
| Icon button | shared Button / feature adapters | default/disabled/hover/pressed/focus source |
| Disclosure + chevron | shared disclosure compositions/platform motion | open/closed/pressed; older timing proof |
| Composer shell | shared Composer input composition | default/focused/disabled/sending |
| Textarea | Native platform island + Web editor | default/focused/composing; P9-D1/P10 canonical proof |
| Project-picker row | shared MenuItem composition | default/highlighted/pressed/focus/disabled |
| Command-menu row | shared command composition | default/active/pressed/focus |
| Switch | Settings shared switches | checked/unchecked/pressed/focus/disabled |
| Checkbox/radio | trait/theme controls | selected/unselected/disabled source proof |
| Tooltip/popover | Menu/popup product consumers | popover proof; generic tooltip has no core-route consumer |
| Chip/token | Composer inline token projection | selected/cleared persisted proof from P9 |
| Status row | transcript/lifecycle/route-state compositions | loading/error/status source proof |
| Empty-state header | landing/shared empty hero | canonical default proof |
| Primary/secondary button | shared Button and route actions | default/disabled/pressed/focus source proof |

Current evidence:

- `p10-optical-controls.md` is complete;
- `specimens/manifest.json` requires all 15 controls and applicable states;
- `optical-metrics.json` records 14×14 painted bounds in a centered 16×16 slot,
  stable 716×28 row centers, semantic chip bounds, and disclosure trajectories;
- focused contracts and real Native runtime cover disabled, selected, pressed,
  token, and platform-delta dispositions.

Phase 3 is complete with zero incomplete specimens.

### Phase 4 — motion

Current product contract:

- Web `disclosureMotion.ts`: 220ms, ease-out, grid/opacity plus optional
  translate, reduced-motion transition-none;
- Native `motion.lynx.css`: 220ms, ease-out, transform/opacity only,
  0.01ms reduced-motion;
- real consumers in Sidebar, transcript collapsed work, model groups, and
  shared disclosure components;
- transcript exit presence is intentionally disabled where list measurement
  could feed back into scroll-follow.

Current evidence:

- `p10-motion-contract.md` is complete;
- fixed-time open/close sequences cover Sidebar disclosure, instant Composer
  menus, collapsed work, and pressed feedback;
- focused tests cover submenu, selected, composer content, loading→content,
  focus-ring source contract, and reduced motion;
- Web auto-follow/timeline 175/175 and Lynx thread-state 5/5 prove ordinary
  working/tool/loading activity does not become a message-arrival follow signal
  or measurement feedback loop.

Phase 4 is complete with zero incomplete temporal specimens.

### Phase 5 — route-wide convergence

| Route/surface | P10 current-build proof |
| --- | --- |
| Landing + Sidebar + Composer | light/dark × 1280/1440 |
| Project Picker / Extras / Command K / skill / mention | light/dark × 1280/1440 |
| Thread header / transcript / status / collapsed work | route matrix + temporal specimens |
| Settings | General route matrix in both themes/sizes |
| Kanban project | route matrix in both themes/sizes |
| Pull Requests | route matrix in both themes/sizes |

Phase 5 is complete.

### Phase 6 — Native certification

The exact-owned P10 Native batches cover both sizes, both themes, all required
routes/overlays, input-dependent skill/mention states, and temporal product
consumers. Every retained cell records the PID-owned client, session, staged
bundle, build and snapshot identity, dimensions, geometry/styles, and empty
warning/error console.

The isolated state directories were removed after owned process shutdown; ports
60442, 9985, 8904, and 9229 are free. User clients on 8901–8903 were untouched.

Phase 6 is complete.

### Phase 7 — final matrix

Required axes:

- clients: Web, Lynx-for-Web, Native;
- themes: light, dark;
- sizes: 1280×820, 1440×900;
- routes: Landing, Thread, Settings, Kanban, Pull Requests;
- overlays: Project Picker, Extras, Command K, skill, mention;
- applicable default/hover/pressed/focused/selected/disabled/loading/error/
  empty states.

Current P10 manifest axes:

- all three clients;
- light and dark;
- 1280×820 and 1440×900;
- Landing, Thread, Settings, project Kanban, and Pull Requests;
- Project Picker, Extras, Command K, skill, and mention overlays;
- default/open/selected plus strict control and temporal state dispositions.

Phase 7 is complete.

## Verification gates

| Gate | Final result |
| --- | --- |
| P10 strict perceptual verifier | 44 states, 0 incomplete, 0 blocking |
| Strict specimen verifier | 15 controls, 12 temporal surfaces, 0 incomplete |
| Verifier tests | perceptual 11/11; specimens 6/6 |
| Native helper tests | 4/4 |
| Lynx focused tests | 10 files, 39/39 |
| Web focused tests | 9 files, 195/195 |
| Transcript guardrails | Web 175/175; Lynx 5/5 |
| Web production build | pass, 8940 modules |
| Lynx-for-Web production build | pass, 2685.9kB |
| Desktop production build | pass, 2583.5kB |
| Desktop Web-only marker gate | `synaraRpc`, Web build id, relay symbols, browser storage marker absent |
| Reuse audit strict | pass; all seven configured screens above baseline |
| Style audit strict | pass, 98.07% weighted coverage |
| React Doctor | conditional tool start failed on npm override; no remaining React component source diff |
| `bun fmt` | command pass on 3371 files; task-unrelated broad churn restored per AGENTS.md |
| `bun lint` | pass after owned harness cleanup, 0 errors |
| `bun typecheck` | pass, 7/7 packages |
| Cleanup | owned ports free, named browser sessions closed, temporary paths removed |

## Final disposition

All prompt phases, named artifacts, required matrix axes, control and temporal
inventories, focused regressions, production builds, strict audits, heavy
commands, identity checks, and cleanup gates have concrete evidence.

Two narrow platform deltas remain intentionally registered rather than hidden:
Native/Lynx mouseenter publication and Native host Tab focus publication.
Collapsed-work immediate close is a deliberate transcript measurement
guardrail. None is an open P0/P1 residual.

The current global formatter check still reports pre-existing formatting drift
across 640 tracked files after the required `bun fmt` command; broad unrelated
formatter churn was restored exactly as required by `AGENTS.md`. This is a
repository baseline fact, not an unverified P10 artifact or product defect.

## 2026-08-07 current-head responsive addendum

The completion result above remains the historical certification for its
recorded commit and artifact set. It is not sufficient by itself to certify
current HEAD: later Settings, Sidebar, overlay, route, motion, and responsive
commits changed product code after that matrix.

Current responsive disposition:

| Requirement | Current-head evidence | Status |
| --- | --- | --- |
| Shared viewport classification and live resize | `responsive-shell-current`, `responsive-web-host-current` | PASS |
| Native Desktop supported sizes | 900/1024/1440 shell, Kanban, PR, Settings, and overlay evidence | PASS |
| Compact shell and route behavior | Settings overlay, PR master-detail, Kanban horizontal owner, landing width | PASS |
| Settings compact collections and controls | all 15 real sections width-clean at 320px; focused Profile, Integrations, Models, General, Appearance evidence | PASS |
| Very short implemented Settings surfaces | all 15 sections retain vertical reachability at 320x200 | PASS |
| Very short landing/transcript behavior | landing scroll owner; Transcript certified at 280px with 200px physical-budget boundary | PASS WITH BOUNDARY |
| Implemented generic overlays | Menu clamp plus Search command and Composer model proof at Desktop minimum | PASS |
| Sidebar shell/seam ownership | current Lynx-for-Web and exact-owned Native: 256px sidebar, 244px primary rows, 240px footer row, zero sidebar border | PASS |
| Settings sidebar seam ownership | real Settings navigation: 256px sidebar, 244px Back/Search rails, 236px search shell, zero sidebar border | PASS |
| Raised content-card seam material | ordinary routes and Settings: 14.4px left radii, theme-aware inset edge/depth, square compact/closed states | PASS |
| Sidebar top material | ordinary and Settings sidebars share the calibrated 1px light/dark inset highlight | PASS |
| Dark shell base fill | Electron vibrancy RGB 6–7 versus Native canonical opaque #101010/#111111 | INTENTIONAL HOST MATERIAL DELTA |
| Environment | reachable current-head consumer; paired light/dark Browser geometry/material proof at 900x650 | PASS IN BROWSER; NATIVE CURRENT-HEAD SCREENCAST NOT CERTIFIED |
| Environment Git actions | stable menu, selectable-file/new-branch commits, safe pull, streamed live progress, metadata sync, confirmation, and paired themes | PASS |
| Kanban task creation | overview header, per-project overview action, project header, and Draft-column action open a compact Lynx-native task dialog with Web's `Send as draft` switch and `Create task` action; draft mode persists a typed `thread.create` plus composer draft, immediate mode additionally dispatches typed `thread.turn.start`, and provider failure preserves the real Draft card | PASS — CURRENT PRODUCT SURFACES |
| Kanban icon identity | route Back, overview project disclosure, and all New task entry points use generated Arrow/Chevron/Plus SVGs; Draft/In Progress/Done status marks reproduce Web's exact 14×14 paths; card pin/worktree/fork/attachment/PR metadata use the same filled-pin, split-arrow, fork, paperclip, and shared PR-state assets as Web instead of text approximations | PASS — CURRENT PRODUCT SURFACES |
| Composer voice capability | Lynx has no microphone-capture host bridge; current head follows Web's capability gate by omitting the unavailable control instead of rendering a permanently disabled fake microphone. The historical 28×28 disabled-control evidence remains provenance for the superseded implementation, not current-head UI | PASS — HONEST HOST BOUNDARY |
| Composer model-picker icon identity | model status, provider Back, collapsible-group disclosure, selected-model, Fast mode trigger/toggle, and Favorite affordances use generated/Central Settings, Arrow, Chevron, Check, outline/filled Zap, and outline/filled Star icons instead of Unicode approximations while retaining the existing 14px/12px geometry | PASS — CURRENT PRODUCT SURFACES |
| Composer reference icon identity | assistant/file-comment summaries, pasted-text cards, generic file cards, remove actions, and show-in-field disclosure use MessageCircle, File/FileEntry, X, and ChevronRight icons instead of circle/cross/text-block glyphs | PASS — CURRENT PRODUCT SURFACES |
| Shared Menu icon identity | default checkbox/radio indicators and submenu affordances use generated 12px Check and 14px ChevronRight icons, removing Unicode state glyphs from every Menu consumer | PASS — SHARED PRIMITIVE |
| Environment disclosure motion | Project instructions, Pinned, Markers, and Notepad share one ChevronRight header and the canonical 220ms presence/content motion with reduced-motion behavior; four bespoke instant-unmount/180-degree implementations were removed | PASS — CURRENT PRODUCT SURFACES |
| Collapsed-work disclosure | transcript collapsed-work uses the shared rotating ChevronRight identity and 220ms class contract while intentionally retaining `preserveOnClose: false` so live transcript measurement never observes an animated intermediate height | PASS — TRANSCRIPT GUARDRAIL PRESERVED |
| Composer selection icon identity | model trait and project picker selected states use the same generated 12px Check identity as shared Menu rows instead of font-dependent checkmarks | PASS — CURRENT PRODUCT SURFACES |
| Diff / Explorer docks and source actions | working-tree Diff Dock and filesystem-backed Explorer are reachable; Explorer covers tree/search, rich source/Markdown/image/PDF fallback, whole-file references, ask-why, and accessible per-line local comments that persist and serialize into the shared composer contract | PASS — CURRENT PRODUCT SURFACES |
| Pull Request Timeline / Code | selected PR detail exposes Summary/Timeline/Code; Timeline projects real detail commits/comments, while Code fetches typed `pullRequests.diff` data on demand and covers portable files, line numbers, loading/error/retry/truncation/expand states | PASS — CURRENT PRODUCT SURFACES |
| Pull Request comments | Summary exposes a Lynx-native GitHub comment composer backed by typed `pullRequests.comment`; it enforces the shared 65,536-character contract, preserves drafts on failure, prevents rapid duplicate submission, handles Enter/Shift+Enter/IME correctly, and revalidates detail/list data after settled mutations | PASS — CURRENT PRODUCT SURFACES |
| Pull Request row icon identity | open/draft/conflicting/merged/closed rows resolve through the shared PR-state presentation and render the matching Central assets; pin controls use Web's outline/filled pin rule instead of Unicode circles | PASS — CURRENT PRODUCT SURFACES |
| Pull Request Summary disclosure | Description, Checks, and Comments reuse the shared 220ms ease-out presence/content motion plus rotating 14px ChevronRight identity, including reduced-motion behavior, instead of instant unmounting and text chevrons | PASS — CURRENT PRODUCT SURFACES |
| Native arbitrary range selection | whole-message transcript references and source line comments are complete; arbitrary DOM-style text range selection still requires a host/engine selection kernel | PARTIAL — EXPLICIT HOST/ENGINE GAP |
| Current-head full three-client route/theme/size/state matrix | historical P10 matrix predates later product commits | NOT RE-CERTIFIED |

The Kanban New task slice is covered by focused renderer/state tests, canonical
command construction, draft-card projection, both production bundles, and a
changed-plus-untracked React Doctor scan. A light/dark Lynx-for-Web capture was
attempted against an isolated canonical project created through
`orchestration.dispatchCommand`, but the browser relay later failed bootstrap
reconnection while the raw typed WebSocket client and server stayed healthy.
The harness run was invalidated, its empty evidence directory and isolated
state were removed, and no screenshot claim is made for this slice.

Evidence for the final Settings sweep:
`shots/2026-08-07/responsive-settings-completion-audit/`.
The previously registered one-pixel Sidebar row/separator boundary is now
closed by `shots/2026-08-07/sidebar-seam-current/`: it was an authored border
owner mismatch, not unavoidable engine rounding.
The same private Settings-sidebar owner is closed by
`shots/2026-08-07/settings-sidebar-seam-current/`.
`shots/2026-08-07/sidebar-separator-downstream-audit/` confirms the two
dependent historical residuals also close without local patches: primary rows
are 244px and the real Native Project Sort popup returns from x=41 to the
Electron-authority x=42 while retaining its exact 176x192 geometry.
`shots/2026-08-07/chat-content-seam-current/` then restores the Web raised-card
material that the duplicate borders had previously obscured, with direct
light/dark and open/closed/compact proof.
Its changed-lines React Doctor rerun against parent `9ace2adc` reports zero
errors and zero warnings; the commit hook's generic warning was not a product
diagnostic.
`shots/2026-08-07/sidebar-top-highlight-current/` connects the previously
unused sidebar material projection and records the Native dark variable
inheritance failure plus its direct-value correction.
`shots/2026-08-07/dark-shell-material-boundary/` records why the remaining
large-area dark fill difference cannot be closed by copying one Electron
backdrop sample into the canonical cross-host theme.
`shots/2026-08-08/current-head-landing-light-1280/` then re-establishes a
clean current-head same-origin New Chat Browser pair after the connection
preflight work. Landing title, hero, and Composer common anchors remain within
0.75px, so no focal-composition offset was added. The audit instead found and
closed a real Chats disclosure anatomy mismatch: Lynx had preserved the label
x-position by combining a 10px root inset with 4px left-only button padding,
but its hover/focus hitbox was only 236px. Web, Lynx-for-Web, and exact-owned
Native now resolve the shared hitbox to x=6/244x28 with the label still at
x=14. The 48px Browser fallback header versus certified 46px Native/Electron
hidden-titlebar chrome remains a named host-presentation boundary, not a local
row offset.
`shots/2026-08-08/sidebar-projects-rhythm-current/` closes the next dependent
Sidebar residual without compensating offsets. Lynx now maps Web's complete
vertical section anatomy: primary navigation has no private bottom margin,
Projects/Studio roots own 6px padding, the empty state resolves to 12px/18px
with 16px top padding, and Chats owns 4px/8px vertical padding. Web and
Lynx-for-Web Projects root/header/state/Chats boxes match exactly; exact-owned
Native preserves the same 4px header-to-state, 10px state-to-Chats, and 86px
Projects-to-Chats distances. A concurrent t3code client on 8901 was rejected by
the PID-derived target gate during an intermediate valid capture; the owned
Synara client was 8902/session 1. Final retained Native evidence additionally
keeps the collapsed 4px disclosure body shell with zero children, matching the
44px Web Chats root rather than only matching its 28px button.
`shots/2026-08-08/composer-permission-icon-current/` closes a remaining
high-salience Composer icon approximation. Lynx no longer renders Unicode
diamonds for runtime permissions; it imports Web's canonical
`shield-access.svg` through the shared central-icon alias and existing
theme-aware SVG pipeline. Web and Lynx-for-Web now share the exact 14x14 shield
box and trigger-relative coordinates, while exact-owned Native confirms the
canonical path and light accent paint with an empty console.
`shots/2026-08-08/composer-runtime-chevron-current/` removes the adjacent
Unicode chevron approximation. Lynx now consumes its existing generated Tabler
`chevron-down` SVG, preserving Web's exact 12x12 box, trigger-relative
coordinates, opacity, and permission color. Exact-owned Native confirms the
canonical path and absence of `⌄` text with an empty console.
`shots/2026-08-08/sidebar-chats-chevron-current/` replaces the Sidebar Chats
text `›` with the shared Tabler icon family. Real Native touch also exposed an
engine boundary: Lynxtron rotates SVGs around their top-left origin and ignores
both keyword and percentage center origins, producing a 14px open-state jump.
The final Native adapter therefore swaps right/down SVG states in one stable
14x14 box, while Web retains its 220ms rotation. Closed/open Native evidence
shows identical coordinates, canonical paths, real `aria-expanded` transition,
and empty consoles.
`shots/2026-08-08/sidebar-pull-request-icon-current/` fixes an incorrect host
mapping rather than a stylistic approximation. Lynx had supplied a chat bubble
where Web passes `IoIosGitCompare`. The new narrow adapter reproduces the exact
locally installed 512-viewBox path, with Web/Lynx-for-Web identical 15x15
geometry and exact-owned Native parent, paint, identity, and console proof.
`shots/2026-08-08/composer-project-folder-current/` closes the landing
project-picker icon source residual. Geometry was already converged; Lynx now
imports Web's exact Central `folder-2.svg` instead of a generic Tabler folder.
Browser trigger/icon geometry remains exact and Native confirms the canonical
paths, stable tray anatomy, identity, and empty console.
`shots/2026-08-08/dark-composer-material-current/` re-establishes dark
current-head Composer material after the icon slices. Lynx now uses Web's dark
Composer shadow, 10px runtime trigger radius, and secondary foreground for the
shared folder SVG. Exact-owned Native proves the dark root, shadow, folder
paint, identity, and empty console; Native radius is intentionally not claimed
because the current DevTool reports `0px` for that compound view.

Therefore current HEAD must not be described as globally P10-complete solely
from the historical green verifier. Implemented responsive UI surfaces are
closed, but a new complete three-client certification is still required after
the remaining product/platform scope is explicitly resolved. Environment,
Diff, Explorer, whole-file actions, and source line comments now have real
consumers, and Pull Request Summary now has a real typed GitHub comment
mutation path with failure recovery. Arbitrary text-range selection and in-app
Native PDF rendering must still not be hidden with responsive CSS or counted
as passing runtime evidence.
