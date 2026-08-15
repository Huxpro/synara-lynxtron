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

## 2026-08-16 Native Automations create-dialog continuation

- Active discovery added the first current-head exact-owned Native New
  automation dialog open/cancel cell against an empty automation list.
- A real New automation touch opened the dialog. It retained the complete
  project/model/schedule/workspace/mode/time/iteration/error/interaction/
  permission structure and canonical default selections.
- Model discovery settled from `Choose model` to `GPT-5.6 Sol`; empty required
  fields kept Create automation disabled.
- A real Cancel touch unmounted the dialog and restored the empty list. The
  server remained zero definitions/runs and the exact-client warning/error
  console stayed empty.
- `native-automations-create-dialog-cancel`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 loss was found. Native create submission/input semantics,
  remaining interactions, and global discovery exhaustion remain open.

## 2026-08-16 Native populated Pull Requests continuation

- Active discovery moved to a new screen and added the first current-head
  exact-owned Native populated Pull Requests list-to-detail-to-list cell.
- Canonical RPC returned 50 open entries across two repositories with zero
  source errors. The first Native row was `960x48` at `(272,165)`.
- A real row touch opened PR `#693` in a `512x774` detail dock with Summary,
  Timeline, and Code tabs. A real close touch removed the dock and restored all
  50 rows.
- Exact-client warning/error console stayed empty; no pull request mutation was
  performed.
- `native-pull-requests-populated-list-detail`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Evidence is under
  `shots/2026-08-16/native-pull-requests-populated-current/`. No screenshot was
  added because the local count remains capped at 100.
- No new P0/P1/P2 loss was found. Populated detail tab interactions, Native
  theme/size axes on this screen, other routes, and discovery exhaustion remain
  open.

## 2026-08-16 Native Pull Requests tab continuation

- Active discovery exercised exact-owned Native Summary -> Timeline -> Code ->
  Summary with real touches on a populated PR detail.
- Timeline mounted real event rows; Code mounted the code surface and
  dispatched canonical `pullRequests.diff`; Summary restored overview,
  description, checks, and comments. The exact-client warning/error console
  stayed empty and no PR mutation occurred.
- The upstream list gained PRs `#698/#697/#696` between runs. A fresh canonical
  list proved the current first row was `#697`, matching both detail and Code
  RPC identity. This is external list evolution, not a row-recycling defect.
- `native-pull-requests-detail-tabs`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 loss was found. Native PR theme/size axes, remaining
  interactions, other routes, and discovery exhaustion remain open.

## 2026-08-16 Native Pull Requests pin continuation

- Active discovery added the first exact-owned Native Pin -> Unpin roundtrip
  for current PR `#699`, identified by project/repository/number rather than
  list index.
- Real touches dispatched canonical `pullRequests.setPinned`; canonical and
  Native states changed
  `unpinned -> pinned -> unpinned`, including aria pressed/value/label and
  visual class updates.
- Pinning moved the row into the pinned group, shifting its control upward;
  the second touch used the remeasured pinned-group box. Final canonical state
  exactly matched the initial `isPinned:false` state.
- Exact-client warning/error console stayed empty and no GitHub PR data was
  changed.
- `native-pull-requests-pin-roundtrip`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 loss was found. Native PR theme/size axes, remaining
  interactions, other routes, and discovery exhaustion remain open.

## 2026-08-16 Native populated Pull Requests dark continuation

- Active discovery added the first exact-owned Native populated PR dark-theme
  list-to-detail cell at `1280x820`.
- The canvas/foreground resolved to `rgb(16,16,16)` /
  `rgb(252,252,252)`, 50 rows retained their canonical geometry, and a real row
  touch opened the `512x774` detail dock.
- Dock surface resolved `rgb(17,17,17)`; Summary title was `18px/24px/600`,
  section titles were `14px/20px/500`, and the exact tabs geometry remained.
- The probe waited for detail RPC settlement, the exact-client warning/error
  console stayed empty, no PR mutation occurred, and isolated theme/runtime
  state was removed.
- `native-pull-requests-populated-dark-detail`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 loss was found. Native PR larger-size and remaining
  interaction cells, other routes, and discovery exhaustion remain open.

## 2026-08-16 Native populated Pull Requests 1440 continuation

- Active discovery added exact-owned Native populated PR dark at `1440x900`.
- The list retained a `256px` sidebar, `1184px` route page, centered `968px`
  filter/list rails, and `960x48` row surfaces.
- A real row touch opened the responsive `592x854` detail dock, exactly half
  the route body. Tabs remained `218x28`, settled Summary used the full dock,
  and the exact-client warning/error console stayed empty.
- No mutation occurred; isolated theme/window/runtime state was removed.
- `native-pull-requests-populated-dark-1440-detail`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 loss was found. Remaining Native interactions, other routes,
  and discovery exhaustion remain open.

## 2026-08-16 Native plugin-library continuation

- Active discovery moved to another screen and found a P1 Native reachability
  loss: ReactLynx implemented `/plugins`, but the desktop shell did not accept
  `synara://plugins` and the Native sidebar had no Plugins entry.
- The shell now maps `synara://plugins` to `/plugins`; focused route tests pass
  `14/14` and the explicit Native/Desktop build passes.
- Exact-owned cold start opened PluginLibraryPage directly. Real touches
  switched Codex -> Claude and Plugins -> Skills.
- Claude Plugins rendered the canonical unsupported state; Claude Skills
  rendered 118 real rows with the expected two-column geometry.
- Codex Plugins reported `codex not found in PATH`, classified as environment
  loss rather than Native UI loss. The exact-client warning/error console
  remained empty and no mutation occurred.
- `native-plugin-library-deep-link-reachability`: P1 contribution
  `1.00 -> 0.00`.
- Evidence is under
  `shots/2026-08-16/native-plugin-library-current/`; no screenshot was added at
  the 100-image cap.
- Other Native Plugin theme/size/search states, remaining routes, and global
  discovery exhaustion remain open.

## 2026-08-16 Native Plugin Library dark 1440 continuation

- Active discovery added the exact-owned Native Plugin Library dark-theme,
  `1440x900`, Claude Skills populated cell.
- Real rendered-control touches switched Codex -> Claude and Plugins -> Skills;
  the final tree contained 118 actual `PluginLibraryRow` nodes.
- The route retained a `256px` sidebar, `1184px` page, `860px` content rail,
  `812px` title/row rail, and canonical `405x70` two-column skill rows.
- Dark tokens resolved to `rgb(16,16,16)` canvas,
  `rgb(252,252,252)` title/row foreground, muted
  `rgba(252,252,252,0.576471)`, and enabled `rgb(16,185,129)`.
- Desktop LynxView rejected unsupported `Input.dispatchTouchEvent`; the
  supported `Input.emulateTouchFromMouseEvent` product path succeeded. The
  rejected call is harness API mismatch, not product loss.
- Exact-client warning/error console stayed empty and no plugin, skill,
  provider, or settings mutation occurred.
- `native-plugin-library-claude-skills-dark-1440`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- No new P0/P1/P2 product loss was found. Plugin search/enable interactions,
  remaining routes, and global discovery exhaustion remain open.
- Agent-browser leakage is now a per-loop invariant in the repository
  instructions, verification playbook, loss method, and cell notes template:
  every discovery/fast/Native loop runs cleanup at entry and exit; any
  nonempty session or owned process is harness failure that blocks evidence,
  commit, push, and the next loop. This loop's gate passed with
  `sessions: []` and zero owned browser processes.

## 2026-08-16 Native Update continuation

- Active discovery moved to another current-head top-level screen and added
  exact-owned Native `/update` light at `1280x820`.
- `/update` is a Lynxtron-only application-update surface with no Web
  equivalent. The missing Web cell is an intentional platform delta, not
  product loss.
- The real GitHub release authority returned HTTP `200` and current tag
  `v0.7.2`; Native rendered Installed `v0.5.5-lynx.0`, Latest release
  `v0.7.2`, and `A newer release is available.`
- The centered `560x420` card retained complete mark, title, description,
  `490x90` version panel, status, and two-action geometry with canonical light
  tokens.
- A real rendered-control touch on `Check for updates` issued a second
  `updaterCheck`, returned to the same complete result, and restored the
  enabled action label. Exact-client warning/error console stayed empty.
- `Open download page` was not activated because it intentionally calls
  `shell.openExternal`; avoiding an external browser side effect leaves that
  handoff explicitly unverified rather than inferred.
- `Accessibility.getFullAXTree` is unsupported by Desktop LynxView, and one
  zsh newline-list probe required a Bash-array retry. Both are harness
  boundaries, not product losses.
- Focused Update tests pass `5/5`; Native/Desktop production build passes and
  output/staged bundles are byte-identical.
- `native-update-available-retry-light-1280`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Evidence is under `shots/2026-08-16/native-update-current/`. No screenshot
  was added at the 100-image cap.
- No new P0/P1/P2 product loss was found. Update dark/1440, network-error
  retry, external-download handoff, other routes, and global discovery
  exhaustion remain open.

## 2026-08-16 Native Studio continuation

- Active discovery moved to the shared Studio surface. The existing
  `shots/2026-08-14/studio/` Web/Lynx-for-Web pair remained the composition
  authority, while this continuation used a fresh exact-owned Native snapshot
  rather than claiming cross-run capture identity.
- Fresh Native cold start exposed a P1 correctness loss before Studio
  navigation: two different `project.create` commands persisted two live Home
  containers for `/Users/bytedance`, 83ms apart.
- Root cause was a split landing-bootstrap query key. The outer landing owner
  used init-data `null`; the inner composer independently fell back to
  `codex`, so both side-effectful queries ran concurrently.
- A shared provider resolver now makes both owners use the same resolved
  provider/query key. Fresh exact-owned reruns retained exactly one Home and,
  after a real Studio segmented-control touch, exactly one Studio container.
- `native-landing-duplicate-home-bootstrap`: P1 contribution
  `1.00 -> 0.00`.
- The same run actively exercised the previously unverified Native
  `Use a folder` interaction and found another P1: opening the picker crashed
  with `ReferenceError: FolderIcon is not defined`, leaving an expanded trigger
  without a popup.
- Importing the canonical `FolderIcon` closed the runtime defect. Final real
  touches opened a visible project-picker popup with `Search folders`,
  `Choose a folder`, and `Don't use a folder`, then backdrop dismissal restored
  `aria-expanded=false` and unmounted it.
- `native-studio-folder-picker-runtime-crash`: P1 contribution
  `1.00 -> 0.00`.
- Final exact-client warning/error console was empty. Focused tests pass
  `8/8`; Native/Desktop production build passes with output/staged hashes
  identical.
- Evidence is under `shots/2026-08-16/native-studio-current/`; no screenshot
  was added at the 100-image cap.
- Native dark/1440, actual system folder-dialog selection/cancel, selected-folder
  first send, restored populated Studio threads, other routes, and global
  discovery exhaustion remain open.

## 2026-08-16 Native Workspace continuation

- Active discovery moved to Workspace, whose synchronized Web/Lynx-for-Web
  evidence already covered terminal transport, split presets, ordering, and
  settings but explicitly left exact-owned Native unverified.
- A P1 reachability loss remained: the desktop shell parsed
  `workspaceVisible=open` and `workspaceSettings=open` but mapped
  `synara://workspace` to `/`, so standard Native cold start could not reach
  Workspace.
- The shell now maps root and ID-scoped Workspace deep links. Focused route
  tests cover both route forms plus combined init data.
- `native-workspace-deep-link-reachability`: P1 contribution
  `1.00 -> 0.00`.
- Exact-owned cold start mounted `WorkspacePage`, restored `Workspace 1`,
  opened the settings dialog, and issued real `terminalOpen` for `default`
  against the isolated `ws://127.0.0.1:58090` endpoint.
- A real `Two Columns` preset touch persisted the shared Workspace KV, opened
  real second terminal `workspace-2`, and mounted two `512x774` terminal panes.
  Closing the dialog retained the two-column grid.
- Exact-client warning/error console stayed empty. Focused tests pass `21/21`;
  Native/Desktop production build passes with output/staged hashes identical.
- Native keyboard text injection is unsupported by the current DevTool CDP
  surface, so command typing/confirm remains missing interaction coverage
  rather than an inferred pass.
- Evidence is under `shots/2026-08-16/native-workspace-current/`; no screenshot
  was added at the 100-image cap.
- Remaining Native Workspace scope includes typing/confirm, close/reopen,
  rename, creation, ordering, deletion, dark, compact, and `1440x900`.

## 2026-08-16 Native Workspace lifecycle continuation

- Active discovery extended the exact-owned Workspace screen through a fresh
  create -> reorder -> delete lifecycle instead of repeating the default page.
- Real `New workspace` created and activated `Workspace 2`; real
  `Move Workspace 2 up` changed both rendered order and shared KV to
  `Workspace 2`, `Workspace 1`.
- Real `Delete workspace` removed the active temporary page, restored
  `Workspace 1` as the sole active page, and persisted the one-page KV.
- Host evidence recorded `terminalClose` for Workspace 2's `default` PTY with
  `deleteHistory:true` against the isolated endpoint. No `exit` write was
  expected because the terminal had no command history.
- Exact-client warning/error console stayed empty and all owned runtime/state
  was removed.
- `native-workspace-create-reorder-delete`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Remaining Workspace scope is rename, command typing/confirm, close/reopen
  confirmation, multi-pane deletion, restart persistence, and theme/size axes.

## 2026-08-16 Native project-scoped New Thread continuation

- Active discovery moved to the shared project-scoped fresh-draft route, whose
  Web/Lynx-for-Web pair existed but exact-owned Native remained unverified.
- A P1 reachability loss remained: the desktop shell did not map
  `synara://new-thread/<projectId>`, so standard Native cold start fell through
  to `/`.
- The shell now maps non-empty encoded project IDs and rejects the empty form.
  `native-new-thread-deep-link-reachability`: P1 contribution
  `1.00 -> 0.00`.
- A project fixture was created and verified through canonical negotiated RPC:
  `Native Fidelity`, `/Users/bytedance/github/synara`,
  `codex / gpt-5.6-sol`.
- Exact-owned cold start rendered `New thread`,
  `What should we do in Native Fidelity?`, `GPT-5.6 Sol`, `Full access`, and
  the `synara` project picker with the established wide geometry.
- Read-only projection verification confirmed zero durable threads before
  first send, matching the draft contract. Exact-client warning/error console
  stayed empty.
- The explicit project and landing-created Home container were removed through
  canonical `project.delete`; final state was 0 live projects and 0 threads.
- Focused tests pass `19/19`; Native/Desktop build passes with output/staged
  hashes identical.
- Evidence is under `shots/2026-08-16/native-new-thread-current/`; no screenshot
  was added at the 100-image cap.
- Native textarea/IME, first-send promotion, provider/project interactions,
  and theme/size axes remain open.

## 2026-08-16 Native route/deep-link matrix continuation

- A machine-readable audit compared all Native memory-router routes against all
  desktop shell deep-link hostnames after the Workspace and project-draft
  fixes.
- Studio was the only remaining supported route without a standard desktop
  deep link. `synara://studio` previously fell through to `/`; it now maps to
  `/studio`.
- Fresh exact-owned cold start rendered Studio directly with Studio active,
  `New Chat`, `What should we work on?`, and `Use a folder`.
- Read-only projection showed exactly one Studio container and no Home
  pollution. Exact-client warning/error console stayed empty.
- Canonical cleanup returned the snapshot to 0 live projects / 0 threads.
- `native-studio-deep-link-reachability`: P1 contribution
  `1.00 -> 0.00`.
- Focused tests pass `19/19`; Native/Desktop build passes. The router/hostname
  matrix now has no known route-level desktop deep-link gap.

## 2026-08-16 Native Workspace terminal lifecycle continuation

- Active discovery returned to a distinct Workspace interaction state:
  terminal close -> empty -> reopen, not the previously covered route or
  preset cells.
- Real `Close` sent `terminalClose(deleteHistory:true)`, unmounted the terminal,
  and rendered `This workspace has no open terminals`.
- Real `New terminal` remounted the surface and issued a new `terminalOpen` for
  the same workspace/default identity on the isolated endpoint.
- The final surface rendered `Terminal ready.` with status `ready`; exact-client
  warning/error console stayed empty.
- Host sequence was exactly
  `terminalOpen -> terminalClose -> terminalOpen`.
- `native-workspace-terminal-close-reopen`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Confirmation-enabled close, command history, Native typing, and restart
  persistence remain open.

## 2026-08-16 Native Workspace visibility continuation

- Active discovery moved to a Settings -> consumer persistence state that had
  only Lynx-for-Web evidence.
- Exact-owned Native General settings started with Workspace visibility off.
  Real touches completed `off -> on -> off -> on`, updating checked/value/class
  state and the isolated `synara:app-settings:v1` projection each time.
- Restarting Native with the same user-data directory on ordinary Threads
  startup rendered exactly one Workspace segmented button, proving the sidebar
  consumed the persisted setting.
- Chats and Studio visibility remained unchanged; exact-client warning/error
  console stayed empty.
- `native-workspace-visibility-roundtrip-restart`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Native Chats/Studio visibility and Environment section switches remain open.

## 2026-08-16 Native Studio and Chats visibility continuation

- A second isolated Settings roundtrip disabled both optional Native sidebar
  consumers through real controls: Chats and Studio.
- Their checked/value/class state changed to off and persisted
  `showChatsSection:false` / `showStudioSection:false`.
- Restarting Native with the same user data mounted no Studio segmented button
  and no Chats section. With only the ordinary Threads/Projects surface
  remaining, the redundant segmented picker was correctly omitted.
- New thread, Search, Settings, and the landing composer remained present;
  exact-client warning/error console stayed empty.
- `native-sidebar-studio-chats-visibility-restart`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Native optional sidebar visibility is now covered; Environment section
  switches remain open.

## 2026-08-16 Native Environment visibility harness audit

- Exact-owned Native located all nine checked Environment visibility switches,
  but every control was below the current Settings viewport.
- Pointer drag, `DOM.scrollIntoViewIfNeeded`, and supported mouse-wheel
  emulation each returned success without changing switch coordinates or
  viewport hit targets.
- No switch was touched and no setting changed; the run does not claim product
  pass or regression.
- `native-settings-scroll-devtool-noop` is classified as harness loss with
  `0.00` product contribution. Exact-owned Environment switch interaction
  coverage remains open.

## 2026-08-16 Native Settings target and Environment continuation

- The scrolling harness audit revealed a Web/Native product-path gap: Web
  supports stable Settings `?target=…` deep links, while Native discarded the
  target.
- Native now passes allowlisted `environment-panel` / `provider-updates`
  targets from desktop deep-link init data through App/Router into
  `SettingsPage`, which reuses the existing post-hydration native scroll helper.
- `synara://settings/general?target=environment-panel` placed all nine
  Environment switches within the viewport. Real touches disabled every
  optional section and persisted all nine false values.
- A canonical RPC-created project/thread was opened with
  `environment=open`. All nine optional labels were absent while `Changes`,
  `Commit and Push`, and `Local Servers` remained.
- Exact-client warning/error console stayed empty; canonical cleanup returned
  0 live projects / 0 live threads.
- `native-settings-target-parity`: P1 contribution `1.00 -> 0.00`.
- `native-environment-visibility-roundtrip`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- The DevTool arbitrary-scroll no-op remains a harness limitation, but no
  longer blocks this standard product workflow.

## 2026-08-16 Native Provider updates target continuation

- Active discovery verified the second allowlisted Settings target instead of
  assuming the Environment success generalized.
- Exact-owned `provider-updates` startup exposed a P1: the visible Native
  Provider updates summary had no matching shared anchor, causing
  `no node found for selector '#provider-updates'` and a runtime error.
- The Lynx Provider tools panel now assigns the shared
  `SETTINGS_TARGETS.providerUpdates` id to that summary row.
- Final exact-owned startup scrolled the anchor to `(457,0,622x60)` and
  retained Automatic CLI update checks, Provider updates, Provider picker,
  Installed CLIs, and nine provider disclosure rows.
- Exact-client warning/error console stayed empty.
- `native-provider-updates-target-missing-anchor`: P1 contribution
  `1.00 -> 0.00`.
- Focused tests pass `21/21`; Native/Desktop build passes with output/staged
  hashes identical.

## 2026-08-16 Native provider update-check lifecycle

- A fresh exact-owned ordinary Providers route exercised Automatic CLI update
  checks through real controls: `on -> off -> on`.
- Host calls matched both transitions:
  `server.updateSettings(false)` then `server.updateSettings(true)`.
- Isolated server persistence ended at
  `settings.enableProviderUpdateChecks:true`; restarting Native restored the
  switch On and retained the fixed provider-updates anchor.
- Exact-client warning/error console stayed empty.
- `native-provider-update-checks-roundtrip-restart`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- An earlier shell-script syntax failure occurred before any interaction and
  changed no state; it is harness noise, not product evidence.

## 2026-08-16 Native Update dark 1440 continuation

- Active discovery added the Native-only Update dark-theme `1440x900` cell.
- The first launch used an obsolete flat window-state schema; Lynxtron rejected
  it and rewrote default `1280x820` bounds. That cell was invalidated as
  harness mismatch before product scoring.
- With the current `version:1` plus nested `bounds` schema, the exact root was
  `1440x900` dark. The `560x420` card stayed centered in the `1184x900` route
  page and retained its established content geometry.
- Dark card/title/muted/version tokens resolved correctly, the live GitHub
  result remained Installed `v0.5.5-lynx.0` / Latest `v0.7.2`, and exact-client
  warning/error console stayed empty.
- `native-update-available-dark-1440`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Update network-error retry and external-download handoff remain open.

## 2026-08-16 Native Pull Requests filter continuation

- Active discovery returned to a new Native PR interaction state rather than
  repeating list/detail/tabs/pin/theme/size cells.
- Real Open -> Closed -> Open touches each activated the correct pill and
  settled with 50 live rows. Host calls issued canonical list queries for
  `state:closed` and then `state:open`.
- Real Reviewing activated Reviewing, deactivated All, and produced the valid
  settled `No pull requests found` state for the current account; All restored
  the ordinary list.
- No GitHub or local pin mutation occurred. Exact-client warning/error console
  stayed empty.
- `native-pull-requests-state-involvement-filters`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Native search typing remains behind the Desktop keyboard-input boundary.

## 2026-08-16 Native Pull Requests project-filter continuation

- A separate exact-owned cell opened the real project-filter menu, whose
  initial selection was All projects and whose only concrete option was
  Automation Fidelity.
- Selecting Automation Fidelity issued a scoped canonical list request for
  `automation-expanded-project`, updated the trigger label/pressed state, and
  retained 50 real rows because all current entries belong to that project.
- Selecting All projects again issued the unscoped list request and restored
  the unpressed trigger.
- No PR or pin mutation occurred; exact-client warning/error console stayed
  empty.
- `native-pull-requests-project-filter-roundtrip`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

## 2026-08-16 Native Workspace dark 1440 continuation

- Active discovery moved to a new Workspace theme/size/layout cell: dark
  `1440x900` with two real PTY panes.
- The route retained an `1184x900` main page, `46px` header, and two
  `592x854` panes at `x=256` and `x=849`.
- Host calls opened `default` and `workspace-2` on the isolated endpoint; the
  shared KV persisted the two-columns preset.
- Page/terminal surfaces, separators, and terminal output resolved to the
  intended dark tokens. Exact-client warning/error console stayed empty.
- `native-workspace-dark-1440-two-columns`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Workspace compact Native and keyboard/IME remain open.

## 2026-08-16 Native New Thread minimum-window continuation

- Active discovery replaced the unrepresentable `390px` Native Desktop compact
  cell with the host's real minimum window: `900x650`.
- The exact-owned root resolved to `SliceRoot--viewport-medium`, with a
  `256x650` sidebar, `644x650` main area, `596x35` project heading,
  `620x133` composer, and `620x58` tray.
- The canonical `Minimum Project` fixture inherited `GPT-5.6 Sol`; no durable
  thread was created, and canonical cleanup returned to 0 live projects.
- Exact-client warning/error console stayed empty.
- `native-new-thread-minimum-window`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Native Desktop enforces `minWidth:900` and `minHeight:650`, so the
  Web/Lynx-for-Web `390px` compact renderer is an intentional platform
  boundary, not missing Native evidence.
- This loop passed the mandatory browser lifecycle gate at entry and exit:
  final state was `sessions: []` with zero agent-browser-owned processes.

## 2026-08-16 Native New Thread dark 1440 continuation

- Active discovery added the representable Native project-draft theme/size
  cell: dark `1440x900`.
- Exact-owned PID-derived DevTool identity loaded the staged production file
  bundle and resolved `SliceRoot--theme-dark SliceRoot--viewport-wide`.
- The `1184x900` main area retained a centered `736x133` composer, `688x35`
  project heading, inherited `GPT-5.6 Sol`, and exact recursive visible text
  `What should we do in Dark Project?`.
- Dark heading/composer/tray tokens resolved correctly; output and staged
  bundle hashes were identical; exact-client warning/error console stayed
  empty.
- Canonical projection proved zero durable threads before send. Canonical
  cleanup removed the explicit project and landing-created Home container,
  returning to 0 live projects / 0 live threads.
- `native-new-thread-dark-1440`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- Two unsupported `mapfile` probes and one flat split-text assertion were
  probe-only harness noise. The retained POSIX PID and recursive-text probes
  passed against the same owned process.
- Owned ports/runtime/state were removed, screenshot count remained `100`, and
  the final browser gate reported `sessions: []` with zero owned processes.

## 2026-08-16 Native New Thread project-switch continuation

- Active discovery used two canonical projects with different workspace and
  default-model identities, then exercised the real Native project picker.
- Before repair, touching `Octane Beta` atomically changed the tray to `octane`
  and model to `Sonnet`, but left the heading on `Synara Alpha`.
- This was a P1 product context split, not capture mismatch:
  `native-new-thread-project-presentation-split` contribution
  `1.00 -> 0.00`.
- Root cause was independent identity ownership: mutable project selection
  lived inside `LandingComposer`, while route presentation consumed immutable
  `initialProjectId`.
- The landing host now owns selected project identity and receives every
  picker selection/reset transition. Editor rail uses the same callback and
  keeps draft-open state separate from nullable Home/project selection.
- The final staged bundle passed a fresh exact-owned chain:
  `Alpha/synara/GPT-5.6 Sol -> Beta/octane/Sonnet -> Home/Work in a project`.
  Heading, project trigger, model trigger, and popup state remained atomic.
- A final source review added prop-to-internal project synchronization for
  Editor rail project changes. Focused tests and production build passed again;
  this source/build check is not mislabeled as Native Editor interaction.
- Canonical snapshot stayed at zero durable threads. Cleanup removed both
  explicit projects and the landing-created Home container, returning to
  0 live projects / 0 live threads.
- Focused tests passed `3` files / `13` tests; Native/Desktop production build
  passed; output/staged bundle hashes matched; exact-client console was empty.
- A model-chevron selector mistake was separately classified as harness
  mismatch and corrected against the same owned process.
- Final owned ports/runtime/state and browser sessions were clean; screenshot
  count remained `100`.
