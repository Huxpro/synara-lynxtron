# Fidelity Loss Loop completion audit

## Browser lifecycle gate for every loop

Read and satisfy this gate at the start and end of every Fidelity Loss Loop,
including loops that expect to use only Native:

1. Start with `bun run browser:cleanup`. Do not begin discovery while an
   earlier `agent-browser` session, daemon, or agent-browser-owned Chrome
   process remains.
2. Run every command that can open `agent-browser` through
   `bun run browser:run -- <command> [args...]`. Never invoke
   `agent-browser open`, a named session, or a browser helper from an
   unguarded shell.
3. Reuse named sessions inside that one wrapped workflow instead of creating a
   new browser process for each probe.
4. End the loop with `bun run browser:cleanup`, then require both
   `agent-browser session list --json` to contain `sessions: []` and the
   cleanup script to report zero agent-browser-owned browser processes.
5. If preflight or final cleanup fails, stop the loop and repair the harness.
   Do not retain evidence, commit the slice, or continue opening browsers.

The cleanup process must only match agent-browser-owned daemons/profiles.
Unrelated Chrome or remote-debugging processes are never cleanup targets.

## Objective as concrete completion criteria

The active Fidelity Loss Loop is complete only when all of the following are
true:

1. New Web, Lynx-for-Web, and Native screen/state/theme/viewport/interaction
   combinations have been actively discovered rather than replaying a fixed
   manifest.
2. Every retained comparison proves snapshot, state, theme, viewport, DPR,
   renderer identity, process ownership, and capture dimensions before product
   classification.
3. Comparable cells retain screenshot, geometry, style/token, console/relay,
   and behavior evidence as applicable, and every result is represented in a
   loss ledger.
4. The highest-contribution real product loss is fixed at its root without
   changing weights, filtering bad samples, or shrinking the requested scope.
5. Each coherent slice has focused tests, a production build, and the
   renderer-specific runtime evidence needed for its boundary.
6. Each coherent slice is independently committed and pushed with before/after
   loss values, contribution, newly discovered scope, residual risks, and
   evidence paths.
7. Discovery continues until no verifiable new scope remains and all P0/P1
   losses are closed.

Product loss, missing coverage, harness loss, intentional platform delta, and
accepted rendering noise must remain separate. Tests, builds, screenshot count,
manifests, and pixel scores are supporting evidence only.

## Prompt-to-artifact checklist

| Requirement | Concrete evidence inspected | Current result |
| --- | --- | --- |
| 1. Active discovery | `shots/2026-08-14/editor-view/notes.md` records newly discovered wide, compact, medium, light, clean, non-Git, multi-file, Search, Chat-hidden, resize, header, and project-switch states. | Passing for the current loop; discovery is still active. |
| Web authority | Real Web controls were used for Changes file selection, Search, Chat visibility, project switching, theme selection, and settings navigation. Evidence paths are listed per slice in the Editor ledger. | Passing for retained Web cells. |
| Lynx-for-Web | Named isolated browser sessions use real canonical server snapshots. Later current-head cells retain trusted pointer and keyboard interactions for Editor rail/Chat, populated Pull Requests list/detail/tabs/disclosure/close/filters/pins, Plugins search, and Automation controls. | Passing for the newly exercised interaction paths; route-specific untested interactions remain missing coverage. |
| Native | Production bundles build and stage, but no exact-owned Native Editor client can coexist with the user-owned PID `77846` on fixed DevTool port `8901`. | Incomplete; harness blocker, not product loss. |
| 2. Identity preflight | Editor ledger records `.synara-fidelity-editor-changes`, server port `59260`, canonical project/thread/workspace IDs, viewport/DPR/theme, sequential trusted origins, PNG dimensions, and relay identity. | Passing for retained fast-loop cells. |
| Harness mismatch separation | Empty accessibility snapshots, unquoted zsh URL globbing, origin mismatch, capture timing, fixed Native port, and provider CLI absence are explicitly classified separately. | Passing. |
| 3. Screenshot evidence | Retained Editor and populated Pull Requests evidence paths are enumerated in their ledgers. Local screenshot count was rechecked at `85`, below the 100-image cap. | Passing. |
| Geometry evidence | Each Editor slice records measured rail/sidebar/preview/Chat/header boundaries before and after. | Passing. |
| Style/token evidence | Light-theme root, sidebar, selected-row, addition, deletion, divider, and foreground tokens are recorded. | Passing. |
| Console/relay evidence | Retained cells record Web console state and Lynx relay connection count, pending count, RPC tags, transport error, and RPC error. | Passing where applicable. |
| Behavior evidence | Web retained real clicks for changed-file selection, Search, Chat visibility, project switching, and theme. Lynx now retains trusted pointer/keyboard evidence across Editor and populated Pull Requests, while older deterministic-only cells remain labeled as such. | Passing for retained interaction cells; no deterministic projection was relabeled as a click. |
| Ledger update | `shots/2026-08-14/editor-view/notes.md` contains before/after values and residual classifications for every current Editor slice. | Passing. |
| 4. Highest loss first | P1 Editor losses closed include missing Editor/Changes, pre-relay loading, dead center area, hidden patch, compact navigation, cramped preview, clean-copy semantics, non-Git misclassification, medium compression, compact stale width, header hierarchy, and the terminal tab remount that reopened a PTY on every Chat -> Terminal switch. | Passing for discovered local losses. |
| No score manipulation | Loss changes come from product implementation and measured geometry/state changes; no weight/filter/scope reduction was used. | Passing. |
| 5. Focused tests | Relevant Rstest/Vitest suites were run after each slice. Current-head examples include compact Editor 12/12, populated PR route/detail 20/20 plus shared Web tabs 2/2, disclosure/close 6/6, filters 16/16, pins 16/16, Editor history 11/11, New chat 8/8, and terminal preservation 10/10. | Passing for committed slices. |
| Production build | Root `CI=1 bun run build` passed 6/6 after the latest code slice, staging Web, Lynx, Desktop, and server artifacts. Existing optional `bufferutil` / `utf-8-validate`, unsupported CSS, and `original-fs` external warnings remain named. | Passing. |
| Web validation | Real Web authority cells were captured for every paired Editor slice. | Passing. |
| Lynx validation | Real canonical RPC data, geometry, tokens, and relay state were captured for every paired Editor slice. | Passing. |
| Native validation | Exact-owned Native Editor certification was not performed because the workspace executable and user-owned app contend for the fixed DevTool listener. | Incomplete harness boundary. |
| 6. Independent commits | Recent coherent slices include interaction/audit/evidence commits through `024f036d3`; every code/evidence slice was pushed immediately. | Passing. |
| Commit trailer | Recent commit messages were checked and contain exactly one `Co-authored-by: TRAE CLI <noreply@bytedance.com>` trailer. | Passing. |
| Remote state | Local `HEAD` and `origin/huxcx/lynxtron-port-current-state` were repeatedly compared after push. | Passing at `024f036d3` before this audit-only correction. |
| Working tree hygiene | Only pre-existing `.p10-view/` and `.p10-view-native/` remain untracked and untouched. | Passing. |
| 7. No new scope | New Editor states continued to produce real P1/P2 findings, so exhaustion has not yet been proven. | Not achieved. |
| All P0/P1 closed | Local discovered product P1 losses are closed. The former `lynx-web-pointer-to-bindtap` blocker was closed by the ReactLynx background-snapshot patch plus the Composer stable-snapshot fix, then verified through multiple real dynamic product interactions. | Passing for discovered P0/P1 losses; discovery exhaustion and Native coverage remain separate completion requirements. |

## Verifier coverage audit

- Focused tests cover contracts and source wiring but cannot prove browser event
  publication, exact Native input semantics, or visual geometry by themselves.
- `CI=1 bun run build` proves bundle production/staging, not behavior.
- The host-input probe alone was never treated as a global interaction pass.
  Later real product evidence closes the dynamic-handler boundary: Editor
  Changes/Files/Search and Chat controls, Pull Requests list/detail/tabs/code
  disclosure/close/filter/pin controls, Plugins search, and Automation
  controls all publish through current-head dynamic handlers.
- Deterministic init states still prove only rendering/data projection for the
  older cells that were not rerun; they are not retroactively relabeled.
- Web screenshots with empty accessibility/`innerText` extraction were rejected
  unless direct product-node DOM and geometry proved the state.
- Native production builds do not certify the running executable, staged
  bundle, PID-derived client, focus, IME, accessibility, restart, or persistence.

## Missing and uncovered requirements

1. **Closed P1, retained historical boundary:** `lynx-web-pointer-to-bindtap`
   moved from `1.00 -> 0.00`. The runtime patch preserved background callback
   functions, and the Composer fix stopped synchronous render recursion from
   starving event RPC. Older route-specific deterministic cells still need
   their own interaction reruns before those individual controls are claimed.
2. **Native certification:** exact-owned Editor cells remain blocked while the
   user-owned PID `77846` occupies the fixed DevTool port `8901`.
3. **P2 Editor coverage:** Chat-history navigation, New chat trigger, terminal
   tab lifecycle, and project switching to an existing target thread now have
   current-head trusted interaction evidence. Project switching to a project
   with no thread and New chat first-send/provider promotion remain coverage.
4. **Discovery exhaustion:** other route/state/theme/viewport combinations have
   not been proven exhausted.

## Current continuation checklist

| Explicit requirement | Current artifact or command evidence | Audit result |
| --- | --- | --- |
| Discover new scope | `editor-compact-interactions/`, `pull-requests-populated-interactions/`, Editor history/New chat/terminal-tab continuations | Passing; multiple new viewport/state/interaction cells produced one new P1. |
| Same snapshot/state/theme/size/capture identity | `.synara-fidelity-editor-changes`, `.synara-fidelity-pull-requests-populated`, relay diagnostics, bundle hashes, viewport/PNG dimensions | Passing for retained cells; stale Web bundles, `dev/` vs `userdata/`, pending list frames, and empty authority frames were rejected. |
| Canonical mutations only | `orchestration.dispatchCommand` project/thread setup, live `pullRequests.*`, local `pullRequests.setPinned`, terminal RPCs | Passing; SQLite was read-only and the pin/title round trips were restored. |
| Screenshot/geometry/styles/console/behavior | Retained JSON/PNG/error/console files under the current evidence directories | Passing for retained browser cells; no Native pass inferred. |
| Highest real loss fixed | `lynx-editor-terminal-tab-remount` in `router.tsx`, `App.css`, and `ThreadEditorView.lynx.test.ts` | Passing: `terminal.open` count `2 -> 1`; confirmed close emits one `terminal.close`. |
| Focused tests | Editor/Terminal 10/10, Editor history 11/11, New chat 8/8, PR route/detail 20/20, PR follow-ups 6/6 + 16/16 + 16/16 | Passing. |
| Production builds | Root `CI=1 bun run build` 6/6 and explicit `bun run --cwd apps/lynx build:web` | Passing; explicit Web build was necessary because the root build does not refresh `apps/lynx/dist/web`. |
| React diagnostics | `pnpm dlx react-doctor@latest --scope lines --base <parent> --blocking warning --no-score --json` | Passing: 0 errors, 0 warnings for `024f036d3`. |
| Independent commit/push | `a4455c292`, `5f9a360d7`, `7c727870b`, `7bf64575c`, `952131864`, `b3d50a135`, `e350ffc9e`, `d1139126b`, `2410d90eb`, `bfd103b8d`, `024f036d3` | Passing; each commit has exactly one TRAE co-author trailer. |
| Browser/process cleanup | `bun run browser:cleanup`, `session list --json`, owned-port checks, PTY process checks | Passing after every retained cell; current session count is zero. |
| Screenshot cap | `find shots -type f -name '*.png' \| wc -l` | Passing at 85. |
| All P0/P1 closed | Current ledgers plus the terminal remount before/after evidence | Passing for discovered product losses. |
| No remaining verifiable scope | Project switch, Native certification, first-send provider promotion, and other route-specific cells remain | **Not achieved.** |

## 2026-08-16 continuation

- Active discovery added a new populated project-board × compact × dark × card
  action × cancel/pin round-trip cell under
  `shots/2026-08-16/kanban-card-actions-compact/`.
- The initial Lynx chooser passed containment and cancel restoration but exposed
  a real P2 capability loss: it omitted Pin/Unpin, Copy Path, Copy Thread ID,
  and Delete even though those platform ports already exist and Web exposes the
  same card actions.
- The complete action policy now lives in shared
  `apps/web/src/components/kanban/kanbanMutation.logic.ts`; Web's context menu
  and Lynx's chooser consume one action order/copy/capability model.
- Post-fix runtime evidence shows eight contained controls, canonical
  Pin -> Unpin dispatches, a visible pin projection, action-copy transition,
  zero pending RPCs/errors, and exact restoration of the read-only thread
  projection.
- `lynx-kanban-card-action-capability-parity`: P2 contribution
  `1.00 -> 0.00`.
- Focused tests pass `13/13` Web and `15/15` Lynx. Root production build passes
  `6/6`, explicit Lynx-for-Web production build passes, and React diagnostics
  report zero errors/warnings.
- Web authority attempts remain excluded: two startup attempts failed harness
  readiness, and the corrected split server/Vite run hydrated an empty Web
  board against the populated canonical snapshot. No empty frame is counted as
  a Web pass or product regression.
- Native card actions remain missing certification coverage. Discovery
  exhaustion is still not proven, so the active objective remains incomplete.

## 2026-08-16 narrow Kanban continuation

- Active discovery added a `320x568` populated Kanban project-board cell rather
  than replaying the existing `390x844` evidence.
- The complete eight-action chooser remained contained, but Rename exposed a
  P2 shadow-textarea box-model loss: the input exceeded the panel by `9px` and
  its padded content edge by `21px`.
- `KanbanMutationTextarea` now compensates the shadow control's horizontal
  padding and border with `width:calc(100% - 22px)`.
- Fresh runtime evidence records padded-content overflow `21px -> 0px`, real
  keyboard editing, Cancel restoration, zero dispatches, and an unchanged
  thread projection.
- `lynx-kanban-mutation-textarea-content-overflow`: P2 contribution
  `1.00 -> 0.00`.
- Focused coverage passes `10/10` plus the dedicated `1/1` regression; root
  production build passes `6/6`, explicit Web bundle build passes, and React
  diagnostics report zero warnings/errors.
- Native ownership contention is no longer current, but certification remains
  blocked for a different harness reason: the restored official
  `@lynx-js/lynxtron@0.0.9` host renders the exact-owned app without publishing
  a DevTool listener/client. The owned process was stopped and no Native
  product pass or failure was inferred.

## 2026-08-16 empty-project Editor continuation

- The previously explicit Editor residual, switching to an ordinary project
  with no thread, produced a real P2 functional loss: the option was disabled
  and labeled `No chats yet`.
- Editor project switching now resolves current/existing-thread/project-draft
  targets through one pure helper. Empty projects open the existing Editor rail
  New chat composition scoped to that project; first send will reuse the
  existing `onThreadCreated` navigation path.
- A temporary zero-thread project was created and deleted through canonical
  orchestration commands. Retained runtime evidence shows the enabled
  `New chat` option, target-project landing/composer, unchanged main Editor
  route, zero created threads, settled RPCs, and successful canonical cleanup.
- `lynx-editor-project-switch-empty-project`: P2 contribution `1.00 -> 0.00`.
- Focused tests pass `10/10`; root build passes `6/6`, explicit Web build
  passes, and React diagnostics report zero warnings/errors.
- Editor first-send/provider promotion and Native certification remain
  uncovered, so completion is still not achieved.

## 2026-08-16 Editor first-send continuation

- The empty-project Editor draft now has retained real first-send evidence.
- A canonical temporary project was selected through the fixed switcher, the
  exact prompt `Reply READY_EDITOR_PROMOTION only.` was entered, and the
  rendered Send control created a durable thread and started a real Codex turn.
- The existing `onThreadCreated` path preserved Editor mode while promoting the
  rail from draft to the new thread. The transcript rendered the expected
  provider reply and all RPCs settled cleanly.
- The temporary thread and project were then canonically deleted; no files were
  created and all pre-existing threads remained unchanged.
- `lynx-editor-empty-project-first-send-promotion`: P2 contribution
  `0.25 -> 0.00`.
- The Editor empty-project draft/first-send residual is closed for the fast
  Lynx-for-Web loop. Native IME/provider/continuation certification and global
  discovery exhaustion remain open.

## 2026-08-16 Web authority hydration and toast continuation

- The recurring empty Web Kanban frame was isolated to cold Vite dependency
  optimization: the same page was empty at five seconds, populated at thirty
  seconds, and populated after a warm reload. Retained Web authority cells now
  wait for a named product control instead of using a fixed short delay.
- The valid populated Web cell exposed a new P1: the persistent provider-update
  toast body covered the first compact Kanban card action at z-index 9999 and
  intercepted pointer input.
- Toast roots/content now pass background pointer events through, while Copy,
  primary/secondary actions, close, and archive undo remain interactive.
- Post-fix hit testing proves both the card action and `Review updates` button
  are independently reachable. The real card action opens the complete
  six-item Web context menu and Escape closes it without mutation.
- `web-toast-background-pointer-shield`: P1 contribution `1.00 -> 0.00`.
- Focused toast tests pass `6/6`, root/Web production builds pass, and React
  diagnostics report zero warnings/errors.
- The Web populated-hydration blocker is no longer a valid missing-coverage
  reason when the warm named-control gate is used. Native certification and
  discovery exhaustion remain open.

## Completion decision

The active objective is **not achieved**. No `update_goal complete` call is
permitted while the Native certification boundary, route-specific missing
interaction coverage, and discovery-exhaustion requirement remain open. The
former dynamic-event P1 is no longer a valid blocker.

## 2026-08-16 Native runtime bootstrap continuation

- The temporary published `@lynx-js/lynxtron@0.0.9-dev` host restored an
  exact-owned PID-derived DevTool client for the current staged workspace
  bundle without changing repository dependencies.
- The first current-head Native startup exposed two new P1 runtime losses
  before route certification: an undeclared `crypto` probe in the shared UUID
  helper, followed by top-level `Intl.DateTimeFormat` construction in the
  shared automation projection.
- UUID generation now probes `globalThis.crypto` safely, and workspace IDs
  reuse that helper instead of maintaining a second unsafe fallback.
  Automation timestamp formatting now probes `globalThis.Intl` lazily and has
  deterministic local date/time fallbacks for PrimJS.
- `native-runtime-missing-crypto`: P1 contribution `1.00 -> 0.00`.
- `native-runtime-missing-intl`: P1 contribution `1.00 -> 0.00`.
- The final exact-owned client points to the staged `main.lynx.bundle`,
  completes canonical RPC bootstrap, has an empty warning/error console, and
  renders the populated Kanban project board with two real cards. The retained
  frame is `2560x1640`; evidence is under
  `shots/2026-08-16/native-runtime-bootstrap/`.
- `Input.emulateTouchFromMouseEvent` returned success at the card-action box
  center but did not dispatch its `catchtap`; this is classified as a Native
  DevTool interaction harness limitation. The action chooser is not claimed as
  Native interaction-certified from this cell.
- Focused tests pass `5/5` shared plus `13/13` Web, explicit Native/Desktop
  build passes, staged/output bundle hashes match, and the staged bundle
  contains zero bare `typeof crypto.randomUUID` probes.
- Native startup/populated-structure certification is restored. Native
  card-action interaction coverage and global discovery exhaustion remain
  open, so the objective is still incomplete.

## 2026-08-16 Native Automations detail continuation

- Active discovery added the first current-head exact-owned Native populated
  Automations list-to-detail interaction in light mode at `1280x820`.
- A disabled/manual definition was created through canonical
  `automation.create`; it produced zero runs and was removed through canonical
  `automation.delete`. Snapshot sequence `4` and the original project/thread
  remained unchanged.
- A real Native touch on the rendered `720x44` automation row opened the
  read-only detail. The exact client retained `Manual`, `Paused`, project,
  model, execution settings, and `No runs yet.` with an empty warning/error
  console.
- Web and Native match the `704px + 320px` columns and exact
  `(288,78,640x32)` title. Details and Previous runs differ by one Native
  whole-pixel step, classified as accepted rendering noise.
- `native-automations-populated-detail-coverage`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- The same snapshot's Web authority was valid. Initial Lynx-for-Web probes
  incorrectly treated light-DOM/`innerText` emptiness as an empty product,
  collided with a pre-existing IPv6 `localhost:8080` dev server, and then used
  an origin not configured as the server's trusted `devUrl`. Those cells are
  invalid harness evidence, not product failures.
- The corrected shadow-root probe on an unambiguous trusted origin renders the
  canonical Automations empty state with one relay connection and no
  transport/RPC error. It also isolated one real harness packaging loss:
  four Web-owned absolute icon URLs returned 404 because the standalone build
  did not stage the public icon directories. Both canonical icon directories
  are now copied and those requests return 200.
- Browser preflight/failure/success paths all ran through `browser:run` and
  ended with `sessions: []` and zero owned browser processes.
- Evidence is under
  `shots/2026-08-16/native-automations-detail-current/`. The retained frame is
  `2560x1640`, and the repository now has exactly 100 local screenshots.
- No new P0/P1/P2 product loss was found in this scope. Native Automations
  coverage is improved and this Lynx-for-Web harness path is repaired, but
  other Native route/state/theme/size interactions and discovery exhaustion
  remain open.

## 2026-08-16 Native Automations action continuation

- Active discovery added the first current-head exact-owned Native
  Resume/Pause mutation roundtrip for a disabled/manual automation.
- A real touch opened the rendered Paused row; real touches on the rendered
  Resume and Pause controls dispatched canonical `automation.update`.
- Server projection and Native detail changed
  `Paused/Resume -> Active/Pause -> Paused/Resume` without reload. No provider
  run or worktree was created, runs remained zero, and the exact-client
  warning/error console stayed empty.
- Canonical delete restored zero definitions/runs while preserving snapshot
  sequence `4` and the original project/thread.
- `native-automations-resume-pause-interaction`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- A server-only preflight initially selected the isolated `userdata/` database
  instead of the intended `dev/` snapshot. The project identity gate rejected
  canonical create before any definition was written; the sequence-zero
  directory was removed. This is harness identity evidence, not product loss.
- No new P0/P1/P2 product loss was found. Other Native interactions, theme/size
  cells, and discovery exhaustion remain open.

## 2026-08-16 Native Automations edit continuation

- Active discovery added the first current-head exact-owned Native Edit dialog
  initial-value and Cancel no-mutation path.
- Real touches opened the automation row and Edit control. The dialog retained
  the canonical name/prompt, Save was disabled before changes, and a real
  Cancel touch unmounted the dialog while keeping the detail open.
- Server name, prompt, and `updatedAt` remained exactly unchanged; runs stayed
  zero and the exact-client warning/error console was empty.
- Canonical delete restored zero definitions/runs.
- `native-automations-edit-cancel-interaction`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 product loss was found. Native edited-value/Save behavior,
  other route/theme/size interactions, and discovery exhaustion remain open.

## 2026-08-16 compact Automations detail continuation

- Active discovery added a new Web and Lynx-for-Web
  `320x568`/DPR 1/light list-to-detail interaction cell.
- The valid before state exposed a shared P1 responsive loss: the fixed
  horizontal detail row plus `320px` aside collapsed Web main content to
  `48px` and Lynx main content to `0px`; both titles had `0px` content width.
- Both renderers now stack the prompt and details panes below the small-screen
  breakpoint while preserving the existing wide `704px + 320px` contract.
- Final compact geometry is a `320x200` prompt pane above a `320x368` detail
  pane. Web main width is `48px -> 320px`; Lynx main width is
  `0px -> 320px`; the details pane scrolls independently without horizontal
  overflow.
- `shared-automation-detail-compact-collapse`: P1 contribution
  `1.00 -> 0.00`, with Web and Lynx component contributions each
  `1.00 -> 0.00`.
- Focused coverage passes Web `33/33` and Lynx `6/6`; explicit
  Lynx-for-Web production build passes. The final Lynx cell has one relay
  connection, zero pending requests, no transport/RPC error, and empty page
  errors.
- Canonical cleanup restored zero definitions/runs and preserved sequence `4`.
  No screenshot was added because the repository remains at the 100-image cap.
- Other Native route/state/theme/size interactions and discovery exhaustion
  remain open.

## 2026-08-16 Native Automations stale-link continuation

- Active discovery added an exact-owned Native cold-start deep link to a
  missing automation against the canonical empty automation list.
- The correct `Automation not found.` state rendered. A real touch on the
  rendered Back to automations button navigated to the ordinary empty list and
  unmounted the not-found subtree.
- Automation definitions/runs remained empty and the exact-client
  warning/error console stayed clean.
- `native-automations-stale-link-recovery`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 loss was found. Other Native route/state/theme/size
  interactions and discovery exhaustion remain open.

## 2026-08-16 Native Automations dark continuation

- Active discovery added the first current-head exact-owned Native Automations
  dark-theme list-to-detail cell at `1280x820`.
- An isolated KV preloaded only canonical `synara:theme=dark`; root/canvas and
  foreground resolved to `rgb(16,16,16)` / `rgb(252,252,252)`.
- A real row touch opened detail. Wide geometry remained exact at
  `704px + 320px`, title `(288,78,640x32)`, and group/No-runs dark tokens
  resolved to `rgba(252,252,252,0.576471)` with canonical typography.
- Exact-client warning/error console stayed empty, canonical cleanup restored
  zero definitions/runs, and the isolated theme/runtime directories were
  removed.
- `native-automations-dark-list-detail`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 loss was found. Native larger-size and remaining interaction
  cells plus global discovery exhaustion remain open.

## 2026-08-16 Native Automations 1440 continuation

- Active discovery added exact-owned Native Automations dark at `1440x900`.
- The root reported the intended viewport and retained a `256px` sidebar,
  `1184px` page, centered `768px` list rail, and `704px` title/row rail.
- A real row touch opened detail. The wider split remained `864px + 320px`,
  while prompt/title stayed bounded to `704px`; the aside retained its
  canonical `287px` content rail.
- Exact-client warning/error console stayed empty; canonical cleanup restored
  zero definitions/runs and removed isolated theme/window/runtime state.
- `native-automations-dark-1440-detail`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 loss was found. Remaining Native interactions and global
  discovery exhaustion remain open.
