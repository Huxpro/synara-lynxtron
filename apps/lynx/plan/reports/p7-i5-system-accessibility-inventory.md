# P7-I5 system state and accessibility inventory

Status: completed at the application layer · 2026-07-31

## Anti-patterns verdict

**Pass.** The current six-screen product no longer shows the generic card-grid,
invented brand chrome, diagnostic navigation, gradient/glass/neon palette, hero
metrics, or decorative motion called out by the original P5 audit. The remaining
problems are functional accessibility and resilience gaps, not AI-generated
visual styling.

## Executive summary

- Baseline findings: **1 critical, 4 high, 3 medium, 1 low**. Cuts 1–4 have
  mitigated the central Native naming contract, shared route announcements,
  Settings failure containment, Kanban route distinctions/retry, PR row-count
  fidelity, the Settings persistence copy issue, bounded composer lifecycle,
  and informative-text contrast.
- Baseline readiness was **58/100**. The application-layer P7-I5 exit is now
  complete. Remaining limitations are the flatter Native reading structure
  and the known Lynxtron host AX boundary; they are explicit platform gaps,
  not silent missing product states.
- The central Native primitive publishes official Lynx nodes/names/traits,
  routed dynamic states use bounded status/alert announcements, Composer
  announces only coarse lifecycle transitions outside the transcript loop,
  and canonical informative roles are at least 4.5:1 in light and dark.
- Core routes still use real server/store data. No fake rows or fabricated
  success states were found.

## Implementation cut 1 — named Native interaction semantics

Status: **application layer complete for the representative cut; host AX
projection unavailable in Lynxtron 0.0.7**.

- `useLynxInteractiveState` now owns one typed accessibility projection:
  `accessibility-element`, installed-target `accessibility-traits`,
  `accessibility-label`, and `accessibility-value`. It publishes a native
  button node only when a caller provides a non-empty product label or
  explicitly opts in. An initial broader default was rejected in runtime
  because it exposed unlabeled icon controls.
- Product labels now flow from physical-shared sources into Sidebar primary
  actions, Settings navigation, Kanban cards, PR rows/pin actions, Composer
  primary action, and the Native Settings Back action. Direct Sidebar
  thread/project rows publish their existing title/disclosure copy and
  expanded value. The generic Native `Button` projects the same native
  element/label/trait contract whenever its Web-compatible `aria-label` is
  present.
- Real production runtime on an isolated Synara sequence-180 snapshot showed:
  - 10 visible thread-route accessibility elements, all named: New thread,
    Search, Kanban, Pull requests, Settings, a project disclosure, a real
    thread, two composer controls, and Send message;
  - 15 Settings navigation buttons with exact labels; General reported
    `Current section`, while unavailable Profile/Advanced remained named,
    disabled, and unfocusable;
  - two real Kanban cards named `Reply MODEL-READY, Done` and
    `READY-LYNX-COMPOSER, Draft`;
  - no console errors or warnings.
- The snapshot contained no PR rows, so the PR row label is proven by the
  physical-shared render test and both production compilers, not by invented
  runtime data.
- macOS System Events could read the `lynxtron` window but reported its content
  as one `AXGroup` with **0 children**. Therefore the current host does not
  project these verified Lynx attributes into the macOS accessibility tree.
  This is a recorded Lynxtron 0.0.7 platform gap, not an application-layer
  screen-reader pass. The app-side semantics remain necessary for a future
  capable host and other Lynx targets.

Evidence and cleanup details:
`shots/2026-07-31/port/p7-i5/accessibility/notes.md`.

## Implementation cut 2 — shared system-state semantics

Status: **application contract complete for Panel, Sidebar and PR; audible host
announcement remains unobservable in Lynxtron 0.0.7**.

- A physical-shared `SystemStateIntent` contract now distinguishes
  `plain | status | alert | empty`. Plain hints remain silent. Web maps
  loading/empty to atomic polite `status` regions and failures to atomic
  assertive `alert` regions.
- Native adapters expose one named accessibility node for each meaningful
  state and call `lynx.accessibilityAnnounce` through a consecutive-key
  de-duplicating hook. Empty labels and plain placeholders are rejected.
  Transcript rows never consume this hook, so streaming token updates cannot
  enter the announcement loop.
- `PanelStateMessage`, Sidebar project/chat states and PR list/detail states
  consume the contract. Thread loading uses `status`; offline/error use
  `alert`. Native PR skeletons now honor the shared bounded `rowCount`, and the
  four-row detail load has its own label.
- Real sequence-180 runtime proved the same PR surface in two states:
  - online loaded-empty:
    `No pull requests found. Try another involvement, state, project, or
search filter.` with `accessibility-element=true` and trait `text`;
  - after stopping only the owned server, unavailable:
    `Pull requests unavailable. Check your connection and try again.` with the
    same named node contract.
    DevTool error/warning output was empty.
- The first runtime pass correctly failed evidence review because Lynxtron was
  loading the older `dist/desktop/main.lynx.bundle`; `rspeedy build` alone
  updates `output/bundle`. The formal `npm run build` staged both Lynx and
  desktop assets, after which the expected attributes appeared.
- Pure Slice tests prove one announcement per discrete key, duplicate
  suppression, plain/blank rejection and reset. The production compiler proves
  the host call is present. Lynxtron still exposes no macOS AX children and
  offers no observable spoken-announcement channel, so this is not represented
  as an audible Desktop screen-reader pass.

Evidence and cleanup details:
`shots/2026-07-31/port/p7-i5/system-states/notes.md`.

## Implementation cut 3 — Settings and Kanban resilience

Status: **application and representative runtime paths complete**.

- Settings now owns explicit hydration and persistence state. A failed initial
  read renders an alert plus Retry rather than disabled default-looking
  controls. Successful retry renders the actual saved values. Saves expose
  saving/saved/error status, ignore stale overlapping completions, and retain
  in-memory theme/density values when local or server persistence fails.
- The storage bridge no longer converts malformed JSON or write failures into
  apparent success. `setPersistedStorageItem` provides an awaited, serialized
  write-through path while preserving the synchronous Web Storage mirror
  contract used elsewhere.
- Real production runtime proved malformed-KV hydration failure and recovery,
  local write failure with current values retained, and successful save state.
  The original KV and window state were restored byte-exact.
- A physical-shared Kanban state composition now distinguishes
  loading/offline/error/not-found and stale-refresh variants. Pure route
  resolvers preserve last-known-good board data during refresh failures and
  only report not-found after a successful missing-project result.
- The first Kanban runtime pass exposed a missing exact Elements alias: the
  shared composition was present, but production used Web host elements.
  Adding the canonical alias and rebuilding the staged desktop bundle made the
  real offline route publish `SharedKanbanState`, a named alert, and a named
  Retry button. Activating Retry entered the named loading/status state and
  returned to offline after the owned hanging transport was stopped. Console
  error/warning output was empty.
- Focused gates: Web **4 files / 11 tests**; Slice **4 files / 14 tests**.
  Web production: **8,910 modules**. Slice production after the alias repair:
  **2262.6 kB Lynx / 2379.6 kB desktop total**. The exact serial audit sequence
  and both repository diff checks passed.

Evidence and cleanup details:
`shots/2026-07-31/port/p7-i5/resilience/notes.md`.

## Implementation cut 4 — Composer lifecycle and informative contrast

Status: **application contract and representative real runtime complete; host
audible announcement remains unobservable in Lynxtron 0.0.7**.

- A physical-shared `ComposerLifecycleStatus` fails closed on mount and emits
  only sending, starting, started, stopping, stopped, complete, and failure.
  Web uses polite status/assertive alert semantics; Native consumes the same
  presentation through the named state/announcement adapter. Transcript rows
  do not import it, so token polling remains outside the announcement path.
- A real isolated Claude Sonnet 4.6 turn proved
  `Starting response` → `Response started` → `Response complete`. The first
  real Native Stop exposed a race: local `stopping` cleared before the server
  published `ready`, so the resolver incorrectly announced completion.
  Retaining a bounded stop intent across that frame fixed the result. A rapid
  product probe then captured exactly
  `Stopping response` → `Response stopped`, while server events independently
  recorded interrupt request, task stop, ready, and interrupted completion.
- A quarantined existing thread and new Codex sessions that produced ACP
  parse/auth noise but no provider events were retained as negative provider
  evidence; they were not used to judge Composer lifecycle behavior.
- Canonical theme math now generates distinct informative neutral, error,
  success, and warning text roles. Default light ratios are 6.10/4.57/4.82/4.57
  and dark ratios are 8.37/4.76/5.78/10.65. Representative state CSS uses the
  role tokens at full opacity; decorative/disabled tertiary roles are not
  globally recolored.
- Focused gates: Web **6 files / 38 tests**; Slice **5 files / 20 tests**.
  Web production: **8,912 modules**. Slice production:
  **2267.9 kB Lynx / 2384.8 kB desktop total**. The exact serial audit sequence
  passed at threads **55.15%**, threads-shell **63.42%**, thread **38.40%**,
  settings **51.29%**, projects/Kanban **52.24%**, PR **57.19%**, and style
  **98.06%**.

Evidence and cleanup details:
`shots/2026-07-31/port/p7-i5/composer-contrast/notes.md`.

Authoritative references:

- Lynx accessibility:
  <https://lynxjs.org/guide/inclusion/accessibility.html>
- Lynx `<view>` accessibility attributes:
  <https://lynxjs.org/next/api/elements/built-in/view.html>
- WCAG 2.2:
  <https://www.w3.org/TR/WCAG22/>
- WCAG status messages:
  <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>

## Six-screen state matrix

| Surface                        | Implemented state authority                                                                                                                                                   | What is already correct                                                                                                                                                                                                                     | Remaining P7-I5 proof / gap                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Threads shell / Sidebar        | shared `resolveSidebarProjectsSectionState` and `SidebarProjectsSection` own ready/loading/error/empty priority and copy                                                      | existing rows win over transient loading/error; loading/error/empty use shared status semantics and bounded Native announcement; representative rows are named native buttons                                                               | application state path complete; flatter reading/group structure and current Lynxtron host exposure remain documented gaps |
| Threads landing                | physical-shared empty landing plus composer frame                                                                                                                             | intentional new-chat empty state is not confused with query failure; no fake history; non-interactive frame does not opt into the interactive accessibility primitive                                                                       | application state path complete; host AX tree remains unavailable                                                          |
| Thread / transcript / composer | `resolveThreadPageBodyState` owns loading/offline/error/empty/transcript; real provider polling owns streaming; composer owns sending/stop/error and retains draft on failure | offline differs from ordinary error; successful zero rows alone enters empty; Panel states and discrete Composer sending/start/complete/stop/failure transitions are bounded outside the transcript token loop; failed send keeps the draft | application lifecycle complete; Lynxtron offers no observable audible-announcement channel                                 |
| Settings                       | canonical storage/theme projections plus explicit hydration/save presentation state                                                                                           | failed hydration has alert + Retry; writes are awaited and serialized; stale completions are ignored; local/server failures retain current values and publish alert copy; saved state is a readable 11px status                             | remaining host audible proof is bounded by the same Lynxtron AX gap                                                        |
| Kanban overview / project      | real Sidebar snapshot → canonical board projection; shared overview/column/state compositions; pure route-state resolvers                                                     | loading/offline/error/not-found/stale distinctions, Retry, last-known-good preservation, no fake cards or three-column false not-found board; real offline→retry→loading→offline runtime proven                                             | successful missing-project presentation is compiler/resolver tested but has no safe product deep-link runtime harness yet  |
| Pull Requests                  | shared list/row/loading/empty composition; real list/detail queries and pin mutation                                                                                          | loading/empty/unavailable use shared status/alert semantics; Native honors list/detail row counts; online empty and owned-server-offline alert have real runtime proof; refresh remains available                                           | list transport taxonomy and selected-detail region remain bounded follow-up, not fake-data or silent-state blockers        |

## Detailed findings

### Critical

#### C1 — Native interactive views are not accessibility nodes

**Current status:** resolved for the representative six-screen application
contract by implementation cut 1. Named consumers publish the official
installed-target attributes. Remaining reading structure and Lynxtron's zero
content children are explicit host/platform limitations.

- **Location:** `slice/src/components/ui/interactive-state.lynx.ts:55-101`
  and its 29 production consumer files under `slice/src/adapters`,
  `slice/src/components`, and `slice/src/app`.
- **Category:** Accessibility / keyboard / native semantics.
- **Baseline evidence:** the pre-cut production-source scan found **0**
  `accessibility-element` and **0** `accessibility-trait` occurrences, versus
  45 `aria-label` and 9 `accessibility-label` occurrences.
- **Current evidence:** cut 1 moved node/name/trait/value into
  `useLynxInteractiveState` and proved representative routed consumers.
  Remaining risk is unlabelled consumers and host AX projection, not absence of
  the central primitive.
- **Impact:** Lynx documents `<view>` as non-accessible by default. Screen
  readers therefore cannot reliably discover, identify, or activate Sidebar,
  Settings, Kanban, PR, composer, Menu, and disclosure controls even though
  DevTool DOM tests can see ARIA attributes.
- **Standard:** WCAG 2.1.1, 4.1.2.
- **Recommendation:** extend the central Native interaction primitive with an
  explicit semantic model (`button` initially), publish
  `accessibility-element=true`, `accessibility-trait="button"`, and
  `accessibility-label`; then migrate product adapters so visible labels,
  expanded/checked/disabled state, and nested decorative text do not create
  duplicate focus points. Verify with source tests plus actual host
  accessibility-tree evidence; DOM outer HTML alone is insufficient.
- **Suggested skill:** `/normalize`, followed by `/polish` only after runtime
  accessibility proof.

### High

#### H1 — Dynamic status changes are visible but silent to assistive technology

**Current status:** resolved at the application layer by implementation cuts
2–4. Shared Panel, Sidebar, PR, Settings, Kanban, and Composer lifecycle states
all use bounded status/alert semantics.

- **Location:** `slice/src/app/router.tsx:253-270`,
  `slice/src/app/FeatureListsPage.tsx:61-65,118-122,250-260,318-324`,
  `slice/src/app/SettingsPage.tsx:280-282`,
  `slice/src/components/composer/Composer.lynx.tsx:391-480,637-639`, and
  shared `PanelStateMessage` / PR state Elements.
- **Category:** Accessibility / system feedback.
- **Baseline evidence:** there was no product use of Lynx
  `accessibilityAnnounce`; state containers lacked a shared status/alert
  contract and `PanelStateMessage` explicitly called itself plain text-only.
- **Current evidence:** cut 2 provides the shared contract and de-duplicated
  Native call for Panel/Sidebar/PR; cut 3 extends it to Settings/Kanban; cut 4
  proves real Composer start/complete and Stop→interrupted transitions without
  entering the transcript token loop.
- **Impact:** a sighted user sees loading complete, offline, mutation failure,
  or send failure without focus moving; a screen-reader user receives no
  equivalent notification.
- **Standard:** WCAG 4.1.3 and 4.1.2.
- **Recommendation:** add a shared state composition with semantic
  `status | alert | empty` intent. Web maps it to `role=status/alert` and
  appropriate live behavior; Native exposes one accessibility text node and
  invokes `accessibilityAnnounce` only on meaningful transitions. Completion
  must be announced when a prior loading state disappears.
- **Suggested skill:** `/harden`.

#### H2 — Settings cannot represent hydration or persistence failure

**Current status:** resolved in implementation cut 3.

- **Location:** `slice/src/app/SettingsPage.tsx:37-123,144-169,172-220,280-282`.
- **Category:** Reliability / accessibility.
- **Evidence:** the initial `readSettings().then(...)` has no rejection branch;
  server thread-mode update failure is console-only; persistence calls are
  detached with `void`; the footer says “changes save immediately” whenever the
  initial read succeeded, not when the latest write succeeded.
- **Impact:** a failed read can leave disabled controls and “Loading…” forever.
  Failed server or local persistence can be represented as success, causing
  settings to revert later without user-visible feedback.
- **Standard:** WCAG 3.3.1, 4.1.3; project reliability requirements.
- **Recommendation:** model `loading | ready | saving | saved | error` with
  last-known-good values, retry for hydration, and non-destructive save failure
  copy. Never roll back the in-memory theme/density merely because the server
  thread-mode write failed.
- **Suggested skill:** `/harden`.

#### H3 — Kanban error and missing-project paths collapse distinct outcomes

**Current status:** resolved in implementation cut 3 at the application layer.
Offline/Retry has production runtime evidence; not-found and stale preservation
are covered by the pure resolver, both compilers, and shared render tests.

- **Location:** `slice/src/app/FeatureListsPage.tsx:43-76,86-135`.
- **Category:** Reliability / UX writing.
- **Evidence:** both overview and project routes render the same “Synara server
  unavailable” for every query error and provide no retry. If
  `selectKanbanProjectBoard` returns null after a successful query, the product
  renders three empty columns rather than a not-found/unavailable state.
- **Impact:** users cannot distinguish connectivity failure from malformed data
  or a removed/deep-linked project, and an absent project is falsely presented
  as an empty valid board.
- **Recommendation:** use a pure bounded state resolver that preserves
  last-known-good board data, separates offline/error/not-found/empty, and owns
  retry capability/copy through a physical-shared composition.
- **Suggested skill:** `/harden` and `/clarify`.

#### H4 — Several state/status colors fail normal-text contrast

**Current status:** resolved for informative text roles in implementation cut 4. Decorative/disabled tertiary roles remain intentionally separate.

- **Location:** generated semantic values in
  `slice/src/generated/native-theme-variables.css:80-152,270-342`, plus
  compounded opacity in `panel-state-message-elements.css:32-35`,
  `pull-request-list-composition-elements.css`, and command/status adapters.
- **Category:** Accessibility / theming.
- **Evidence:** WCAG luminance calculation against canonical surfaces:
  light tertiary 2.66:1, dark tertiary 2.92:1, light success 3.36:1,
  light warning 3.19:1, and dark destructive 4.16:1. Applying `opacity: .7`
  to muted state text reduces light/dark ratios to roughly 2.85:1/3.73:1.
  These are used at 10–12px, not large-text sizes.
- **Impact:** quiet metadata may be intentionally subdued, but actionable error,
  loading, status, and result copy becomes unreadable for low-vision users.
- **Standard:** WCAG 1.4.3 (4.5:1 for normal text), 1.4.11 where color carries
  control/status boundaries.
- **Recommendation:** inventory text roles before changing canonical theme
  math. Keep decorative/disabled tertiary roles separate; map informative state
  text to a >=4.5:1 semantic token and retain icon/shape/text labels so success
  or failure never relies on color alone.
- **Suggested skill:** `/colorize` or `/normalize`.

### Medium

#### M1 — Native PR loading ignores its shared row-count contract

**Current status:** resolved in implementation cut 2. Native now renders the
bounded shared count; detail requests four rows and supplies a detail-specific
loading label.

- **Location:**
  `slice/src/adapters/PullRequestListCompositionElements.lynx.tsx:25-38`;
  caller `slice/src/app/FeatureListsPage.tsx:318-320`.
- **Category:** System state / fidelity.
- **Baseline evidence:** the Elements function accepted `rowCount` but always
  emitted seven rows while the detail dock requested four.
- **Current evidence:** the adapter maps exactly `rowCount` skeleton rows and
  the production build consumes four for detail.
- **Impact:** detail loading has the wrong density/height and can suggest a full
  list replacement rather than a panel-local load.
- **Recommendation:** render exactly the bounded count and add one named loading
  status while hiding decorative skeleton rows from accessibility.
- **Suggested skill:** `/harden`.

#### M2 — Native reading structure is flatter than the shared Web structure

**Current status:** documented platform limitation after representative named
nodes and bounded state regions. It does not block the six-screen application
state contract, but a future host with a visible accessibility tree should
revisit landmark/group navigation.

- **Location:** Native Kanban/PR Elements adapters, especially
  `KanbanOverviewCompositionElements.lynx.tsx`,
  `KanbanColumnCompositionElements.lynx.tsx`, and
  `PullRequestListCompositionElements.lynx.tsx`.
- **Category:** Accessibility / information relationships.
- **Evidence:** Web uses `section`, headings, `ul/li`, and named buttons; Native
  projects these to unlabeled `view`/`scroll-view` containers and default text
  nodes without grouping/order authority.
- **Impact:** assistive navigation cannot identify project/column/list
  boundaries or understand counts in context.
- **Standard:** WCAG 1.3.1, 2.4.6.
- **Recommendation:** aggregate project/column header labels, explicitly order
  accessible children where needed, and prevent decorative glyph/count text
  from becoming unrelated stops.
- **Suggested skill:** `/normalize`.

#### M3 — Streaming needs a bounded announcement policy, not silence or tokens

**Current status:** resolved in implementation cut 4. Composer lifecycle owns
coarse transitions outside transcript measurement/polling; a real provider
start/complete and a real interrupted Stop are runtime-proven.

- **Location:** `slice/src/app/Transcript.tsx` polling/list rendering and
  `slice/src/components/composer/Composer.lynx.tsx` sending/stop state.
- **Category:** Accessibility / performance.
- **Evidence:** real token streaming and completion are implemented and
  previously runtime-proven, but there is no AT transition policy.
- **Impact:** leaving the stream silent hides progress; announcing every 500ms
  poll/token would overwhelm users and add work to the critical transcript loop.
- **Recommendation:** announce coarse transitions only: response started,
  response stopped/failed, and response completed (optionally a short final
  summary). Keep announcements outside `<list>` measurement/follow.
- **Suggested skill:** `/harden` and `/optimize`.

### Low

#### L1 — Settings persistence copy is too small for important feedback

**Current status:** resolved in implementation cut 3. The shared status footer
uses the existing 11px dense informative role at full opacity.

- **Location:** `slice/src/app/App.css` `.SettingsSavedState` (9px).
- **Category:** Typography / accessibility.
- **Impact:** the only visible persistence status is easy to miss even when its
  base muted color meets contrast.
- **Recommendation:** after the state model is corrected, use the shared fine
  text size at no less than the existing 11–12px dense UI roles.
- **Suggested skill:** `/typeset`.

## Patterns and systemic issues

1. **DOM semantics are not Native accessibility semantics.** ARIA attributes
   remain valuable for tests and shared contracts, but official Lynx
   accessibility attributes must be published by the host adapter.
2. **Copy exists before state authority.** Several routes have honest visible
   messages, yet lack retry, last-known-good preservation, or programmatic
   announcement.
3. **Quiet tokens are over-composed.** A canonical muted color that passes AA
   can fail after another component-level opacity is applied.
4. **Streaming accessibility is a performance contract.** The correct solution
   is bounded lifecycle announcements, never per-token live regions.

## Positive findings

- Thread state uses a pure resolver and distinguishes offline from ordinary
  error; successful empty is not confused with loading.
- Existing transcript data, tool/work rows, Kanban cards, PRs, counts, and empty
  states come from real Synara data.
- Composer failure preserves the draft and exposes specific send/stop/mode
  failure copy.
- Sidebar state preserves existing rows during transient revalidation.
- PR already has honest list/detail loading, empty, error, refresh, and mutation
  branches; these can be hardened without replacing its physical-shared
  composition.
- P7-I1 already centralized pointer/pressed/focus/keyboard wiring and added
  accessible labels/states in the DOM model, providing a narrow migration point.
- P7-I4 provides canonical light/dark token values and verified runtime theme
  propagation, so contrast can be fixed by semantic role rather than route-local
  recoloring.

## Implementation order

1. **Native accessibility primitive:** central projection and representative
   Sidebar/Settings/Kanban/PR/Composer consumers are implemented. Continue the
   remaining named Menu/Command/control consumers without exposing unlabeled
   nodes; retain the Lynxtron macOS AX gap explicitly.
2. **Shared state semantics — complete for routed system states:**
   `PanelStateMessage`, PR/Sidebar, Settings and Kanban use
   `status | alert | empty`, exact labels, decorative skeleton hiding, and
   bounded Native announcements.
3. **Settings resilience — complete:** tested loading/ready/saving/saved/error
   authority, retry, awaited persistence, and non-destructive failure feedback.
4. **Kanban route resolver — complete:** loading/offline/error/not-found/ready,
   last-known-good preservation, and retry.
5. **Streaming + contrast — complete:** coarse Composer lifecycle transitions
   are outside the token loop; informative neutral/error/success/warning roles
   meet 4.5:1 in both variants.
6. **Final P7-I5 gate — complete at the application layer:** real runtime
   loading/empty/error/offline/streaming/stop paths, focused tests, both
   production builds, strict serial audits, both diff checks, and SSOT updates
   are closed. The zero-child Lynxtron AX tree remains an explicit host gap.

## Suggested skills for fixes

- `/harden` for state authority, retry, persistence errors, and bounded
  announcements.
- `/normalize` for Native accessibility semantics and reading structure.
- `/colorize` for role-based contrast corrections without creating a second
  palette.
- `/optimize` for streaming announcements outside the transcript critical path.
