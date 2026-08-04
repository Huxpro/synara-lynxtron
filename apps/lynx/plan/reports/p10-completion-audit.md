# P10 perceptual fidelity completion audit

Status: in progress

Updated: 2026-08-04

Objective: complete
`apps/lynx/plan/reports/p10-perceptual-fidelity-goal-prompt.md` with a
repeatable Web → Lynx-for-Web → exact-owned Native perceptual convergence
system, current-build evidence, zero unregistered major residuals, and all
final verification gates.

This document is the prompt-to-artifact checklist. A green verifier is evidence
for the cells it validates, not proof that the whole objective is complete.
`PASS` means the current checkout and retained artifacts directly cover the
requirement. `WEAK` means implementation or older evidence exists but the P10
current-build proof is incomplete. `MISSING` means a required deliverable or
gate is not yet present.

## Completion criteria audit

| Requirement | Artifact / evidence | Status | Remaining work |
| --- | --- | --- | --- |
| Residual Atlas is the comparison SSOT | `shots/2026-08-04/p10-perceptual-fidelity/{manifest.json,manifest.js,comparison.html}`; `perceptual-evidence.mjs` | PASS for six canonical states | Expand the SSOT to the final route/theme/size/state matrix. |
| Zero incomplete required cells | strict verifier reports `6 states / 0 incomplete / 0 blocking` | WEAK | The manifest currently declares only six light/1280 states; undeclared required final cells are not counted. |
| Zero P0/P1 residuals | all canonical residuals are fixed or registered; strict verifier blocks open P0/P1 | PASS for measured cells | Measure remaining routes/themes/sizes/states and register/close their residuals. |
| Zero unregistered major visual/behavior differences | canonical residual taxonomy is enforced by the verifier | WEAK | Route-wide and temporal cells have not been imported into the P10 atlas. |
| Typography roles measured in three clients | `tokens.css`, `App.css`, `p10-typography-calibration.md`; canonical Native frames | PASS for landing/sidebar/composer/Settings/pickers | Thread/transcript/status/button/chip roles need current P10 dark/two-size evidence. |
| Surface roles converge in light/dark | canonical Web theme derivation and generated Native light/dark sheets are product-consumed; P7-I4 evidence exists | WEAK | Add `p10-surface-material-contract.md` and current-build P10 dark evidence. |
| Golden controls and required states converge | `useLynxInteractiveState`, product CSS consumers, and P7-I1 runtime evidence cover many primitives | WEAK | Add `p10-optical-controls.md`, a 12–15 primitive inventory, and current-build default/hover/pressed/selected/disabled/focused/loading evidence. |
| Motion contract has static and temporal proof | shared Web disclosure authority, Native 220ms transform/opacity contract, reduced-motion CSS, P7-I4 timing evidence | WEAK | Add `p10-motion-contract.md` and current-build fixed-time sequence evidence. |
| Masks are narrow and justified | P10 canonical cells use center crop for the 32px Native titlebar normalization; no large masks | PASS for canonical cells | Audit final matrix for any additional mask. |
| Intentional platform deltas complete | residual manifest records custom-element measurement and Sidebar status deltas; P7/P9 reports record host gaps | WEAK | Consolidate final route/interaction deltas in P10 reports and manifest. |
| Web baseline does not regress | like-for-like Web authority frames retained in each canonical state | PASS for canonical cells | Re-run route-wide current-build matrix. |
| Native identity/console/state/cleanup | atomic helper, PID-derived `8904/session1`, clean console, frozen snapshot, owned cleanup | PASS for canonical cells | Repeat for final two-size route/theme batches. |
| Production builds, focused tests, audits, heavy pass | focused ACK/Composer and evidence suites pass; Native build passes | WEAK | Final Web/Lynx/Desktop builds, reuse/style checks, `bun fmt`, `bun lint`, and `bun typecheck` remain. |
| All coherent commits pushed | latest canonical close-out `32d83f97` is on origin | PASS so far | Future slices must remain independent and pushed. |
| Local HEAD equals origin, clean tree | true after `32d83f97` | PASS at audit start | Recheck after all remaining slices. |

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
| Sidebar primary row and group label | semantic UI row/supporting/meta variables; canonical Sidebar frames | PASS |
| Route/page title | Settings and landing roles measured | WEAK: Thread/Kanban/PR dark/two-size P10 proof missing |
| Body/transcript | product roles exist; P8 route evidence exists | WEAK |
| Status/meta | product roles exist; picker and Settings measured | WEAK |
| Composer body/placeholder | three-client canonical evidence | PASS |
| Popup title/description/meta | Project Picker and filtered skill evidence | PASS |
| Button/control label | Settings measured | WEAK |
| Chip/token | P9 selected-token evidence exists | WEAK: not imported into P10 |
| Light/dark and both sizes | P8 current-family evidence exists | MISSING from current P10 atlas |

Phase 1 remains in progress.

### Phase 2 — surface material

Current product authority:

- Web semantic tokens in `apps/web/src/tokens.css`;
- generated Native light/dark projection in
  `apps/lynx/src/generated/native-theme-variables.css`;
- canonical consumers for canvas/sidebar/content/elevated/popover/accent/ring/
  separator/status;
- canonical Composer, Settings, picker, and command-menu measurements;
- P7-I4 dark product-consumer evidence.

Missing:

- `p10-surface-material-contract.md`;
- current P10 dark samples for all required surface roles;
- final audit of nested badges/chips/pills and intentional host shadows.

Phase 2 remains in progress.

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

Missing:

- `p10-optical-controls.md`;
- one auditable P10 specimen/state matrix with current-build evidence;
- explicit painted-bound, optical-scale/offset, baseline, and visual-center
  dispositions for all 15 entries.

Phase 3 remains in progress.

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

Missing:

- `p10-motion-contract.md`;
- current-build fixed-time or short-sequence evidence for disclosure,
  popover/menu, hover/pressed, selected, composer height, loading→content,
  Sidebar expansion, collapsed work, focus-ring, and reduced-motion;
- explicit P10 proof that ordinary working/loading state does not retrigger
  transcript auto-follow.

Phase 4 remains in progress.

### Phase 5 — route-wide convergence

| Route/surface | Older current-family proof | P10 current-build proof |
| --- | --- | --- |
| Landing + Sidebar + Composer | P8/P9 | canonical light/1280 only |
| Project Picker / Extras / Command K / skill / mention | P9 | Project Picker + filtered skill only |
| Thread header / transcript / status / collapsed work | P8/P9 | missing |
| Settings | P8 | General light/1280 only |
| Kanban overview/project | P8 | missing |
| Pull Requests list/detail | P8 | missing |

Phase 5 remains in progress.

### Phase 6 — Native certification

The PID-owned atomic helper and canonical six-state batch satisfy the preflight,
identity, dimensions, console, and snapshot requirements for their measured
cells. The P8 two-size route matrix is older than the P10 calibration commits
and cannot certify the final P10 build.

Missing:

- current P10 two-size/light-dark Native route batch;
- Native temporal states;
- final byte-exact owned state restoration record for the complete P10 batch.

Phase 6 remains in progress.

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
- light only;
- 1280×820 only;
- New Chat and Settings General only;
- Project Picker and one filtered skill overlay;
- mostly default/open states.

Phase 7 is missing the majority of its declared cells.

## Verification gates

| Gate | Current result | Final requirement |
| --- | --- | --- |
| P10 strict verifier | 6 states, 0 incomplete, 0 blocking | pass after full declared matrix |
| P10 verifier tests | previously 9/9 | rerun final |
| Native helper tests | 4/4 | rerun final |
| Composer ACK/editor/paste tests | 14/14 | include in final focused set |
| Web production build | prior P10 build identity retained | rerun final |
| Lynx-for-Web production build | prior P10 build identity retained | rerun final |
| Desktop production build | ACK-fix build green | rerun final |
| Reuse audit strict | not run for final P10 | required |
| Style audit strict | not run for final P10 | required |
| React Doctor changed lines | 0 issues for `32d83f97` | rerun for remaining source changes |
| `bun fmt` | not run for final P10 | required once |
| `bun lint` | not run for final P10 | required once |
| `bun typecheck` | not run for final P10 | required once |

## Immediate execution order

1. Write the surface, optical-control, and motion contracts from current
   product owners and identify only real residuals.
2. Extend the P10 manifest schema/state inventory to the required final axes
   before collecting more screenshots, so missing cells are visible.
3. Run a fast Web/Lynx-for-Web route/theme/size matrix and close current-build
   P0/P1 residuals.
4. Capture fixed-time motion and control-state specimens through product
   consumers.
5. Batch exact-owned Native by size, then theme/route/state.
6. Run the final builds, focused tests, strict audits, and one heavy
   `fmt`/`lint`/`typecheck` pass.
7. Re-audit every row above. P10 is complete only when no row remains `WEAK` or
   `MISSING`.
