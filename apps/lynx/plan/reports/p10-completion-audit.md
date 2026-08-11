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
| Environment row interaction | Changes/retry, commit-file selection, Editor view, and pull-request external rows share one interactive-state owner; current-head real Git evidence verifies exact Changes/Editor geometry and neutral hover material | PASS — CURRENT-HEAD BROWSER EVIDENCE |
| Kanban task creation | overview header, per-project overview action, project header, and Draft-column action open a compact Lynx-native task dialog with Web's `Send as draft` switch and `Create task` action; draft mode persists a typed `thread.create` plus composer draft, immediate mode additionally dispatches typed `thread.turn.start`, and provider failure preserves the real Draft card | PASS — CURRENT PRODUCT SURFACES |
| Kanban icon identity | route Back, overview project disclosure, and all New task entry points use generated Arrow/Chevron/Plus SVGs; Draft/In Progress/Done status marks reproduce Web's exact 14×14 paths; card pin/worktree/fork/attachment/PR metadata use the same filled-pin, split-arrow, fork, paperclip, and shared PR-state assets as Web instead of text approximations | PASS — CURRENT PRODUCT SURFACES |
| Composer voice capability | Lynx has no microphone-capture host bridge; current head follows Web's capability gate by omitting the unavailable control instead of rendering a permanently disabled fake microphone. The historical 28×28 disabled-control evidence remains provenance for the superseded implementation, not current-head UI | PASS — HONEST HOST BOUNDARY |
| Composer model-picker icon identity | model status, provider Back, collapsible-group disclosure, selected-model, Fast mode trigger/toggle, and Favorite affordances use generated/Central Settings, Arrow, Chevron, Check, outline/filled Zap, and outline/filled Star icons instead of Unicode approximations while retaining the existing 14px/12px geometry | PASS — CURRENT PRODUCT SURFACES |
| Composer model-group disclosure | collapsible provider groups use one shared rotating 12px ChevronRight identity, named expanded/collapsed state, the canonical 220ms presence/content motion, and Web's inset three-column header anatomy with 80% resting/75% expanded label tone, exact 4% foreground hover without an extra focus ring, and a 6% foreground count pill in both themes instead of swapping SVGs, mounting rows immediately, or flattening the header states/alignment | PASS — CURRENT PRODUCT IMPLEMENTATION; VISUAL RE-CERTIFICATION PENDING |
| Composer reference icon identity | assistant/file-comment summaries, pasted-text cards, generic file cards, remove actions, and show-in-field disclosure use MessageCircle, File/FileEntry, X, and ChevronRight icons instead of circle/cross/text-block glyphs | PASS — CURRENT PRODUCT SURFACES |
| Composer and Markdown token identity | mention, agent, skill, slash-command, terminal-context, link chips, and openable Markdown file references use extension-aware file, Robot, Building Blocks, Clock, Console, GitHub/favicon/Globe, and file-type SVG identities in canonical segment rendering and the Native draft/transcript projections; Markdown no longer falls back to `@`, `◆`, `/`, `›`, or `↗` text glyphs. Composer and sent-message tokens now share Web's transparent info-colored mention/skill/slash/link treatment, per-agent soft color pills, and zero-outer-margin 4px bordered terminal attachment with a 14px/85% Console icon instead of filling every token with the brand accent or treating attachment tokens as ordinary inline chips | PASS — CURRENT PRODUCT IMPLEMENTATION; VISUAL RE-CERTIFICATION PENDING |
| Composer sending-state identity | the primary action uses Web's exact foreground/background-surface prominent-button colors, 28px Send/Sending circle, desktop 26px Stop circle, and 14-viewBox, 12px animated partial-circle spinner instead of primary-token approximations, one-size-fits-all geometry, or a static `•••` marker; send and stop retain their canonical arrow and square identities | PASS — CURRENT PRODUCT IMPLEMENTATION; VISUAL RE-CERTIFICATION PENDING |
| Composer draft-image attachments | the Native picker now classifies `image/*` capabilities, applies the shared 10MB image limit, asks the host for a bounded decoded preview, persists the token-backed draft with an explicit non-persisted warning, supports preview/remove, stages the original bytes as a managed `image` attachment, and releases the picked capability after remove or successful send; the thumbnail retains Web's 64px elevated-secondary anatomy and exact 20px amber CircleAlert badge with the canonical `Draft attachment may not persist` accessible name; expanded preview now matches Web's 75% backdrop, bordered 8px elevated frame, 24px close action, 36px previous/next actions, filename/count caption, circular navigation, and Escape/arrow-key behavior instead of a static black panel | IMPLEMENTED — REAL CONSUMER PATH; NATIVE INTERACTION RE-CERTIFICATION BLOCKED BY DEVTOOL PORT OWNERSHIP |
| Nested image accessibility | Profile avatars, Explorer image previews, and Composer image thumbnails explicitly remain decorative because their identity is already owned by surrounding text or a named preview control, preventing duplicate or unnamed accessibility nodes | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Profile composite semantics | Profile stat tiles, insight definition rows, plugin usage rows, and model usage rows expose one concise static Native name per visual composite with text traits, avoiding fragmented label/value/icon traversal without inventing unsupported list roles | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Form control accessibility | Kanban task mutation, Git commit message, Integration connection name, and provider credential inputs expose explicit native accessible names; pending Git/Kanban fields retain read-only semantics without invalid DOM-only focus props | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Form error semantics | Kanban mutation, Git commit message, and custom-model slug inputs expose dynamic `aria-invalid` state whenever their adjacent retained error message is present | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Error announcement semantics | retained Kanban mutation, Git action, and custom-model errors are Native accessibility alerts in addition to marking their owning inputs invalid | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Settings load failure announcements | retained Profile, Worktrees, Skills, and Archived query failures are Native accessibility alerts while their initial loading states remain non-assertive | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Settings retry alert ownership | Profile, Worktrees, and Archived load alerts live on error text nodes rather than action-containing containers, preserving Retry buttons as separate reachable Native controls | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Settings mutation notice announcements | Advanced, Integrations, Provider Tools, Worktrees, Skills, and Archived retained mutation failures are Native alerts; successful repair/copy confirmations remain non-assertive through explicit notice intent | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Profile dialog feedback semantics | image-picker and share/export failures are Native alerts, while copied/saved/cancelled outcomes retain explicit success/neutral intent and remain non-assertive | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Profile avatar color selection | each named color-swatch button exposes Selected/Not selected Native accessibility value without replacing its actionable button trait | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Appearance segmented selection | theme and density segment buttons project Native radio role plus selected state through Lynx UI `buttonProps` in addition to Web `role`/`aria-checked`, matching the visible active segment | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Shared Menu selection semantics | radio, checkbox, and switch menu items publish Web menuitem roles plus Native selected/checked role, state, and value on the existing focus/activation owner instead of exposing only a visual checkmark or track | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Shared Button disabled semantics | the Lynx Button wrapper publishes Native disabled state for disabled actions and merges it with existing selected-state metadata while preserving upstream inert-tap behavior | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Shared Button element semantics | visible-text and icon actions are Native button elements/traits by default; explicit `accessibility-element: false` remains authoritative for nested visual-only Buttons | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Settings switch semantics | General, Appearance, Provider Picker, and Theme Pack custom switches expose Native switch role plus checked/disabled state on their existing interaction owner instead of presenting only as generic buttons with On/Off text | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Integration project selection | project-scope choices expose Native checkbox role and checked state on the existing named interaction owner, matching the visual checkbox and Selected/Not selected value | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Provider Usage meter semantics | each painted remaining-usage track exposes one named static Native text element and percentage value while retaining Web numeric ARIA, without claiming an unsupported Native progressbar contract | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Keyboard-input accessible names | the shared `Input` keyboard-event branch forwards normalized Web/native labels to its raw Lynx input, preserving Settings sidebar and shortcut-search names instead of dropping them during the platform split | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Shared Input invalid semantics | the shared `Input` forwards `aria-invalid` through both its raw keyboard and Lynx UI input branches instead of using the state only for wrapper styling | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Named native input routing | `nativeInput` now selects the metadata-preserving raw branch; all named Settings/Profile/Theme Pack fields use it, including disabled Provider Tool fields with explicit Native disabled state | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Appearance select trigger name | the Appearance select field name is owned by the actionable `MenuTrigger` as well as its nested Web button, preventing an unnamed outer Native menu control | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Settings select interaction ownership | General, Git writing-model, Appearance, and Custom Model selects keep the named `MenuTrigger` as the sole Native control while nested Button-shaped visuals are explicit non-accessibility elements | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Settings navigation state | active navigation controls match Web `aria-current="page"` and publish Native selected/disabled state plus the existing Current section value on the same interaction owner | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Settings disclosure values | Integration advanced-permissions joins Release History and recovery disclosures in publishing Expanded/Collapsed Native accessibility value while retaining Web `aria-expanded`, without inventing an unestablished Native expanded-state shape | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Unavailable Settings search | the inert search placeholder exposes a named, disabled Native search element while remaining unfocusable and non-actionable | PASS — HONEST CAPABILITY STATE |
| Shared dialog title semantics | the shared Lynx `DialogTitle` renders as an explicit Native header, covering Settings Profile edit/share and Release History plus other product dialogs without per-dialog duplication | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Shared dialog close names | default and custom dialog close affordances use the shared interaction owner with explicit Native names, preserving dismiss and exact-trigger focus restoration instead of naming only a nested icon | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Shared dialog trigger names | dialog triggers use the shared interaction owner with explicit Native names, disabled behavior, open activation, and exact-selector focus restoration instead of relying on an upstream wrapper that drops accessibility metadata | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Theme Pack dialog interaction ownership | the Import affordance applies shared Button visual classes directly to its one named `DialogTrigger`, and the close icon remains decorative beneath its one named `DialogClose`, eliminating nested duplicate controls | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Theme Pack code-theme ownership | the named code-theme `MenuTrigger` is the sole Native control while its palette-preview Button-shaped child is an explicit non-accessibility element | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Theme Pack color reset names | optional icon-only Accent/Background/Foreground reset buttons use Web's field-specific `Reset <color field>` accessible name | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Theme Pack import validation | retained parser failures mark the share-string textarea invalid and announce as Native alerts; editing clears both the message and invalid state | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Appearance font autocomplete ownership | the native font input remains the sole named/focusable control while a passive `MenuTrigger` provides popup anchoring without accessibility or tap ownership | PASS — CURRENT PRODUCT IMPLEMENTATION |
| AppSnap capability switch semantics | the unavailable AppSnap placeholder remains inert and unfocusable while exposing Native switch role plus explicit off/disabled state | PASS — HONEST CAPABILITY STATE |
| Provider Usage line semantics | label/value/subtitle usage rows expose one concise static Native text element per Web conceptual item while meter tracks remain independent quantitative elements | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Provider Usage header semantics | each provider card header exposes one static Native provider identity plus optional plan/auth status reading unit instead of disconnected icon/name/status fragments | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Provider Usage warning ownership | usage warning rows own the real warning detail as one static Native text element while the nested alert icon remains decorative, matching Web's hidden-icon ownership | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Settings empty-state reading units | Archived, Skills, and Integrations title/description empty states expose one concise static Native text element per conceptual row/card instead of fragmented title and description nodes | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Settings heading semantics | one Native heading primitive preserves every current Web Settings h1/h2/h3 counterpart across generic panels, private Appearance/General/Git/provider layouts, Profile identity and sections, Provider Usage, and Theme Pack titles instead of leaving them as undifferentiated text | PASS — CURRENT PRODUCT IMPLEMENTATION |
| Shared interactive names | high-frequency Composer, Kanban, and Pull Request controls route labels and selected/expanded/on-off state through `useLynxInteractiveState`, so Native accessibility metadata no longer depends only on Web `aria-label` attributes | PASS — SHARED NATIVE ACCESSIBILITY CONTRACT |
| Actionable primitive semantics | `useLynxInteractiveState` now exposes every actionable control as a Native accessibility button even when its name is derived from visible text; passive hover owners remain excluded and explicit `accessibilityElement: false` remains authoritative | PASS — SHARED NATIVE ACCESSIBILITY PRIMITIVE |
| Empty-thread context semantics | project and environment mode are static draft metadata; a branch chip renders only for a real snapshot branch; Temporary remains the tray's sole pressed-state action | PASS — CURRENT-HEAD BROWSER EVIDENCE |
| Shared Menu icon identity | default checkbox/radio indicators and submenu affordances use generated 12px Check and 14px ChevronRight icons, removing Unicode state glyphs from every Menu consumer | PASS — SHARED PRIMITIVE |
| Sidebar completed-status identity | completed threads use Web's filled `circle-check` Central asset at the canonical 15px trailing role instead of a hand-built green dot plus text checkmark | PASS — CURRENT PRODUCT SURFACES |
| Sidebar thread metadata identity | fork, handoff, worktree, and automation badges use the canonical 12px Fork, GitBranch, split-arrow, and Clock assets instead of Unicode approximations | PASS — CURRENT PRODUCT SURFACES |
| Environment disclosure motion | Project instructions, Pinned, Markers, and Notepad share one ChevronRight header and the canonical 220ms presence/content motion with reduced-motion behavior; four bespoke instant-unmount/180-degree implementations were removed | PASS — CURRENT PRODUCT SURFACES |
| Settings Release History disclosure | each release entry owns stable hook state, shared 220ms ChevronRight/content motion, expanded/collapsed accessibility value, and keyboard/focus/pressed interaction; current-head paired evidence additionally confirms exact dialog, trigger, feature-row, and nested 4px/8px copy rhythm | PASS — CURRENT-HEAD BROWSER EVIDENCE |
| Collapsed-work disclosure | transcript collapsed-work uses the shared rotating ChevronRight identity and 220ms class contract while intentionally retaining `preserveOnClose: false` so live transcript measurement never observes an animated intermediate height | PASS — TRANSCRIPT GUARDRAIL PRESERVED |
| Transcript work-row identity | error/thinking/info/tool rows use Web's CircleAlert, Robot, Check, and Zap identities at the 13px status role instead of punctuation and text glyphs; transcript row/version/scroll behavior is unchanged | PASS — CURRENT PRODUCT SURFACES |
| Composer selection icon identity | model trait and project picker selected states use the same generated 12px Check identity as shared Menu rows instead of font-dependent checkmarks | PASS — CURRENT PRODUCT SURFACES |
| Diff / Explorer docks and source actions | working-tree Diff Dock and filesystem-backed Explorer are reachable; Explorer covers tree/search, rich source/Markdown/image/PDF fallback, whole-file references, ask-why, and accessible per-line local comments that persist and serialize into the shared composer contract; the line-number hover/focus affordance uses Web's 14px Plus SVG in its 16px action box instead of a font-dependent `+` glyph | PASS — CURRENT PRODUCT SURFACES |
| Explorer directory disclosure | recursive directory rows keep parent-owned cached listings through the canonical 220ms closing motion, expose named expanded/collapsed state, reuse the shared rotating ChevronRight, and match Web's 28px row, 6px gap/radius, 12px depth step, 75% icon, 78% resting file labels, 80%/500 directory labels, and distinct hover/selection neutral surfaces instead of instantly removing children or flattening the file/directory hierarchy | PASS — CURRENT PRODUCT IMPLEMENTATION; VISUAL RE-CERTIFICATION PENDING |
| Pull Request Timeline / Code | selected PR detail exposes one named Summary/Timeline/Code action group with selected state, and visible capability copy uses the standard PR meta role instead of a 10px platform note; Timeline projects real detail commits/comments with the shared PR body/meta typography roles instead of compressed fixed 12/10px copy, while Code fetches typed `pullRequests.diff` data on demand and covers portable files, line numbers, loading/error/retry/truncation/expand states | PASS — CURRENT PRODUCT SURFACES |
| Pull Request comments | Summary exposes a Lynx-native GitHub comment composer backed by typed `pullRequests.comment`; it enforces the shared 65,536-character contract, preserves drafts on failure, prevents rapid duplicate submission, handles Enter/Shift+Enter/IME correctly, and revalidates detail/list data after settled mutations; when the capability is disabled the shared composition silently omits the composer like Web instead of adding a runtime-specific unavailable row | PASS — CURRENT PRODUCT SURFACES |
| Pull Request row icon identity | open/draft/conflicting/merged/closed rows resolve through the shared PR-state presentation and render the matching Central assets; pin controls use Web's outline/filled pin rule instead of Unicode circles | PASS — CURRENT PRODUCT SURFACES |
| Pull Request Summary anatomy | Description, Checks, and Comments reuse the shared 220ms ease-out presence/content motion plus rotating 14px ChevronRight identity, including reduced-motion behavior, instead of instant unmounting and text chevrons; section titles/counts use Web's PR section/meta typography roles instead of ordinary UI copy; branch, merge, reviewers, comments, and checks meta rows use Web's GitBranch, merge-conflict, user-group, chat-bubble, and proportional four-bucket checks-ring identities; individual check rows use matching success/failure/pending/neutral status glyphs and open their real check URL when available; pending glyphs and ring segments use the canonical light/dark warning projection without importing the full theme-variable generator into the UI bundle; branch names and semantic diff stats retain separate roles; intro/comment actors use the standard PR meta text role while reviewer labels use fine print, all sharing a 16px avatar/login identity with image-error initials and canonical `ghost` fallback; description and comment Markdown receive the PR workspace root so local file references stay openable; comment cards add relative time plus per-comment disclosure, keep the newest two expanded, parse structured finding title/severity/body, and expose a Reply action to the comment or PR GitHub URL | PASS — CURRENT PRODUCT SURFACES |
| Pull Request Code disclosure | portable diff file headers expose named expanded/collapsed state and use the shared ChevronRight identity; Web and Lynx file bodies stay on the canonical 220ms disclosure path, while Lynx matches Web's 12px stack rhythm and copy hierarchy, 8×12 header anatomy, exact muted/35 header and muted/60 hunk surfaces in both themes, 12px stats/notices/show-more rows, 20px diff lines, 40/40/20 number/prefix columns, and semantic success/destructive 10% row tints instead of instant conditional mount, `▸/▾` text glyphs, compressed typography/columns, or coarse generic surfaces | PASS — SHARED PRODUCT COMPOSITION; VISUAL RE-CERTIFICATION PENDING |
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
The subsequent Composer token identity slice removes the remaining `@`, `◆`,
`›`, and `↗` stand-ins from editable token chips. Canonical mention segments
and Native projected mention anchors both resolve through `FileEntryIcon`
(including the path encoded in the projection key); agent, skill, slash-command,
terminal, and link tokens use the Central Robot, Building Blocks, Clock,
Console, and generated Tabler External Link assets. A later anatomy audit
against Web's `composerInlineChip` source of truth also removes the generic
brand-accent fill: mention, skill, slash-command, and link tokens are plain
info-colored inline content; agents use their shared per-agent soft color; and
terminal contexts retain the bordered attachment treatment. Focused
token/projection tests and production builds are implementation evidence, not
a replacement for the pending current-head visual matrix.
The next Composer state slice aligns the primary action's transient sending
state with Web's exact 14-viewBox partial-circle spinner, rendered at 12px with
the existing shared `animate-spin` utility. It replaces the static `•••` text
stand-in without changing disabled or activation semantics. A later anatomy
audit corrects the whole prominent control from the nearby `primary` pair to
Web's exact `color-text-foreground` / `color-background-surface` pair across
send, sending, and stop states. Focused adapter tests and production builds
remain implementation evidence; visual re-certification is still part of the
pending current-head matrix.
The attachment warning follow-up replaces the remaining bare `!` overlay on
non-persisted Composer images with Web's 20px surface-backed, shadowed amber
CircleAlert badge and canonical accessible name. The nested warning remains
non-interactive, so image preview and remove activation paths are unchanged.
Focused renderer/interaction tests, both production builds, `git diff
--check`, and React Doctor 0.9.11 against `8871eb92` pass with zero
diagnostics; this remains implementation evidence pending the full visual
matrix.
The Pull Request Code follow-up fixes the remaining shared diff-file disclosure
that bypassed the repository-wide toggle contract. Both Web and Lynx now use
the shared ChevronRight identity, named `aria-expanded` state, and canonical
220ms disclosure wrappers; Lynx preserves closing content through the existing
presence helper. Diff parsing, visible-line pagination, and route-owned
expanded keys are unchanged. Focused Lynx capability/disclosure tests and Web
diff-logic tests pass (6 assertions total), both production bundles build,
`git diff --check` passes, and React Doctor 0.9.11 reports zero diagnostics for
both `apps/lynx` and `apps/web` against `f7398e67`. Visual re-certification
remains part of the pending current-head matrix.
The Composer model-group follow-up closes the same motion-contract gap on the
high-frequency model picker. Lynx now keeps one 12px ChevronRight in the shared
220ms rotation class, preserves group rows through the closing animation, and
exposes named expanded/collapsed accessibility state. Model selection,
favourites, cost metadata, and popup ownership are unchanged. The focused
model-picker contract test, both production builds, `git diff --check`, and
React Doctor 0.9.11 against `bfe6ba38` pass with zero diagnostics; current-head
visual re-certification remains pending.
The Settings Advanced Release History follow-up moves each changelog row into a
stable entry component so its presence hook is legal and deterministic. Rows
now use the shared 220ms ChevronRight/content motion and shared interactive
state for keyboard activation plus hover, pressed, focus, and named
expanded/collapsed feedback; changelog ordering and the single-expanded-entry
state remain unchanged. Advanced focused tests pass (3/3), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
new diagnostics against `2f12c0a9`. Visual re-certification remains part of
the pending current-head matrix.
`shots/2026-08-10/settings-release-history-rhythm-current/` adds current-head
paired runtime evidence and closes a later measured 20px content-height
residual. The dialog and trigger were already exact, but each of five features
was 4px too tall because Lynx used an 8px title-description gap where Web
groups that copy at 4px before the outer 8px details gap. A named
`SettingsAdvancedReleaseFeatureCopy` owner now reproduces that nested rhythm.
Web and Lynx-for-Web match exactly at `478x941.75` for the expanded content and
at every feature-row origin/height. Real rendered taps also confirm exit
content remains present at 120ms and unmounts after the 220ms transition plus
cleanup buffer. The current served bundle hash matched `dist/web`, the
three-client preflight shared server instance/snapshot, both PNGs are
`1280x820`, page-error files are empty, and the named browser session was
closed.
The adjacent release-note emphasis contract now also mirrors Web's explicit
`text-muted-foreground/85` details role instead of applying `0.8` opacity.
This is covered by the focused source contract and both production builds; a
fresh dark Web comparison was rejected after the browser harness repeatedly
navigated to `about:blank`, so no runtime dark-cell claim is attached to this
single-property follow-up.
The release-row chevron now also passes the shared 14px anatomy directly to
the generated icon instead of letting an inline 16px size override its CSS
slot. Current Lynx-for-Web runtime measurement keeps the trigger at
`478x44`, resolves the chevron to `14x14`, moves the identity start to the
Web-authoritative x=427, and preserves the 90-degree open transform.
The Explorer tree follow-up aligns Native directory expansion with Web's
`CollapsiblePanel` behavior. Each recursive entry is now a stable component
with shared 220ms ChevronRight/content motion and explicit `aria-expanded`;
parent-owned directory listings remain cached while closing presence only
controls render lifetime, so no fetch, selected-path, search, or error-state
semantics change. The focused Explorer suite passes (2/2), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `4924448c`. Visual re-certification remains part of the
pending current-head matrix.
The Environment interaction follow-up connects row CSS states to real shared
interaction behavior. Changes/retry, commit-file include/exclude, Editor view,
and pull-request external-link rows now use one `EnvironmentInteractiveRow`
owner for tap, Enter/Space, hover, pressed, focus, disabled, and checked
semantics. Existing polling, retry, file-selection, editor-view, and external
URL actions are unchanged. The focused Environment suite passes (6/6), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero new diagnostics against `e3e026e6`. Visual re-certification
remains part of the pending current-head matrix.
The empty-thread context-tray follow-up removes false `aria-disabled` and
disabled accessibility state from the environment-mode and branch metadata.
Those chips describe the current draft context and have no action in the Web
authority; Temporary remains the only pressed-state control. The focused
landing suite passes (3/3), both production bundles build, `git diff --check`
passes, and React Doctor 0.9.11 reports zero diagnostics against `f099a0f0`.
Visual re-certification remains part of the pending current-head matrix.
The image-semantics follow-up marks nested Profile avatar images, Explorer
preview pixels, and Composer thumbnail pixels as non-accessibility elements.
Their semantics remain on the surrounding profile identity/file name or the
named `Preview <file>` control, matching Web's empty-alt ownership and avoiding
duplicate or unnamed image nodes. Focused Profile, Explorer, and Composer
suites pass (11/11), both production bundles build, and React Doctor 0.9.11
reports zero new diagnostics against `3761d33f`.
The form-semantics follow-up explicitly names the Kanban task instructions /
task name textarea, Git commit message textarea, Integration connection name,
and provider-specific credential fields. The Git textarea uses the native Lynx
`default-value` plus `bindinput` path and becomes read-only while its action is
running; no invalid DOM-only focus attribute remains. Four focused suites pass
(14/14), both production bundles build, and React Doctor 0.9.11 reports zero
new diagnostics against `ebbf6836`.
The shared-interaction follow-up migrates existing Composer command/model/
trait controls, Kanban route/column/overview actions, and Pull Request
filter/tab/disclosure/close actions into the hook's native accessibility owner.
Visible Web labels remain unchanged, while Native now receives
`accessibility-element`, label, traits, and selected/expanded/on-off value from
the same source. Focused cross-adapter regressions pass (5/5), both production
bundles build, and React Doctor 0.9.11 reports zero new diagnostics against
`3b74e086`.
The primitive follow-up closes the remaining visible-text control gap:
`useLynxInteractiveState` now treats `onActivate` as sufficient to emit a
Native accessibility element with button traits, while pure hover owners still
emit no accessibility node and explicit `accessibilityElement: false` remains
authoritative. Primitive, nested-action, Composer attachment, shared-name, and
Environment regressions pass (19/19), both production bundles build, and React
Doctor 0.9.11 reports zero diagnostics against `145d4f0f`.
The remaining explicit-label pass routes shared Menu trigger labels plus
expanded/collapsed value, and Sidebar Chats pagination labels, through that
same Native owner. Menu/Sidebar/shared-name regressions pass (16/16), both
production bundles build, and React Doctor 0.9.11 reports zero new diagnostics
against `e775ac0f`.
The form-error follow-up maps retained validation/action failures back onto the
Kanban mutation textarea, Git commit message textarea, and custom-model slug
input with dynamic `aria-invalid`. Existing edit-to-clear and retry behavior is
unchanged. Focused form suites pass (9/9), both production bundles build, and
React Doctor 0.9.11 reports zero new diagnostics against `261bc8f3`.
The adjacent announcement follow-up marks those retained error messages with
the same Native alert role already used by Kanban creation and Pull Request
comments, so assistive technology receives the failure without moving focus.
Focused suites pass (9/9), both production bundles build, and React Doctor
0.9.11 reports zero new diagnostics against `7ae10301`.
The Settings heading follow-up maps the Web panel h1, section h2, and row h3
owners to explicit Native accessibility headers with one shared semantic
contract. Focused Settings heading regressions pass (4/4), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `217e2e1d`.
The private-layout follow-up moves that contract into one
`SettingsHeadingElement` and applies it to the Appearance, General, Git
writing-model, and provider-picker section/row titles that reproduce Web
`SettingsSection` and `SettingsRow` without using the generic Lynx adapters.
Focused changed-surface regressions pass (14/14), both production bundles
build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `01b7c6e6`.
The final Web Settings heading inventory closes the remaining real counterparts:
Profile identity plus its four h3 sections, Provider Usage h2, and Theme Pack
h3 now use the same Native heading primitive. Keyboard shortcut labels remain
plain text because their Web authority is also a non-heading `div`. Focused
Profile, Usage, Theme Pack, and shared-heading regressions pass (22/22), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero diagnostics against `e7e931dd`.
The Profile composite follow-up exposes each stat, insight, plugin usage, and
model usage row as one named static Native text element. This preserves the
Web label/value or list-item reading unit while avoiding speculative Native
list/definition roles that are not established by the current Lynx contract.
The focused Profile suite passes (5/5), both production bundles build,
`git diff --check` passes, and React Doctor 0.9.11 reports zero diagnostics
against `7feb8ba7`.
The Settings load-failure follow-up marks retained Profile, Worktrees, Skills,
and Archived query failures as Native alerts without making their ordinary
initial loading states assertive. Retry controls and focus behavior remain
unchanged. Focused load-error/Profile regressions pass (6/6), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `4bc471f6`.
The retry-ownership follow-up moves Profile, Worktrees, and Archived load-alert
semantics from containers onto their error text nodes so sibling Retry buttons
remain independent reachable Native controls. Focused alert/Profile/
Worktrees/Archived regressions pass (13/13), both production bundles build,
`git diff --check` passes, and React Doctor 0.9.11 reports zero diagnostics
against `bbcbd93d`.
The retained mutation-notice follow-up marks Advanced recovery/open failures,
Integration create/revoke/resume failures, provider update/settings failures,
and destructive Worktree failures as Native alerts. Advanced repair success
and Integration copy success retain explicit success intent and remain
non-assertive. Focused adjacent regressions pass (15/15), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `49f8bf36`.
The Profile dialog-feedback follow-up marks image-picker failures and failed
copy/save exports as Native alerts. Copied image, saved PNG, and cancelled-save
outcomes carry success/neutral intent and remain non-assertive. The focused
Profile suite passes (5/5), both production bundles build, `git diff --check`
passes, and React Doctor 0.9.11 reports zero diagnostics against `0c730166`.
The final retained Settings mutation-error inventory adds Skills setting-save
failures and Archived restore/delete failures to the same Native alert
contract. Provider Usage warnings, AppSnap state, and ordinary provider
metadata remain non-alert descriptive content. Focused Skills, Archived, and
error-contract regressions pass (8/8), both production bundles build,
`git diff --check` passes, and React Doctor 0.9.11 reports zero diagnostics
against `490f3a2a`.
The Profile color-selection follow-up retains each swatch's Native button trait
and adds Selected/Not selected accessibility value, so the visual active ring
has a matching state announcement. The focused Profile suite passes (5/5),
both production bundles build, `git diff --check` passes, and React Doctor
0.9.11 reports zero diagnostics against `a6b61b6e`.
The Appearance segmented-control follow-up projects each active/inactive theme
or density segment through Lynx UI `buttonProps` with Native radio role and
selected state, rather than relying only on wrapper `role` / `aria-checked`.
The focused Appearance suite passes (3/3), both production bundles build,
`git diff --check` passes, and React Doctor 0.9.11 reports zero diagnostics
against `b962abf1`.
The shared Menu selection follow-up keeps one focus/activation owner while
adding `menuitemradio` / `menuitemcheckbox` Web roles and Native
radio/checkbox/switch state for visual checks and tracks. The complete Menu
suite passes (11/11), adjacent Appearance/Theme Pack suites pass (12/12), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero diagnostics against `5e9b63e2`. The previously failing General
fallback assertion was a stale fixture from before Droid gained a real icon in
`147cf5b7`; using an intentionally unsupported provider restores that suite
alone (3/3) and the full Menu/Settings consumer batch (26/26).
The shared Button follow-up merges `disabled: true` into any existing Native
accessibility-state object while continuing to pass the behavioral disabled
flag upstream. Focused Button and Settings consumer regressions pass (10/10),
including inert taps and selected-state merging; both production bundles
build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `9bf1889b`.
The shared Button element follow-up exposes ordinary visible-text and icon
actions as Native button elements/traits even without explicit labels, while
preserving `accessibility-element: false` for nested visual-only select
Buttons. Broad Button/Dialog/Menu/Settings regressions pass (46/46), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero diagnostics against `d3c1185f`.
The Settings switch follow-up adds Native switch role plus checked state to
General, Appearance, Provider Picker, and Theme Pack custom switches; disabled
General controls also publish disabled state. The non-actionable AppSnap
placeholder retains its separate disabled-state contract. Focused regressions
pass (21/21), both production bundles build, `git diff --check` passes, and
React Doctor 0.9.11 reports zero diagnostics against `db358579`.
The Integration project-choice follow-up adds Native checkbox role and checked
state to the existing named interaction owner while preserving its visual
checkmark and Selected/Not selected value. The focused Integrations suite
passes (3/3), both production bundles build, `git diff --check` passes, and
React Doctor 0.9.11 reports zero diagnostics against `5d4da83e`.
The Provider Usage meter follow-up exposes each painted remaining-usage track
as one named Native text element with a percentage value while retaining Web
`aria-valuenow/min/max`. No Native progressbar role is claimed because the
current Lynx contract does not establish one. Focused Usage contracts pass
(6/6), both production bundles build, `git diff --check` passes, and React
Doctor 0.9.11 reports zero diagnostics against `b78dda06`.
The shared Input follow-up fixes the `onKeyDown` / raw `KeyboardInput` branch
so `aria-label` or `accessibility-label` reaches the native input as both Web
and Native naming metadata. This restores Settings sidebar and keyboard-
shortcut search names. Focused primitive/consumer contracts pass (4/4), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero diagnostics against `85ba7a1f`. Direct raw-input mounting remains
outside the renderer harness because host invocation is not implemented, so
the primitive metadata assertion is deterministic source coverage.
The shared Input invalid-state follow-up forwards `aria-invalid` to both the
raw keyboard input and standard Lynx UI input rather than keeping it only as a
wrapper CSS class. Input/custom-model/Theme Pack regressions pass (12/12), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero diagnostics against `c1ff94a4`. Direct primitive mounting remains
outside the renderer harness because Lynx input host invocation is not
implemented, so branch metadata uses deterministic source coverage.
The named-input routing follow-up honors the existing `nativeInput` prop and
routes every named Settings/Profile/Theme Pack field through the raw input
branch because upstream Lynx UI Input does not spread accessibility metadata.
The raw branch also publishes Native disabled state for Provider Tool fields.
Focused primitive and seven-consumer regressions pass (27/27), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `46c34659`.
The Appearance select follow-up moves the field name onto the actionable
`MenuTrigger` owner while retaining the nested button label for Web parity.
Focused Appearance/Menu regressions pass (14/14), both production bundles
build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `e4a5edfd`.
The Settings select ownership follow-up keeps General, Git writing-model,
Appearance, and Custom Model names/states on their `MenuTrigger` owners while
marking nested Button-shaped visuals as non-accessibility elements. Focused
General/Appearance/Custom Models/Menu/section regressions pass (25/25), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero diagnostics against `7fa30c0a`.
The Settings navigation follow-up replaces the Lynx-only `aria-selected` with
Web's `aria-current="page"` and adds Native selected/disabled state while
retaining the Current section accessibility value. Focused navigation
regressions pass (13/13), both production bundles build, `git diff --check`
passes, and React Doctor 0.9.11 reports zero diagnostics against `3047ae0b`.
The Integration disclosure follow-up projects Expanded/Collapsed through the
Lynx Button `buttonProps` channel, matching the existing Release History and
recovery disclosure values while retaining Web `aria-expanded`. No Native
expanded-state object is claimed because the current engine contract does not
establish one. Focused Advanced/Integrations regressions pass (6/6), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero diagnostics against `2f4f348d`.
The unavailable Settings-search follow-up exposes the inert placeholder as a
named Native search element with disabled state while retaining
`focusable={false}` and no activation handler. Focused sidebar-search
regressions pass (3/3), both production bundles build, `git diff --check`
passes, and React Doctor 0.9.11 reports zero diagnostics against `a00cd615`.
The shared Dialog follow-up renders `DialogTitle` as one explicit Native
header, covering Profile edit/share and Release History in Settings as well as
the Environment commit and Kanban task dialogs. Focused Dialog/Profile/
Advanced regressions pass (13/13), both production bundles build,
`git diff --check` passes, and React Doctor 0.9.11 reports zero diagnostics
against `0adea946`.
The dialog-close follow-up replaces the upstream close wrapper, which forwards
only style/class/disabled and cannot carry accessibility metadata, with the
shared interaction owner. Default closes are named `Close dialog`; Theme Pack
uses `Close theme import`. Focused Dialog/Theme Pack regressions pass (15/15),
including activation and exact-trigger focus restoration; both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `e0fa42e4`.
The symmetric dialog-trigger follow-up replaces the same upstream metadata-
dropping owner while preserving exact-selector registration. Theme Pack's
production trigger is named `Import theme`; tests cover labeled open
activation, close, exact focus restoration, and disabled inertness (16/16).
Both production bundles build, `git diff --check` passes, and React Doctor
0.9.11 reports zero diagnostics against `19413cea`.
The Settings empty-state follow-up exposes Archived, Skills, and Integrations
title/description pairs as one static Native text element per Web conceptual
row/card without adding heading or control traits. Focused regressions pass
(9/9), both production bundles build, `git diff --check` passes, and React
Doctor 0.9.11 reports zero diagnostics against `f056a61f`.
The Theme Pack dialog ownership follow-up removes the nested Button beneath
the named Import trigger and applies the same Button classes directly to that
outer owner; the nested close icon likewise no longer carries a duplicate
name. Focused Theme Pack/Dialog regressions pass (16/16), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `db6e6139`.
The Theme Pack code-theme follow-up keeps the field name/state on its
`MenuTrigger` and marks the nested palette-preview Button as a non-accessibility
element. Focused Theme Pack/Menu regressions pass (20/20), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `63807af8`.
The Theme Pack color-reset follow-up gives every optional icon-only reset
button Web's exact field-specific `Reset ${ariaLabel}` name. The focused Theme
Pack suite passes (9/9), both production bundles build, `git diff --check`
passes, and React Doctor 0.9.11 reports zero diagnostics against `89986839`.
The Theme Pack import-validation follow-up marks the share-string textarea
invalid whenever its retained parser error is present and exposes that error as
a Native alert. Editing clears both the error and invalid state. The focused
Theme Pack suite passes (9/9), both production bundles build,
`git diff --check` passes, and React Doctor 0.9.11 reports zero diagnostics
against `939d7520`.
The Appearance font-autocomplete follow-up introduces a passive MenuTrigger
anchor so the named native text input remains the sole focus/accessibility
owner and still opens suggestions on focus/change. Focused Appearance/Menu
regressions pass (15/15), both production bundles build, `git diff --check`
passes, and React Doctor 0.9.11 reports zero diagnostics against `c411d1de`.
The AppSnap capability-state follow-up retains the unavailable toggle's honest
inert/unfocusable behavior while adding Native switch role and explicit
checked-false/disabled-true state beside its existing Off value. Focused
AppSnap regressions pass (2/2), both production bundles build,
`git diff --check` passes, and React Doctor 0.9.11 reports zero diagnostics
against `acb32b7d`.
The Provider Usage line follow-up exposes each label/value/optional-subtitle
row as one static Native text element while leaving percentage meter tracks as
separate quantitative elements. Focused Usage contracts pass (6/6), both
production bundles build, `git diff --check` passes, and React Doctor 0.9.11
reports zero diagnostics against `6cf595b4`.
The Provider Usage header follow-up exposes each provider name plus optional
plan/auth status as one static Native text element; the visual provider icon
remains nested and unnamed. Focused Usage contracts pass (6/6), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `27e749d7`.
The Provider Usage warning follow-up moves semantics from the generic nested
`Usage warning` icon to the row carrying the real warning detail, matching Web's
decorative icon ownership. Focused Usage contracts pass (6/6), both production
bundles build, `git diff --check` passes, and React Doctor 0.9.11 reports zero
diagnostics against `65c099f5`.
The current-head Profile stats calibration uses one isolated server and one
named browser session to compare Web and Lynx-for-Web at `1280x820`, DPR 1, in
both light and dark themes. First-screen geometry is effectively exact. The
remaining material residual came from using the full border token for both
the stats outline and dividers, plus assigning wide-layout dividers to the
following tile rather than Web's preceding-tile `divide-x` ownership. Separate
light/dark low-alpha tokens and right-edge ownership align the dark sampled
pixels exactly; the light divider differs by one RGB level from alpha
rounding. Evidence and invalid-cell classification are recorded in
`shots/2026-08-10/settings-profile-paired-current/notes.md`. The focused
Profile suite passes (5/5), both production bundles build, React Doctor 0.9.11
reports zero diagnostics against `92c0fe91`, and the named browser session was
closed after restoring both clients to System.
The Settings General current-head refresh in
`shots/2026-08-10/settings-general-matrix-current/` retains all four required
Web/Lynx-for-Web theme/size coordinates against one isolated server and frozen
snapshot. General heading geometry is exact at both sizes; light mean absolute
RGB differences are `0.5922` and `0.5095`. The larger dark difference remains
inside the already registered translucent-Web versus opaque-Lynx material
boundary rather than a new Settings geometry, type, content, or state defect.
The paired `0.0.9-dev` diagnostic host was restored from its published package
without changing workspace dependencies. It exposed a real current-head
startup regression: top-level `Array.map`/`String.replaceAll` construction of
the shared local-image regex threw in the ReactLynx main thread and cascaded
into missing snapshots. An automated exact-host bisect identified `7165953d`
as first bad and `99e2b46c` as good. Replacing that initializer with the
equivalent static regex preserves the canonical allowlist and restores Native
startup. Two exact-owned launches now retain all four Native General cells at
both themes/sizes with the staged bundle, expected roles, and zero console
messages. The unrelated `@t3tools/lynxtron` client was not used or touched.
The subsequent Landing current-state refresh is recorded in
`shots/2026-08-10/landing-matrix-current/`. Web and Lynx-for-Web retain all
four theme/size coordinates with mean absolute RGB differences from `0.9688`
to `2.0652`. Current-head Native no longer reproduces the earlier
offline/cooldown startup frame: three cold starts rendered the Landing
Composer on the exact isolated server with zero retry nodes and empty
warning/error consoles. Exact-owned light Native cells are retained at both
sizes; DPR-normalized differences from Lynx-for-Web are `0.9959` and `0.8069`,
with a pixel-identical blank canvas. Native dark cells remain unretained
because the current Desktop DevTool `Input.emulateTouchFromMouseEvent` returns
success without dispatching events, as confirmed against both Settings
navigation and the Project Picker's `aria-expanded` state. No direct theme
state or Runtime/DOM mutation was used to manufacture those cells.

The `3b9e343c` Native interaction follow-up closes the application-layer
titlebar drag regression behind the reported hover/drag flashing: every
focusable titlebar control now owns `-x-app-region:no-drag`, while the blank
titlebar surface remains draggable. The focused contract protects both
requirements. This does not claim that unrelated Lynxtron compositor failures
are impossible.

The current empty-thread project heading refresh is retained in
`shots/2026-08-10/empty-thread-heading-current/`. A real project named
`Environment Current` exposed that the historical `400px` Lynx heading
contract wrapped to `400x70` while Web remained one `545.25x34.5` line. The
Lynx adapter now maps Web's centered `736px` chat frame and lets project copy
fill it. Final frame and Composer geometry share `x=400,width=736`; the Lynx
heading is one centered `688x35` line. Focused regressions pass 3/3 and the
final Lynx-for-Web production build succeeds.

The same canonical fixture exposed a separate content projection defect: its
server snapshot has `branch:null`, Web correctly omits the branch selector, but
Lynx invented a `main` status chip. The context tray now renders branch
metadata only when the snapshot supplies a branch and otherwise leaves the
slot absent. Current-head paired evidence in
`shots/2026-08-10/empty-thread-null-branch-current/` retains the same
`Branch Current / Local / Temporary` content and `736x58` tray in Web and
Lynx-for-Web, with no standalone `main` token. Rendered regressions cover both
null and exact named branches; the combined empty-thread suites pass 5/5 and
the Native/Desktop production build succeeds.

The current Environment row interaction refresh is retained in
`shots/2026-08-11/environment-row-hover-current/`. A real Git workspace with
one modified and one untracked file produces the same `Changes +2 / -0` and
Editor view rows in both clients. Default geometry is exact at `274x26`.
The audit exposed that Lynx used the generated blue `--accent` token for
hover/focus/pressed while Web uses neutral elevated-secondary material.
Every ordinary Environment interaction owner now uses
`--color-background-elevated-secondary`; only the passive recap skeleton keeps
`--accent`. Final representative light hover resolves to the same
`rgba(13,13,13,0.04)` at the same `987/175/274x26` box. Focused tests enumerate
the surface and pass 6/6; both production builds succeed.

The subsequent dock-chrome material pass applies the same Web neutral hover
contract to Diff close/retry and Explorer close/preview-action controls instead
of generated blue `--accent`. Explorer selected rows keep their separate
`--secondary` state and are not conflated with transient hover. Focused Diff
and Explorer contracts pass 3/3 and the Native/Desktop production build
succeeds.

The Pull Request disclosure material follow-up removes interaction paint that
Web does not own: Summary and Code file headers no longer gain a blue
background or pressed opacity, while Code `Show more` raises only its muted
label to foreground on hover/focus/press. The existing 220ms disclosure and
focus-ring contracts remain intact. Focused Summary/Code regressions pass 2/2
and the Native/Desktop production build succeeds.

The Provider Health notification follow-up aligns the full banner affordance,
not only its frame: warning/error icons follow Web's readable notification
foreground at 92%, and the dismiss control uses that foreground's 10% hover
tint plus 35% focus ring in each theme instead of a brand-blue `--accent`
surface. Focused banner regressions pass 3/3 and the Native/Desktop production
build succeeds.

The Appearance terminal-font autocomplete follow-up removes a different
brand-color leak: Web's clear/trigger affordance changes only from 80% to 100%
opacity, so Lynx no longer paints a blue hover surface or dims pressed state.
Hover, focus, and press now preserve the field surface and raise the icon to
full opacity. Focused Appearance regressions pass 3/3 and the Native/Desktop
production build succeeds.

The Kanban New task project feedback follow-up keeps selected project identity
on the branded accent surface while moving ordinary hover/press to Web's
neutral secondary material and removing whole-chip pressed dimming. This keeps
selected and transient states from impersonating each other. The complete
dialog suite passes 4/4 and the Native/Desktop production build succeeds.

The Composer footer-chrome follow-up applies the same selected/transient split
to closed controls: Model, Traits, and Runtime triggers use Web's neutral
elevated-secondary hover/pressed surface, while active menu rows and selected
models retain branded accent identity. Model press no longer dims the whole
control. Focused Composer regressions pass 4/4 and the Native/Desktop production
build succeeds.

The shared Menu/Command primitive follow-up removes the broadest remaining
brand-color leak: pointer hover, keyboard highlight, focus-visible menu state,
and press now use Web's button-secondary-hover token instead of branded
`--accent`, without whole-row pressed opacity. Radio/checkbox/switch selection
continues to live on indicators and explicit checked state rather than
transient row paint. Primitive plus representative Composer/Settings consumers
pass 28/28 and the Native/Desktop production build succeeds.

The Composer model-list follow-up brings its custom rows onto that primitive
contract: provider choices, Back, collapsible group headers, model rows, and
favorite actions use neutral transient feedback without whole-row pressed
dimming. Selected models are identified by the existing Check indicator rather
than a second branded row background; favorite state remains the amber star.
Focused model/trait/icon regressions pass 7/7 and the Native/Desktop production
build succeeds.

The Composer trait-list follow-up completes the same separation for effort,
context, agent, and speed controls. Active radio choices remain visible through
their Check indicator, Fast remains visible through its amber filled Zap, and
neither state adds a branded row background. Hover/press uses neutral
button-secondary material without dimming. Focused trait/Composer regressions
pass 6/6 and the Native/Desktop production build succeeds.

The Landing Project Picker follow-up removes the same state conflation from the
new-thread tray. Closed/open trigger chrome and footer actions use neutral
elevated-secondary feedback; option hover uses the shared menu-highlight
surface; selected project identity remains solely on the existing Check
indicator instead of a branded row background. Focused project-picker/Landing
regressions pass 3/3 and the Native/Desktop production build succeeds.

The Project Picker search-focus follow-up closes a keyboard-entry mismatch
behind that visual shell. Web opens the picker with its search field focused
and the existing query selected; Lynx previously left focus on the trigger and
attached a no-op key callback to the input. The mounted Lynx panel now focuses
the named search field, selects its current query, and leaves Arrow/Enter/Escape
ownership with the shared Menu primitive rather than duplicating navigation.
Focused picker coverage passes 1/1; both Lynx-for-Web and Native/Desktop
production builds pass with only the existing warnings.

The Composer command-menu follow-up closes its remaining custom-row fork:
keyboard-active rows use Web's neutral button-secondary fill, while pointer
hover/press uses button-secondary-hover and no longer dims the entire row.
Semantic icons and focus rings are unchanged. Command composition plus shared
Command regressions pass 10/10 and the Native/Desktop production build
succeeds.

The Composer command-menu interaction follow-up removes a dead-state shortcut
behind that visual parity. Slash-command, skill, and mention menus previously
forced the first row active and discarded every shared highlight callback, so
pointer hover could not move selected state and keyboard activation could not
follow the visible row. All three menu kinds now share one normalized
highlight owner; stale IDs fall back to the first available item, Up/Down wrap,
hover updates active state, and Enter/Tab select that same item. The textarea
uses a normal key listener and only prevents handled menu keys, preserving
ordinary input outside an active menu. Active rows also receive stable Native
ids and use nearest-aligned `scrollIntoView`, so long result lists follow
keyboard navigation instead of leaving selection offscreen. Focused navigation,
row interaction, and scroll-follow coverage passes 10/10; both Lynx-for-Web and Native/Desktop production builds
pass with only the existing warnings.

The shared Menu trigger follow-up removes an upstream wrapper-level repaint
that Web never applies. Hover, focus, and press no longer change opacity or add
a duplicate focus ring on the entire trigger subtree; each concrete trigger
continues to own its own chrome, while disabled opacity remains centralized.
Menu plus representative Settings, Composer, Environment, and Explorer
consumers pass 30/30 and the Native/Desktop production build succeeds.

The shared Button follow-up removes the matching high-impact repaint source:
Native button press no longer applies one global `opacity:0.82` plus
`scale(0.98)` transform to every variant. Ghost, chrome/outline, and
secondary/subtle variants instead use their Web semantic pressed surfaces;
primary and destructive buttons remain stable on their own fills. Button,
Dialog, Theme Pack, Composer, and Settings consumers pass 28/28 and the
Native/Desktop production build succeeds.

The custom Switch follow-up removes the same whole-control dim from General,
Appearance, Provider Picker, Theme Pack, and Kanban task switches. Web keeps
the track stable and deforms only the thumb during press; Lynx now keeps its
track/label stable rather than flashing the entire switch at 80–82% opacity.
The aggregate switch contract plus consumer suites pass 20/20 and the
Native/Desktop production build succeeds.

The transcript feedback follow-up removes two frequent full-control flashes.
Collapsed-work disclosure now follows Web's text/chevron emphasis without
painting or dimming the entire trigger, and Scroll to bottom uses Web's neutral
hover/pressed surfaces rather than 90%/72% whole-button opacity. Disclosure,
selection-reference, and jump contracts pass 4/4 and the Native/Desktop
production build succeeds.

The inline-action follow-up removes the same press transform from Pull Request
detail Close and Markdown code Copy/Wrap. PR Close now retains chrome geometry
and uses the neutral elevated surface; code actions retain their 24px box and
use ghost-button secondary paint rather than opacity plus scale. Focused
contracts pass 3/3 and the Native/Desktop production build succeeds.

The Markdown external-link icon follow-up replaces Lynx's trailing `↗` text
approximation with the same leading icon decision as Web: GitHub links use the
Central GitHub mark, ordinary HTTP links load the server-cached site favicon,
and load failures fall back to the Central Globe identity without layout
shift. The favicon URL stays coupled to the active WebSocket host and forwards
its startup token for authenticated local instances; failure state is keyed by
favicon URL so a changed link retries its own host rather than inheriting a
previous domain's Globe fallback. The 1em icon slot is
decorative beneath the link's existing accessible name. URL, token, render,
error-fallback, and consumer wiring coverage passes 7/7; both Lynx-for-Web and
Native/Desktop production builds pass with only the existing warnings.

The Markdown file-fence header follow-up replaces Lynx's flattened
`filename + directory · line range` text with Web's four-role anatomy:
extension-aware 14px file icon, medium filename, independently truncating
directory, and fixed line range. Non-file fences retain the compact language
label. Focused Markdown and file-icon coverage passes 11/11; both Lynx-for-Web
and Native/Desktop production builds pass with only the existing warnings.

The GFM task-list follow-up replaces font-dependent `☑` / `☐` text with a
stable 14px, 3px-radius checkbox and a 10px Check SVG on the primary fill.
Tasks remain intentionally read-only on Lynx, but now expose static Native
checkbox role plus checked/disabled state instead of only visual punctuation.
Focused Markdown coverage passes 8/8; both Lynx-for-Web and Native/Desktop
production builds pass with only the existing warnings.

The Composer primary-action follow-up keeps Send/Sending/Stop on its stable
28px prominent circle. Hover and press no longer flash the entire control at
90%/72% opacity; disabled remains intentionally visible at 20%, and the
semantic arrow/spinner/stop identities are unchanged. Focused Composer
regressions pass 5/5 and the Native/Desktop production build succeeds.

The Kanban interaction follow-up removes blanket 80% press opacity from cards,
route navigation/actions, overview project/actions, and column actions. Their
existing Web-matched hover backgrounds, focus rings, and drag-source opacity
remain the sole visual state owners, so press no longer flashes every child
simultaneously. Kanban composition regressions pass 7/7 and the Native/Desktop
production build succeeds.

The Composer attachment-action follow-up stabilizes pasted-text Show, nested
Remove, and image preview controls. Show raises its underlined label to
foreground, Remove keeps its solid circular treatment, and image preview keeps
its border response; none now flashes the full control at 64–72% opacity.
Attachment interaction regressions pass 4/4 and the Native/Desktop production
build succeeds.

The Settings pressed-feedback follow-up stabilizes General/Appearance Reset
and Advanced recovery/release disclosures. Reset uses the ghost-button
secondary pressed surface rather than fading to 70%, while disclosure rows keep
their copy and chevrons at full opacity. General, Appearance, and Advanced
regressions pass 10/10 and the Native/Desktop production build succeeds.

The final pressed-repaint guard scans every Lynx CSS owner and rejects
whole-control `ui-pressed`/`ui-active` opacity below one or non-none transforms,
while allowing explicit descendant feedback such as switch/thumb physics and
collapsed-work text emphasis. The last unsupported owner, Profile avatar color,
no longer shrinks to 94% on press; its selected ring and hover identity remain.
Guard, Profile, Button, and Menu suites pass 23/23 and the Native/Desktop
production build succeeds.

The current-head Browser re-certification attempt uses a fresh isolated Synara
home at `.synara-fidelity-current-0811`, server `127.0.0.1:58120`, Web
`localhost:10044`, and the same-origin Lynx-for-Web surface at
`localhost:10044/lynx/index.html`. Both named browser sessions report an exact
`1280×820` viewport at DPR 1, and both retained preflight PNGs are exactly
`1280×820`. The Lynx host runtime config and relay diagnostics both resolve to
`ws://127.0.0.1:58120` with no transport error. A real rendered Add project
dialog created the `synara` project from `/Users/bytedance/github/synara`; both
clients then rendered that shared project snapshot. This proves the harness
connection, data source, route bootstrap, viewport, and output dimensions.

The attempt does not upgrade the pending interaction cells to PASS. This
machine has no `codex` executable in PATH, so the real provider model catalog
fails and cannot establish the model-group or sending states. Web's model
trigger opens through a real pointer sequence. The Lynx-for-Web host now
converts the custom-element pointer/keyboard target into an idempotent
same-origin `composerModelMenu=open` state, and the Composer consumes that
init-data through its normal controlled Menu path. The shared Menu trigger also
refreshes its anchor whenever an externally controlled menu opens; a bounded
Web-only position fallback keeps the resulting provider popup visible and
right-aligned when Web Elements cannot return a selector rect during the first
frame. Current runtime proof renders a visible `260×300` popup at
`x=739.25..999.25` against the `x=904.09..999.25` trigger with no page errors.
The provider rows still remain in honest `Checking`/unavailable states because
there is no Codex executable, so model-group contents are not visually
certified. Both editors accept real keyboard input, but the Lynx-for-Web
textarea island does not project the edit back into the rich-token draft
state. The Web product path also exposes no Explorer action from the active
project thread or global Search. No internal state injection, direct SQLite
edit, or synthetic fixture was used to conceal these boundaries.

The accompanying Explorer source audit found a real anatomy residual despite
the blocked visual cell. Lynx tree rows now match Web's shared file-row source
of truth: 28px height, 6px gap and radius, an 8px base plus 12px per-depth
indent, 75% file icons, 78% resting labels, and separate hover versus
selection/focus neutral surfaces. Focused Explorer tests pass 2/2, both
Lynx-for-Web and Native/Desktop production builds succeed, and
`git diff --check` passes. This is implementation evidence only; the Explorer
directory disclosure row remains visually pending until the real product path
can expose it in both clients.

A follow-up current-head PR Code attempt reused the same isolated project and
opened the real Web `Pull requests` route through its rendered sidebar control.
The `Open`, `Closed`, and `Merged` filters all completed without page errors,
but the authenticated repository projection returned no rows in any state.
Because no real pull request could be selected, no diff was fetched and the
Code disclosure cell remains visually pending. No pull-request fixture or
direct persistence edit was introduced to manufacture evidence.

The Native arbitrary text-range selection investigation reached an upstream
Lynxtron PC runtime blocker rather than a shippable product slice. Lynx's
documented contract exposes `text-selection={true}`, `flatten={false}`,
`selectionchange`, and the `getSelectedText` UI method, and the experimental
production bundle contained that wiring. On the exact-owned Desktop client,
Lynx DevTool main-thread evaluation resolved an assistant `.MdParagraph` to a
Lynx element wrapper with `invoke`; invoking `getSelectedText` immediately
removed that client and the host terminated with `SIGABRT` after reporting
`out_of_range was thrown in -fno-exceptions mode with message "basic_string"`.
The experiment was therefore fully reverted rather than shipping a path that
can crash the Native host. The existing whole-message assistant reference
remains the safe supported fallback, while arbitrary Native text-range
selection remains blocked on a Lynxtron PC engine/runtime fix.

The Composer draft-image follow-up corrects a source-only false positive in the
earlier attachment-warning audit. The warning renderer previously had no Lynx
consumer because Composer always passed empty images, an empty non-persisted
set, and no-op preview/remove/photo callbacks. Current head now carries a real
Native path end to end: `dialogsPickFiles` applies image/file-specific limits;
the host revalidates the token, file identity, MIME, and size before decoding a
bounded 512px preview; the Lynx draft store retains image capabilities and
non-persisted IDs; the shared attachment composition renders the real image,
warning, preview, and remove controls; and send staging uploads the original
bytes with the server's `image` metadata before dispatch. Upload type mismatches
fail closed, and failed partial staging cancels every managed attachment.
Attachment, draft-store, and renderer focused suites pass 27/27; both
Lynx-for-Web and Native/Desktop production builds pass with only the existing
unsupported-CSS and optional `ws` accelerator warnings.

Native runtime preflight used the exact staged
`apps/lynx/dist/desktop/main.lynx.bundle`, isolated state
`.synara-native-image-0811`, server `127.0.0.1:58090`, and a separate Lynx user
data directory. Host logs prove the owned app loaded the isolated storage and
connected through real `synaraRpc` calls. The interaction cell is not retained
as PASS: the unrelated `@t3tools/lynxtron` client already owns Desktop DevTool
port 8901, while this Lynxtron runtime registered no second client on the
CLI-scanned 8902–8910 range. Because the supported DevTool input domain can
drive only LynxView touch and cannot inject a file into the macOS picker, the
real image selection, thumbnail, warning, preview, remove, and send sequence
still requires a later exact-client run with available DevTool ownership. The
owned Synara app and server were stopped; the unrelated 8901 client was not
touched.

The expanded-image polish follow-up removes the simplified Native-only black
panel introduced with the first real image consumer. The Native composition now
matches the Web authority's modal anatomy and behavior: a 75% fullscreen
backdrop, a 92%-class bounded image region with an 8px bordered elevated frame,
a 24px inset close action, 36px edge navigation actions, a centered truncated
12px filename/count caption, circular previous/next navigation, and
Escape/ArrowLeft/ArrowRight keyboard handling. The image itself owns its
accessible name while the non-atomic dialog root preserves distinct backdrop,
close, previous, and next actions instead of collapsing the modal into one
Native accessibility node. Focused overlay coverage passes 3/3; the attachment,
draft-store, renderer, and overlay set passes 30/30; both Lynx-for-Web and
Native/Desktop production builds pass with only the existing warnings. This is
implementation and interaction-contract evidence, not a replacement for the
blocked real-picker Native screenshot cell described above.

The pull-request route-controls follow-up removes a Native-only disabled-input
skin from the unavailable-search capability state. Web renders that state as
plain muted metadata rather than an input: current head now removes the local
border, fill, radius, and horizontal padding, aligns the copy within the search
row, and restores the 12px UI metadata role. The neighboring project-filter
trigger remains 24px intentionally because Web's shared `IconButton` defaults
to desktop `icon-xs`, while the separate refresh action remains the 28px
`icon-sm` control. Focused route-control coverage passes 4/4; Lynx-for-Web and
Native/Desktop production builds pass; strict reuse and style audits pass with
pull-request reuse at 61.95% and style coverage at 98.07%. This is
source/build evidence for an authority-backed anatomy correction, not a new
Native runtime certification cell.

The editable pull-request search follow-up closes the two remaining local
style drifts against Web's shared `SearchInput size="sm"` authority. Native now
uses the 11px UI-supporting text role rather than forcing the 12px base role,
and its soft field surface uses the same 2% foreground wash in light and dark
themes rather than the stronger shared secondary-button fill. The existing
28px height, 10px radius, border, 32px leading inset, 14px search glyph, and
editable input behavior remain unchanged because they already matched Web.
Focused route-control coverage passes 4/4; Lynx-for-Web and Native/Desktop
production builds pass; strict reuse and style audits remain green at 61.95%
pull-request reuse and 98.07% style coverage. This is source/build evidence,
not a new Native runtime certification cell.

The pull-request filter-pill follow-up aligns both interaction presentation
and prefetch intent with the shared Web composition. Inactive Native pills no
longer gain a filled secondary surface on hover or press; only hover brightens
their muted label to foreground, while the selected pill keeps the canonical
secondary fill and focus retains its visible ring. The previously accepted
but dropped `onIntent` callback now flows through the shared Lynx interaction
primitive and fires on hover and focus, matching Web's route-prefetch contract
without adding a pill-local pointer implementation. Focused route-control and
interaction coverage passes 12/12; Lynx-for-Web and Native/Desktop production
builds pass; strict reuse and style audits remain green at 61.95% pull-request
reuse and 98.07% style coverage. This is source/build evidence, not a new
Native runtime certification cell.

The pull-request header follow-up verifies that the adapter's null local
navigation element is intentional rather than a missing control: the Native
shell already owns one toggle/back/forward cluster in the open sidebar header
or the fixed closed-sidebar titlebar, and the closed PR header uses the matching
212px inset to avoid it. The actual remaining Web `truncate` contract is now
applied to both the title and scoped-project label, with shrinkable zero-width
flex bounds, clipped nowrap text, and ellipsis while keeping the scope separator
stable. This prevents long project names from displacing the refresh action or
colliding with shell chrome without duplicating navigation. Focused route and
titlebar coverage passes 8/8; Lynx-for-Web and Native/Desktop production builds
pass; strict reuse and style audits remain green at 61.95% pull-request reuse
and 98.07% style coverage. This is source/build evidence, not a new Native
runtime certification cell.

The pull-request project-filter follow-up restores the popup anatomy that the
generic Native radio menu had flattened. The popup now includes Web's `Project`
group label at the 11px fine-text role, uses 13px body rows with 6px vertical
and 8px horizontal padding, matches the 6px row radius and 14px selected
checkmark, and truncates long project names instead of letting them compete
with the indicator. The shared menu still owns selection semantics, keyboard
navigation, dismissal, focus, and highlighting. Focused route/menu coverage
passes 16/16; Lynx-for-Web and Native/Desktop production builds pass; strict
reuse and style audits remain green at 61.95% pull-request reuse and 98.07%
style coverage. This is source/build evidence, not a new Native runtime
certification cell.

The long project-filter follow-up closes the popup's overflow contract. Web
keeps its label fixed and bounds only the project rows to `max-h-72`; Native now
does the same with a dedicated vertical `scroll-view` capped at 288px. Large
project sets therefore scroll inside the 256px popup instead of expanding the
generic menu beyond the viewport or clipping trailing choices. The shared menu
continues to own item registration and keyboard order because the radio group
remains intact inside the scroll region. Focused route/menu coverage passes
16/16; Lynx-for-Web and Native/Desktop production builds pass; strict reuse and
style audits remain green at 61.95% pull-request reuse and 98.07% style
coverage. This is source/build evidence, not a new Native runtime certification
cell.

The pull-request list-row actor follow-up removes the remaining Native-only
initial badge. Rows now reuse the same actor adapter as Summary, reviewers, and
comments, so a real GitHub avatar renders when available, image failures fall
back to initials, missing actors use the canonical `ghost` identity, and the
avatar carries the login as its accessible name. A row-specific variant keeps
the slot avatar-only like Web rather than duplicating the visible login already
present in row metadata. The duplicated row avatar CSS and local initial logic
are deleted. Focused row/actor coverage passes 6/6; Lynx-for-Web and
Native/Desktop production builds pass; strict reuse and style audits remain
green at 61.95% pull-request reuse and 98.07% style coverage. This is
source/build evidence, not a new Native runtime certification cell.

The pull-request row pin follow-up matches Web's progressive disclosure instead
of keeping every unpinned action permanently visible. On desktop-sized Native
viewports an unpinned control now starts hidden, reveals on row hover or direct
pin focus/hover, swaps its baked SVG from muted to foreground without adding a
filled hover chip, and remains visible on compact/medium viewports. Pinned rows
keep the filled foreground asset at full opacity through every interaction; a
separate pinned icon class prevents hover from hiding the sole filled glyph.
The 28px control and 14px icon geometry, focus ring, accessible label, selected
state, and mutation callback remain unchanged. Focused row/actor coverage passes
6/6; Lynx-for-Web and Native/Desktop production builds pass; strict reuse and
style audits remain green at 61.95% pull-request reuse and 98.07% style
coverage. This is source/build evidence, not a new Native runtime certification
cell.

The pull-request row surface follow-up closes two quieter hierarchy drifts.
Native row titles now use Web's 500 medium weight instead of 600 semibold, and
unselected hover/press uses the exact 70% elevated-secondary wash rather than
the full selected surface. Because Native theme SVG/CSS projection needs direct
values, the 70% surface resolves to `rgba(13,13,13,0.028)` in light and
`rgba(252,252,252,0.0042)` in dark; selected rows still retain the full
elevated-secondary token. Focused row/actor coverage passes 7/7; Lynx-for-Web
and Native/Desktop production builds pass; strict reuse and style audits remain
green at 61.95% pull-request reuse and 98.07% style coverage. This is
source/build evidence, not a new Native runtime certification cell.

The pull-request row metadata follow-up restores two shared composition props
that the Native adapter previously accepted but ignored. Project labels now
respect Web's 12rem/192px truncation bound, branch labels respect its
14rem/224px bound, and both retain their full `title` value as a Native
accessibility label when the visible text is clipped. The mapping is explicit
to the two shared contract values rather than parsing arbitrary Tailwind class
strings. Focused row/actor coverage passes 8/8; Lynx-for-Web and Native/Desktop
production builds pass; strict reuse and style audits remain green at 61.95%
pull-request reuse and 98.07% style coverage. This is source/build evidence,
not a new Native runtime certification cell.

The pull-request row pin-geometry follow-up closes the remaining action-box
drift. Native now constrains the pin to a true 28x28 square with matching
minimum dimensions, prevents flex shrink, centers it vertically in the row,
and applies Web's 4px trailing inset. Previously only width was fixed, so the
control stretched to the row's full height and lacked the right breathing room
even though its glyph was centered. The existing visibility, tone swap, focus,
selection, and mutation contracts remain unchanged. Focused row/actor coverage
passes 8/8; Lynx-for-Web and Native/Desktop production builds pass; strict
reuse and style audits remain green at 61.95% pull-request reuse and 98.07%
style coverage. This is source/build evidence, not a new Native runtime
certification cell.

The pull-request empty-state follow-up aligns the shared `Empty` footprint
rather than shrinking it into a local compact placeholder. Native now uses the
same 64px vertical padding and resulting 180px minimum block, spans the full
list width, and caps description measure at Web's `max-w-sm` 384px instead of
430px. The existing 20px semibold title, 14/20px description, 4px title gap,
centered alignment, and system-state announcement were already correct and
remain unchanged. A focused render/style contract now covers this adapter;
focused list/row coverage passes 6/6, both production builds pass, and strict
reuse/style audits remain green at 61.95% pull-request reuse and 98.07% style
coverage. This is source/build evidence, not a new Native runtime certification
cell.

The pull-request loading-state follow-up restores the shared skeleton's base
surface. Native loading rows keep the already-correct 52px height, 8px radius,
2px spacing, row count, and live status announcement, but no longer weaken the
canonical `--muted` fill with a local 75% opacity. Web's moving linear highlight
has no established Native skeleton-motion primitive, so that remains an
explicit platform delta rather than introducing an unverified one-off
animation. Focused list/row coverage passes 7/7; Lynx-for-Web and
Native/Desktop production builds pass; strict reuse and style audits remain
green at 61.95% pull-request reuse and 98.07% style coverage. This is
source/build evidence, not a new Native runtime certification cell.

The pull-request list-group follow-up restores Web's heading identity without
changing already-correct visual geometry. Native `Pinned`/project group labels
now publish an accessibility element with the `header` trait, matching Web's
`h2` semantics while preserving the 11px medium quiet-ink role, 2px bottom
padding, and 10px separated-group top inset. Focused list/row coverage passes
8/8; Lynx-for-Web and Native/Desktop production builds pass; strict reuse and
style audits remain green at 61.95% pull-request reuse and 98.07% style
coverage. This is source/build evidence, not a new Native runtime certification
cell.

The pull-request unavailable-state follow-up replaces the Native dead-end
generic alert with supported recovery behavior. Structured
`PullRequestsUnavailableError` reasons now produce Web's `GitHub CLI is
required` or `Sign in to GitHub CLI` titles, every failure preserves its exact
server diagnostic, the combined copy is announced as an alert, and an outline
Retry action calls the existing query `refetch` while exposing a disabled
`Retrying...` state. The surface reuses the audited 180px/384px empty-state
measure and adds a restrained warning glyph. Web's install link and copyable
shell commands remain explicit platform scope rather than dead Native actions.
Focused unavailable/list coverage passes 5/5; Lynx-for-Web and Native/Desktop
production builds pass; strict reuse and style audits remain green at 61.95%
pull-request reuse and 98.07% style coverage. This is source/build evidence,
not a new Native runtime certification cell.

The pull-request detail-close follow-up restores Web's explicit strong-header
icon treatment. The Native 28x28 control, 8px radius, auto trailing alignment,
focus ring, hover/pressed surfaces, accessible activation, and 16px X geometry
were already correct; only the glyph ink was muted. It now resolves through
full `--foreground`, matching the shared dock-header control instead of looking
disabled at rest. A focused render/action contract now covers the generated SVG
tone and activation; focused close/pressed coverage passes 2/2, both production
builds pass, and strict reuse/style audits remain green at 61.95% pull-request
reuse and 98.07% style coverage. This is source/build evidence, not a new
Native runtime certification cell.

The pull-request detail-header action follow-up restores the supported
external-browser affordance beside Close. Once detail data is available, Native
now renders a second full-strength 28px header action with a 16px external-link
glyph and Web's 4px action gap; activating it calls
`platformWindow.openExternal(detail.url)`. The host call stays inside a
`background only` adapter callback so no background-only module enters the
main-thread route graph—the first build caught and forced correction of that
boundary. Native's existing primary mutation action remains below the header,
so Web's broader more-actions menu is not duplicated. Focused header coverage
passes 3/3; Lynx-for-Web and Native/Desktop production builds pass; strict
reuse and style audits remain green at 61.95% pull-request reuse and 98.07%
style coverage. This is source/build evidence, not a new Native runtime
certification cell.

The pull-request primary-action follow-up removes the Native-only full-width
bordered band and returns the action to Web's 48px detail header. Ready, draft,
or reopen now renders in the shared right-side action cluster beside external
open and Close, using a 28px pill, 12px horizontal padding, 12/18px text, normal
weight, and a 4px inter-control gap. Failed mutations still preserve the
retained action input and show a conditional inline recovery row with an
outline Retry action; no normal-state divider remains. Focused layout/header
coverage passes 4/4; Lynx-for-Web and Native/Desktop production builds pass;
strict reuse and style audits remain green at 61.95% pull-request reuse and
98.07% style coverage. This is source/build evidence, not a new Native runtime
certification cell.

The pull-request detail-error follow-up removes the second dead-end recovery
path. Initial detail failures now reuse the same reason-aware unavailable
surface as list failures, preserve the exact server message, expose the detail
query's `isFetching` state, and call `refetchSelectedDetail` in place instead
of telling users to close the panel. The existing four-row detail skeleton and
the Code tab's separate diff retry path remain unchanged. Focused
detail/unavailable coverage passes 4/4; Lynx-for-Web and Native/Desktop
production builds pass; strict reuse and style audits remain green at 61.95%
pull-request reuse and 98.07% style coverage. This is source/build evidence,
not a new Native runtime certification cell.

The pull-request stale-detail follow-up preserves cached content when only a
background refresh fails. Native now separates `error && data` from initial
`error && !data`: saved Summary/Timeline content stays mounted, and a full-width
amber status banner announces `Could not refresh pull request details. Showing
saved data.` with Web's 8x12px banner padding, readable foreground copy, 4%
warning tint, and 32% warning bottom rule. Only no-data failures replace the
content with Retry. Focused stale/initial recovery coverage passes 4/4;
Lynx-for-Web and Native/Desktop production builds pass; strict reuse and style
audits remain green at 61.95% pull-request reuse and 98.07% style coverage.
This is source/build evidence, not a new Native runtime certification cell.

The pull-request retained-list follow-up restores Web's bounded-data reporting
without replacing healthy rows. Native now shows 11px fine print when one or
more repository batches hit the 50-result cap, a rounded amber callout when
some project repositories are unavailable, and a second callout when the
latest background refresh fails while cached rows remain. The warning adapter
now supports both full-width banner and 8px-radius callout shapes using the same
readable foreground, 4% warning tint, and 32% warning border. Focused
warning/recovery coverage passes 5/5; Lynx-for-Web and Native/Desktop production
builds pass; strict reuse and style audits remain green at 61.95% pull-request
reuse and 98.07% style coverage. This is source/build evidence, not a new
Native runtime certification cell.

The pull-request detail-tab follow-up corrects the last visible chip-role drift.
All three tabs are real, so the capability composition correctly renders no
extra strip; the tabs themselves now use Web's 11px UI-supporting size and
muted idle ink instead of 12px foreground labels. Selected, hovered, and
pressed tabs brighten to foreground while retaining the existing 28px height,
10px horizontal padding, 8px radius, 2px group gap, selected surface, focus
ring, and button/selected accessibility semantics. Focused tab coverage passes
3/3; Lynx-for-Web and Native/Desktop production builds pass; strict reuse and
style audits remain green at 61.95% pull-request reuse and 98.07% style
coverage. This is source/build evidence, not a new Native runtime certification
cell.

The pull-request Summary warning follow-up replaces its last plain amber text
exception with the canonical warning system. Incomplete or truncated review
comments now use the compact note shape: 6x8px padding, 6px radius, 8px trailing
spacing, 4% warning tint, 32% warning border, and readable foreground copy.
Banner and callout users continue to share the same adapter, and the old
`SharedPrSummaryWarning` class is deleted. Focused warning/Summary coverage
passes 6/6; Lynx-for-Web and Native/Desktop production builds pass; strict
reuse and style audits remain green at 61.95% pull-request reuse and 98.07%
style coverage. This is source/build evidence, not a new Native runtime
certification cell.

The pull-request Summary empty-state follow-up separates two roles that the
Native adapter had collapsed into one 11px muted class. `No checks reported.`
now uses Web's 12px meta role with an 18px line box, while centered `No
comments` uses the 13px body role with a 20px line box and existing 16px
vertical padding. The obsolete shared muted class is removed so future empty
copy must choose its semantic tier. Focused Summary/warning coverage passes
7/7; Lynx-for-Web and Native/Desktop production builds pass; strict reuse and
style audits remain green at 61.95% pull-request reuse and 98.07% style
coverage. This is source/build evidence, not a new Native runtime certification
cell.

The pull-request check-row follow-up aligns its metadata hierarchy and hover
strength without changing interaction gating. Check name and status now use
Web's 12px meta role instead of 11px fine text, while comment file paths remain
11px. Row hover/press uses the exact 50% muted wash—2% light and 0.3% dark—
rather than the full muted surface; disabled rows still suppress hover, and the
existing 30px row, 6x8px inset, 8px gap, status glyphs, truncation, focus ring,
accessible label, and external-link action remain unchanged. Focused Summary
coverage passes 4/4; Lynx-for-Web and Native/Desktop production builds pass;
strict reuse and style audits remain green at 61.95% pull-request reuse and
98.07% style coverage. This is source/build evidence, not a new Native runtime
certification cell.

The pull-request comment-composer follow-up corrects its editor typography
without disturbing the already-real mutation path. Native now uses Web's 13px
body role with a 20px line box instead of 11px fine text inside the existing
42px rounded pill. The 20px GitHub account badge, 34–126px editor bounds,
six-line cap, 7px vertical editor padding, system UI font, 28px circular submit
button, draft retention, duplicate-submit lock, IME-safe Enter handling, and
detail/list invalidation remain intact. Focused composer style/behavior
coverage passes 3/3; Lynx-for-Web and Native/Desktop production builds pass;
strict reuse and style audits remain green at 61.95% pull-request reuse and
98.07% style coverage. This is source/build evidence, not a new Native runtime
certification cell.

The pull-request comment-error follow-up replaces its neutral elevated card
with a readable destructive callout. Failed submissions now use a 4% error
tint, 30% error border, 6px radius, 8x10px inset, and 12px metadata copy in both
themes, while retaining the exact GitHub error and draft for retry. The existing
alert accessibility label, duplicate-submit lock, and successful second-submit
path remain intact. Focused composer coverage passes 4/4; Lynx-for-Web and
Native/Desktop production builds pass; strict reuse and style audits remain
green at 61.95% pull-request reuse and 98.07% style coverage. This is
source/build evidence, not a new Native runtime certification cell.

The pull-request Timeline follow-up corrects its two remaining layout anchors.
Native now uses Web's exact 20px panel padding instead of an 18px vertical
inset, and the rail begins after an 8px left margin instead of 6px. The 20px
rail content inset, 1px border, 8px marker at `-25px/4px`, 20px event spacing,
13px title, 12px metadata/body roles, and three-line body clamp remain
unchanged. Focused Timeline coverage passes 2/2; Lynx-for-Web and
Native/Desktop production builds pass; strict reuse and style audits remain
green at 61.95% pull-request reuse and 98.07% style coverage. This is
source/build evidence, not a new Native runtime certification cell.

The pull-request Summary overview follow-up corrects its remaining metadata
scale drift without changing the already-matched 20px panel inset and 16px
section rhythm. Byline copy, meta labels/values, branch names/arrows, and branch
diff counts now use Web's 12px metadata role instead of 11px fine text.
Reviewer actor chips remain the intentional 11px exception, and title/section
typography is unchanged. Focused Summary/actor coverage passes 8/8;
Lynx-for-Web and Native/Desktop production builds pass; strict reuse and style
audits remain green at 61.95% pull-request reuse and 98.07% style coverage.
This is source/build evidence, not a new Native runtime certification cell.

The pull-request comment-card follow-up removes a Native double-inset and
restores Web's between-card separator model. Cards no longer add their own 10px
vertical padding around a header that already owns 10px, file paths no longer
carry an 8px left offset, and only adjacent cards receive a 50%-strength top
divider. The disclosure header, 12px actor identity, 11px timestamp/path, 12px
Reply action, finding hierarchy, 12px body bottom inset, and 220ms disclosure
motion remain unchanged. Focused Summary/warning coverage passes 10/10;
Lynx-for-Web and Native/Desktop production builds pass; strict reuse and style
audits remain green at 61.95% pull-request reuse and 98.07% style coverage.
This is source/build evidence, not a new Native runtime certification cell.

Therefore current HEAD must not be described as globally P10-complete solely
from the historical green verifier. Implemented responsive UI surfaces are
closed, but a new complete three-client certification is still required after
the remaining product/platform scope is explicitly resolved. Environment,
Diff, Explorer, whole-file actions, and source line comments now have real
consumers, and Pull Request Summary now has a real typed GitHub comment
mutation path with failure recovery. Native Explorer now renders allowlisted
PDF pages in-app through a bounded server-side `pdfjs-dist` plus
`@napi-rs/canvas` pipeline, with schema-backed page-count metadata, native
`<image>` output, and Previous/Next controls. Exact-owned runtime evidence,
HTTP headers, rendered PNG, DOM, and console are retained in
`shots/2026-08-10/explorer-pdf-page-current/`. This closes page rendering but
does not claim the Web viewer's text layer, links, search, or zoom. Arbitrary
Native text-range selection remains the explicit host/engine gap.
