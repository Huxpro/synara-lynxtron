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
   `bun run browser:run -- agent-browser session list --json` to contain
   `sessions: []` and the cleanup script to report zero agent-browser-owned
   browser processes.
5. If preflight or final cleanup fails, stop the loop and repair the harness.
   Do not retain evidence, commit the slice, or continue opening browsers.
6. Every loop's ledger entry must explicitly record all four lifecycle
   results: entry cleanup, exit `sessions: []`, exit owned-process count zero,
   and whether any browser screenshots were retained. A global or earlier
   loop result is not evidence for the current loop.
7. After an interrupted command, failed wrapper invocation, timeout, or
   unexpected process exit, rerun `bun run browser:cleanup` before any next
   probe. Treat any non-empty session/process result as a blocking harness
   leak, not as harmless background state.

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
| Native | Exact-owned current-head runs now cover Editor project drafts, New Thread project/model/mode interactions, Studio, populated Pull Requests, Automations, Settings targets, Update, Plugins, and Workspace layouts/lifecycles with PID-derived DevTool identity. | Passing for retained Native cells; keyboard/IME, background-unsafe host dialogs, environment-blocked provider paths, and undiscovered combinations remain separate boundaries. |
| 2. Identity preflight | Editor ledger records `.synara-fidelity-editor-changes`, server port `59260`, canonical project/thread/workspace IDs, viewport/DPR/theme, sequential trusted origins, PNG dimensions, and relay identity. | Passing for retained fast-loop cells. |
| Harness mismatch separation | Empty accessibility snapshots, unquoted zsh URL globbing, origin mismatch, capture timing, fixed Native port, and provider CLI absence are explicitly classified separately. | Passing. |
| 3. Screenshot evidence | Retained visual cells enumerate their evidence paths; later Native cells at the local cap retain DOM geometry, computed styles, behavior, console, bundle identity, and canonical state instead of adding images. | Passing at the explicit local cap of `100`; screenshot count alone is not completion evidence. |
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
| Native validation | `shots/2026-08-16/editor-project-switch-empty/notes.md` now includes exact-owned Native Editor + project-draft coexistence and zero-thread evidence; route-specific Native continuations are recorded in their current-head ledgers. | Passing for retained Native cells; no blanket Native pass is inferred for keyboard/IME, system dialogs, or untested route combinations. |
| 6. Independent commits | Recent coherent slices are independently committed and pushed through `47d7c63b9`, including provider-memory, New Thread modes, Workspace layouts/lifecycles, Studio, PR minimum, Automations minimum, and Native Editor evidence. | Passing. |
| Commit trailer | Recent commit messages were checked and contain exactly one `Co-authored-by: TRAE CLI <noreply@bytedance.com>` trailer. | Passing. |
| Remote state | Local `HEAD` and `origin/huxcx/lynxtron-port-current-state` were compared after every push and currently match at `47d7c63b9`. | Passing before this audit correction. |
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
2. **Native certification:** exact-owned Editor + project-draft rendering now
   passes. Native first-send/provider execution, keyboard/IME, accessibility,
   and background-unsafe host-dialog paths remain separate boundaries.
3. **P2 Editor coverage:** Chat-history navigation, New chat trigger, terminal
   tab lifecycle, existing-thread/project-draft switching, and fast-loop first
   send now have evidence. Native first-send/provider promotion remains open.
4. **Discovery exhaustion:** other route/state/theme/viewport combinations have
   not been proven exhausted.

## Current continuation checklist

| Explicit requirement | Current artifact or command evidence | Audit result |
| --- | --- | --- |
| Discover new scope | `editor-compact-interactions/`, `pull-requests-populated-interactions/`, Editor history/New chat/terminal-tab continuations | Passing; multiple new viewport/state/interaction cells produced one new P1. |
| Same snapshot/state/theme/size/capture identity | `.synara-fidelity-editor-changes`, `.synara-fidelity-pull-requests-populated`, relay diagnostics, bundle hashes, viewport/PNG dimensions | Passing for retained cells; stale Web bundles, `dev/` vs `userdata/`, pending list frames, and empty authority frames were rejected. |
| Canonical mutations only | `orchestration.dispatchCommand` project/thread setup, live `pullRequests.*`, local `pullRequests.setPinned`, terminal RPCs | Passing; SQLite was read-only and the pin/title round trips were restored. |
| Screenshot/geometry/styles/console/behavior | Retained JSON/PNG/error/console files plus current Native DOM/style/host-call/canonical-state ledgers | Passing for retained cells; Native keyboard/IME, accessibility, and system-dialog behavior are not inferred. |
| Highest real loss fixed | `lynx-editor-terminal-tab-remount` in `router.tsx`, `App.css`, and `ThreadEditorView.lynx.test.ts` | Passing: `terminal.open` count `2 -> 1`; confirmed close emits one `terminal.close`. |
| Focused tests | Editor/Terminal 10/10, Editor history 11/11, New chat 8/8, PR route/detail 20/20, PR follow-ups 6/6 + 16/16 + 16/16 | Passing. |
| Production builds | Root `CI=1 bun run build` 6/6 and explicit `bun run --cwd apps/lynx build:web` | Passing; explicit Web build was necessary because the root build does not refresh `apps/lynx/dist/web`. |
| React diagnostics | `pnpm dlx react-doctor@latest --scope lines --base <parent> --blocking warning --no-score --json` | Passing: recent code slices report 0 errors and 0 warnings through `a23c94458`. |
| Independent commit/push | Per-slice commits now extend through `47d7c63b9`; current-head code and evidence slices are listed in the continuation ledger. | Passing; checked commit messages contain exactly one TRAE co-author trailer. |
| Browser/process cleanup | `bun run browser:cleanup`, `session list --json`, owned-port checks, PTY process checks | Passing after every retained cell; current session count is zero. |
| Screenshot cap | `find shots -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) \| wc -l` | Passing at the explicit cap of `100`. |
| All P0/P1 closed | Current ledgers plus the terminal remount before/after evidence | Passing for discovered product losses. |
| No remaining verifiable scope | Native first-send/provider execution, keyboard/IME, accessibility, safe foreground host-dialog certification, environment-blocked provider paths, Update error/handoff, and undiscovered route combinations remain | **Not achieved.** |

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

## 2026-08-16 Native New Thread direct-model continuation

- Active discovery opened the real provider-first model popup from a
  project-scoped Native draft.
- The isolated provider status marked Codex unavailable and disabled that row.
  Expecting an immediate Codex model list was a harness expectation mismatch;
  Codex-specific selection remains environment-blocked missing coverage.
- The same popup exposed enabled OpenCode. Real touches selected OpenCode,
  settled seven dynamic model rows, and selected
  `DeepSeek V4 Flash Free`.
- Heading/project context remained `Model Project` / `synara`, the trigger
  changed to the selected model, the popup closed, and the composer draft
  persisted `opencode / opencode/deepseek-v4-flash-free`.
- Canonical projection remained at zero durable threads. Cleanup returned to
  0 live projects / 0 live threads.
- `native-new-thread-direct-model-selection`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Exact-client console was empty, output/staged hashes matched, all owned
  runtime/state was removed, final browser state was clean, and screenshot
  count remained `100`.

## 2026-08-16 Native New Thread pre-send permissions continuation

- A real `Full access -> Default permissions` touch exposed a P1: the landing
  draft dispatched `thread.runtime-mode.set` for a thread that does not exist
  until first send.
- The trigger stayed Full access, a visible permissions error appeared, and
  exact-client console retained the orchestration invariant failure.
- `native-new-thread-presend-runtime-command`: P1 contribution
  `1.00 -> 0.00`.
- `Composer` now accepts a local runtime-mode callback before its durable-thread
  command fallback. Landing owns that pre-send state and supplies it to
  `ensureThread`.
- Final exact-owned touch changed the trigger to Default permissions with no
  visible or console error and zero durable threads.
- Focused tests passed `3` files / `17` tests; Native/Desktop build passed;
  output/staged hashes matched.
- Plan mode received a real touch, but a later menu-reopen probe could not
  recover its switch. This remains harness mismatch plus missing checked-state
  coverage, not a claimed Plan roundtrip.
- Canonical cleanup returned to 0 projects / 0 threads; all owned runtime and
  browser processes were removed; screenshot count stayed `100`.

## 2026-08-16 Native New Thread Plan-mode continuation

- A fresh exact-owned draft used the precise extras host to verify
  `aria-expanded` and the Plan switch's `aria-checked` state.
- Real controls completed `off -> on`, close/reopen persistence at `on`, then
  `on -> off`, with zero durable threads and no visible or console error.
- `native-new-thread-plan-mode-roundtrip`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- An earlier undefined-node probe followed an accidental popup close and is
  classified as harness operation error, not product loss.
- Canonical and process/browser cleanup passed; screenshot count stayed `100`.

## 2026-08-16 Native model/project precedence intersection

- Active discovery combined a direct OpenCode/DeepSeek draft override with a
  subsequent Alpha -> Beta project switch.
- Web authority preserves composer draft state while moving an empty draft, so
  the explicit model override intentionally outranks the destination project's
  Claude/Sonnet default.
- Native changed heading/project from `Cross Alpha` / `synara` to
  `Cross Beta` / `octane` while retaining `DeepSeek V4 Flash Free`.
- `native-new-thread-model-override-project-switch`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- This is intentional draft precedence, not an unapplied project default.
  Console, canonical zero-thread state, and cleanup gates passed.

## 2026-08-16 Native provider-model memory continuation

- Active discovery tested OpenCode -> Pi provider memory, matching Web's
  per-provider draft-selection authority.
- An initial Pi browse had an empty dynamic catalog and was classified as an
  environment boundary. A Pi-default canonical project then supplied known
  valid `pi / openai/gpt-5.5` state.
- Before repair, selecting OpenCode/DeepSeek and returning to Pi lost the prior
  GPT-5.5 row entirely.
- `native-composer-provider-model-memory`: P1 contribution `1.00 -> 0.00`.
- Lynx drafts now retain `modelSelectionByProvider` alongside the compatible
  active selection, migrate legacy single-selection persistence, and fall back
  to matching base project/thread selection when provider memory is absent.
- Final exact-owned Pi -> OpenCode/DeepSeek -> Pi restored GPT-5.5 as the active
  Pi row while leaving the visible active trigger on DeepSeek.
- Focused tests passed `4` files / `25` tests; Native/Desktop build passed;
  output/staged hashes matched; exact-client console and canonical zero-thread
  state were clean.
- Canonical, process, browser, and screenshot-count cleanup gates passed.

## 2026-08-16 Native provider-memory restart continuation

- An isolated KV preloaded active OpenCode/DeepSeek plus remembered Pi/GPT-5.5.
- Cold start restored the DeepSeek trigger and the active GPT-5.5 Pi row despite
  empty Pi discovery.
- Restarting with the same user data restored DeepSeek again; persisted KV
  retained both provider slots and the active OpenCode selection.
- `native-provider-model-memory-restart`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- Legacy single-selection migration remains focused-test evidence only, not
  claimed Native legacy-state evidence.
- Both consoles and all canonical/process/browser cleanup gates passed.

## 2026-08-16 Native legacy provider-memory migration

- A real legacy KV contained only Pi/GPT-5.5 `modelSelection`, without the new
  provider map.
- Exact-owned cold start restored GPT-5.5 and rewrote KV with
  `modelSelectionByProvider.pi`.
- `native-provider-model-memory-legacy-migration`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Console and all process/browser cleanup gates passed.

## 2026-08-16 Native Workspace two-pane deletion

- Active discovery combined two-column layout with workspace deletion.
- Real controls opened `default` and `workspace-2`, then deleted the workspace.
- Host calls closed both old terminal identities with `deleteHistory:true`.
- The remaining single pane belonged to a new fallback Workspace ID and was
  not a leaked old terminal.
- `native-workspace-two-pane-delete-cleanup`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- An exact-text preset selector failed before interaction because the rendered
  button includes `· 2 panes`; the corrected selector completed the run.
- Console and all process/browser cleanup gates passed.

## 2026-08-16 Native Workspace two-column restart

- A persisted two-column Workspace restarted with the same user data and
  equivalent `workspaceVisible=open` startup state.
- The same workspace identity, two-column grid, two panes, and both terminal
  reopen calls were restored.
- `native-workspace-two-column-restart`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- A restart without `workspaceVisible=open` rendered landing and was
  invalidated as mismatched harness state, not product failure.
- Console and all cleanup gates passed.

## 2026-08-16 Native Workspace Quad deletion

- Active discovery preloaded a Quad workspace and opened four real PTYs.
- Real deletion issued matching close calls for `default`, `workspace-2`,
  `workspace-3`, and `workspace-4`, all with `deleteHistory:true`.
- The remaining single pane belonged to a newly generated fallback Workspace,
  not leaked Quad state.
- `native-workspace-quad-delete-cleanup`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- Confirmation-enabled close remains a Native host-dialog boundary because a
  background run could raise a system dialog over the user's desktop.
- Console and all cleanup gates passed.

## 2026-08-16 Native Workspace preset session retention

- Real controls completed Quad -> Single -> Quad.
- Reducing to Single emitted no terminal-close call; restoring Quad remounted
  `workspace-2`, `workspace-3`, and `workspace-4` for the same workspace.
- `native-workspace-preset-session-retention`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- A heredoc command-concatenation error interrupted the first restoration
  probe after Single; the continuation reused that owned state and passed.
- Console and all cleanup gates passed.

## 2026-08-16 Native Workspace ordering restart

- Real controls created Workspace 2 and moved it above Workspace 1.
- Restarting with the same user data restored `Workspace 2, Workspace 1` and
  opened Workspace 2 as the active first page.
- `native-workspace-order-active-restart`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- An initial selector expected an `LxButton` instead of the shared primary
  action and failed before interaction; the corrected selector passed.
- Console and all cleanup gates passed.

## 2026-08-16 Native New Thread mode restart

- Web authority persists draft runtime and interaction modes; Lynx previously
  held both only in local Landing state.
- Real controls set Default permissions and Plan On, but KV had no mode fields;
  restart reverted both controls.
- `native-new-thread-presend-mode-restart`: P1 contribution `1.00 -> 0.00`.
- Lynx draft persistence now owns validated runtime/interaction mode fields,
  shared by Landing and Composer through one draft ID.
- Final exact-owned set -> persist -> restart restored Default permissions and
  Plan checked state with an empty console.
- Focused tests passed `3` files / `31` tests; Native/Desktop build and
  output/staged hash equality passed.
- Canonical and process/browser cleanup gates passed.

## 2026-08-16 Native Workspace asymmetric minimum layout

- Active discovery added Left + Stack at the real `900x650` Desktop minimum.
- Before repair, the intended primary left pane occupied only the top-left
  cell; the third pane occupied bottom-left and bottom-right was empty.
- `native-workspace-asymmetric-primary-pane`: P1 contribution
  `1.00 -> 0.00`.
- Native panes now project an explicit primary class instead of relying on an
  encoded `:first-child` selector.
- Final Left + Stack used one `322x604` left pane plus two `322x302` right
  panes. Top + Bottom used one `644x302` top pane plus two bottom panes.
- Focused tests passed `3` files / `12` tests; Native/Desktop build, bundle
  hashes, console, and cleanup gates passed.

## 2026-08-16 Native Studio dark 1440

- Active discovery added Studio dark at `1440x900`.
- The `1184x900` route retained a centered `736x133` composer, dark input/tray
  tokens, and the `Use a folder` trigger.
- Canonical state contained exactly one Studio container and no Home pollution.
- `native-studio-dark-1440`: missing coverage `1.00 -> 0.00`; product-loss
  contribution remains `0.00 -> 0.00`.
- A non-`.json` temporary-file parse and an incorrect Home-container assertion
  were classified as harness mistakes.
- System folder selection remains a background-unsafe host-dialog boundary.
- Console and all cleanup gates passed.

## 2026-08-16 Native Studio container restart

- Dark `1440x900` Studio restarted with the same user and server state.
- The same single Studio project ID survived; no Home or duplicate Studio
  container was created.
- Studio remained active with the same landing presentation and empty console.
- `native-studio-container-restart`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remains `0.00 -> 0.00`.
- Canonical and all process/browser cleanup gates passed.

## 2026-08-16 Native Pull Requests minimum detail

- Active discovery added populated PR detail at Native `900x650`.
- The first empty result lacked a canonical project and was invalidated as
  harness data incompleteness. Canonical project creation then produced 50 rows.
- A real row touch opened #698 in a full `644x604` detail dock while the list
  scroller became `display:none` / `0x0`.
- Header, tabs, and detail scroller all remained within the minimum viewport.
- `native-pull-requests-detail-minimum-window`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Console, canonical cleanup, and all process/browser gates passed.

## 2026-08-16 Native Pull Requests minimum Close

- A precise `Close pull request panel` touch unmounted detail and restored the
  50-row `644x604` list at `900x650`.
- `native-pull-requests-minimum-detail-close`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- An earlier class-first selector activated the external-browser button and
  produced a real `shellOpenExternal` side effect. It is explicitly classified
  as harness operation error, not Close evidence.
- No unrelated browser was terminated; canonical and owned cleanup gates passed.

## 2026-08-16 Native Studio minimum banner

- Active discovery added Studio at the real `900x650` minimum.
- The fixed `736px` provider banner intruded into the sidebar and overflowed the
  window by `46px` on each side.
- `native-provider-health-banner-medium-overflow`: P1 contribution
  `1.00 -> 0.00`.
- Medium/compact frames now use `12px` gutters and a full-width banner. Final
  geometry aligned with the composer rail at `x=268`, width `620`.
- An intermediate fix over-shrank the banner to `580px`; exact verification
  rejected it before the final correction.
- Focused tests passed `3` files / `7` tests; Native/Desktop build, hashes, and
  console passed.
- A final-preflight port check caught still-running owned Studio/server PTYs.
  They were closed and removed before the retained retry; this is harness
  cleanup failure, not product loss.
- Canonical and all process/browser cleanup gates passed after the final run.

## 2026-08-16 Native Automations minimum create dialog

- A canonical project enabled the real create dialog at Native `900x650`.
- The `420x520` dialog, `386x402` panel, footer, summary, Cancel, and disabled
  Create controls all remained inside the viewport.
- Real Cancel restored the empty route; `automation.list` remained zero
  definitions / zero runs.
- `native-automations-create-dialog-minimum-window`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.
- Console, canonical cleanup, and all process/browser gates passed.

## 2026-08-16 Native Chat/Studio draft isolation

- A preloaded Chat landing draft carried DeepSeek, Default permissions, and
  Plan On into Studio because both containers shared one fixed draft ID.
- `native-landing-draft-container-leak`: P1 contribution `1.00 -> 0.00`.
- Chat retains the legacy draft key; Studio now has its own stable draft key.
- Final exact-owned Studio restored GPT-5.5, Full access, and Plan Off while
  leaving the ordinary Chat draft untouched.
- Focused tests passed `3` files / `21` tests; Native/Desktop build, hashes,
  console, canonical cleanup, and process/browser gates passed.

## 2026-08-16 Native Editor project draft

- Canonical project/thread state cold-started directly into Editor with
  `editorNewChat=open`.
- Native retained the main Editor and a project-scoped New chat rail
  simultaneously, with the correct heading, project, model, and geometry.
- Canonical projection remained at one original thread; opening the draft
  created no durable thread.
- `native-editor-project-draft`: missing coverage `1.00 -> 0.00`; product-loss
  contribution remains `0.00 -> 0.00`.
- A transient unrelated process occupied fixed port `8901` during preflight and
  exited without intervention. No foreign process was stopped.
- Exact-client console, canonical cleanup, and all owned process/browser gates
  passed.

## 2026-08-16 Native Automations minimum Heartbeat

- Active discovery expanded the `900x650` create-dialog cell into Heartbeat
  mode and found the choice at `y=620`, outside the `y=122..524` panel and
  `y=65..585` dialog. A real touch hit the backdrop and closed the dialog.
- `native-automations-heartbeat-minimum-reachability`: P1 contribution
  `1.00 -> 0.00`.
- An intermediate scroll-owner repair collapsed the flex panel to `16px`; exact
  Native verification rejected it before retention. A later stale-node-id
  touch was separately classified as harness operation error.
- The final repair uses the shared `DialogPanel`, an explicit
  `calc(100vh - 32px)` dialog height capped at `680px`, and an explicit `56px`
  medium/compact textarea height.
- Final Native geometry was dialog `(240,16,420x618)`, panel
  `(257,74,386x420)`, Heartbeat `(345,424,75x26)`, and footer
  `(257,508,386x32)`.
- A real live-node touch rendered `Target thread` and `Stop when` while the
  dialog/footer remained mounted. Console stayed clean and the read-only
  projection remained zero definitions / zero runs.
- Focused tests passed `2` files / `20` tests; Native/Desktop production build
  passed. Bundle SHA-256:
  `6c0997a008f1f357e5f06a4a2f80f1a4c4fe995e0861268f6aff1a2fdbc80f95`.
- Browser leakage remains a hard per-loop invariant in both this checklist and
  `AGENTS.md`: cleanup runs at entry and exit even for Native-only loops, every
  agent-browser invocation is wrapped by `browser:run`, and any non-empty
  session or owned process blocks evidence, commit, push, and the next loop.
- No agent-browser session was opened. Entry and exit gates both passed with
  `sessions: []`, zero agent-browser-owned processes, all owned ports free, and
  screenshot count still `100`.

## 2026-08-16 Heartbeat target and Stop when detail

- Active discovery continued from mode reachability into target-thread
  selection, completion-policy entry, cross-renderer synchronization, populated
  list, and detail at `900x650`.
- Web authority created a real Heartbeat definition through rendered controls.
  Canonical projection preserved `target_thread_id=hbc-t` and
  `stopWhen=Thread reports COMPLETE`; Native received the same definition.
- Web authority showed `Stop when` in detail, while Native omitted it.
  `native-automations-heartbeat-stop-condition-detail`: P1 contribution
  `1.00 -> 0.00`.
- Root cause was shared `projectAutomationDetail` dropping the AI-evaluated
  completion policy. The shared projection now emits `Stop when` directly
  after `Mode` for applicable Heartbeat definitions.
- Final Native detail at `900x650` rendered the row at
  `(597,441,287x30)` with value `Thread reports COMPLETE`; exact-client console
  was clean.
- Shared projection tests passed `6/6`, Lynx route tests passed `6/6`, and the
  Native/Desktop production build passed. Bundle SHA-256:
  `841c1809cb39adb6b0e015d61b9e5f589ef548a49f465eabb40bf8407e035d2a`.
- Native inactive create-form scrolling/typing remains missing coverage:
  DevTool scroll/touch injection, PID-targeted wheel events, and macOS AX could
  not operate the Lynx content without foreground interaction. This is a
  harness capability gap, not a product pass or failure.
- Every browser command remained inside `browser:run`; failed parser/probe
  attempts were classified as harness errors and still ended with
  `sessions: []` and zero agent-browser-owned processes.
- Canonical cleanup returned zero visible definitions/runs; soft-deleted
  persistence rows and all isolated state/runtime/user directories were then
  removed. Owned ports `58090`, `8891`, and `8901` were free.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Heartbeat Stop when edit parity

- Active discovery compared a saved Heartbeat completion policy in Web
  authority and Native Edit at `900x650`.
- Web authority exposed `Original stop condition` as an editable Stop when
  textbox. Native Edit initially offered only Name and Prompt.
- `native-automations-heartbeat-stop-condition-edit`: P1 contribution
  `1.00 -> 0.00`.
- Native Edit now reuses the shared completion-policy extractor/builder,
  renders a Heartbeat-only Stop when input, resets it on open, includes policy
  only when changed, and maps an empty condition to `none`.
- Dirty checking and update construction moved into focused shared logic.
  Tests passed `2` files / `9` tests, including unchanged, changed, and cleared
  policy payloads.
- React Doctor `0.9.12` scanned all four changed Lynx source/test files against
  `fe17175bf` with zero diagnostics; the commit hook's generic warning did not
  represent a real finding.
- Final Native geometry was dialog `(240,167,420x317)`, panel
  `(257,225,386x196)`, Stop when `(268,390,364x30)`, footer
  `(257,435,386x32)`, and Save `(588,435,55x32)`.
- The field carried `Original stop condition`, untouched Save was disabled,
  and exact-client console was clean. Bundle SHA-256:
  `cb087679d8589bc0df34abb5026c5cf20d1c13da4dcbc97c903291784a4fd236`.
- Native foreground typing/save remains missing coverage because the inactive
  harness cannot inject keyboard input into Lynx content. This is not claimed
  as a real Native save roundtrip.
- Browser lifecycle gates remained mandatory; the first insufficient-wait Web
  probe was harness incompleteness, not product loss, and all attempts ended
  with `sessions: []` plus zero agent-browser-owned processes.
- Canonical cleanup returned zero visible definitions/runs; fixture
  project/thread and all isolated state/runtime/user directories were removed.
  Owned ports `58090`, `8891`, and `8901` were free.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Native Max iterations edit

- Active discovery selected Max iterations because it supports a complete
  Native touch/save/canonical roundtrip without keyboard injection.
- Web authority's valid populated detail cell exposes Unlimited plus
  10/25/50/100/250-run choices. A fresh fixture-specific Web fallback/Back
  surface was invalidated as hydration incompleteness.
- Precise Native Edit-subtree inspection showed no Max iterations controls.
  `native-automations-max-iterations-edit`: P1 contribution `1.00 -> 0.00`.
- The create-dialog choice interaction is now shared as
  `AutomationChoiceOption`; Edit reuses it for the authority-aligned presets
  and sends `maxIterations` only when changed.
- Focused tests passed `3` files / `24` tests. Native/Desktop production build
  passed.
- React Doctor `0.9.12` scanned the six changed Lynx source/test files against
  `405e4ddae` with zero diagnostics.
- Real Native touches selected `10 runs`, enabled Save, saved, and unmounted
  the dialog. Canonical list returned `maxIterations=10`, unchanged
  `completionPolicy.stopWhen=Done`, and zero runs.
- Exact-client console was clean. Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Browser commands remained wrapped and returned to `sessions: []` with zero
  owned processes. No screenshots were retained; local count remained `100`.
- Canonical cleanup returned zero visible definitions/runs and removed all
  isolated state/runtime/user directories. Owned ports `58090` and `8891` were
  free. Port `8901` belonged to an unrelated t3code archaeology Lynxtron run
  (PID `78196`) started after this loop; it was not terminated and is classified
  as external port competition, not a Synara harness leak.

## 2026-08-16 Native Pause cold restart

- Active discovery added an enabled standalone daily automation at `900x650`,
  then exercised Pause and a real Native cold restart.
- A real Pause touch changed live Status to `Paused` and the action to
  `Resume`; canonical state stored `enabled=0`.
- After restarting the owned Lynxtron process against the same snapshot and
  user-data directory, Native restored `Paused`, `Resume`, and `Next run —`.
- `native-automations-pause-cold-restart`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remained `0.00 -> 0.00`.
- Exact-client warning/error console was empty. Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports were free and
  browser cleanup ended at `sessions: []` with zero owned processes.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Native Update network-error retry

- Active discovery closed the remaining Update network-error state with a real
  host failure and retry in one exact-owned Native process.
- A temporary owned-process-only `NODE_OPTIONS` shim rejected exactly the first
  canonical GitHub release fetch, then delegated later requests to the original
  `fetch`. No product code or system network configuration was changed.
- Native rendered `Could not check releases · Synthetic update network offline`
  and an enabled retry control.
- A real `Check for updates` touch retried the host call and recovered to
  Installed `v0.5.5-lynx.0`, Latest `v0.7.2`, and
  `A newer release is available.` with no stale error.
- `native-update-network-error-retry`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remained `0.00 -> 0.00`.
- Focused tests passed `2` files / `5` tests; Native/Desktop production build
  passed; exact-client console was clean.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- The external-download handoff remains unverified because it has an external
  browser side effect and needs an explicitly owned handoff harness.
- Owned processes, the temporary fetch shim, isolated directories, and
  diagnostic proxy files were removed. Ports `58090`, `8891`, `8901`, and
  `58888` were free; browser cleanup ended at `sessions: []` with zero owned
  processes.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Invalid Update external handoff

- A temporary CommonJS module-loader shim was intended to capture
  `shell.openExternal` for the owned Lynxtron process without opening a user
  browser.
- The standalone shim probe passed, but the real host did not use the
  intercepted load path.
- A real `Open download page` touch emitted `bridge.updaterOpenDownload` but no
  owned URL capture log. The cell is invalid harness evidence and may have
  produced one real external-browser side effect; it was not repeated.
- `native-update-external-download-handoff` remains missing coverage `1.00`.
  It is not classified as product pass or loss.
- Cleanup removed the owned process, shim, and isolated directories. Ports were
  free, browser state returned to `sessions: []`, and screenshot count remained
  `100`.
- Port `8901` was later occupied by an unrelated t3code archaeology verification
  process (PID `44768`) started after this loop's cleanup. It was not terminated
  and is external contention, not a Synara leak.

## 2026-08-16 Captured Update external handoff

- The host gained an explicit opt-in capture boundary,
  `SYNARA_UPDATE_OPEN_EXTERNAL_CAPTURE`, while preserving the default
  `shell.openExternal` behavior when unset.
- Focused tests cover capture-without-open and default platform handoff.
- The first test run used an unavailable Rstest `vi` mock helper and was
  rejected as test-harness API misuse; the plain-recorder retry passed.
- An exact-owned real `Open download page` touch captured exactly
  `https://github.com/Emanuele-web04/synara/releases/latest` without opening a
  user browser or changing the visible available-update state.
- `native-update-external-download-handoff`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remained `0.00 -> 0.00`.
- Focused suites passed `3` files / `7` tests; Native/Desktop build and
  exact-client console passed.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- React Doctor `0.9.12` scanned all three changed Lynx source/test files,
  including the new helper/tests, with zero errors and zero warnings.
- Final lifecycle cleanup stopped exact-owned Native PID `84442` and its
  isolated server, removed the capture file plus all temporary state/runtime
  and user-data paths, and left owned ports `58090` and `8891` free.
- This loop's entry cleanup passed before verification. The explicit exit
  query ran through
  `bun run browser:run -- agent-browser session list --json` and returned
  `sessions: []`; the standalone cleanup gate separately reported zero
  agent-browser-owned processes. No browser screenshot was retained, and the
  local screenshot count remained `100`.
- The last explicitly tracked Update scope is closed.

## 2026-08-16 Native Update up-to-date retry

- An owned-process-only fetch shim returned a canonical release response with
  tag `v0.5.5-lynx.0`, equal to the installed app version.
- Native rendered Installed/Latest `v0.5.5-lynx.0` and
  `You are up to date.`.
- A real `Check for updates` touch issued a second captured host fetch and
  restored the same complete state with no error.
- `native-update-up-to-date-retry`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remained `0.00 -> 0.00`.
- Exact-client console was clean. The same HEAD/bundle had just passed focused
  Update tests `5/5` and the Native/Desktop production build.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- External-download handoff remains the only open Update scope.
- Owned processes, fetch shim, and isolated directories were removed. Ports
  `58090`, `8891`, and `8901` were free; browser cleanup ended at
  `sessions: []` with zero owned processes.
- Port `8901` was later occupied by an unrelated t3code archaeology verification
  process (PID `73718`) started after cleanup. It was not terminated and is
  external contention, not a Synara leak.

## 2026-08-16 Native future once automation

- Active discovery added a future one-time automation detail at `900x650`.
- Web authority and Native used the same canonical `once` schedule and light
  snapshot.
- Both rendered Status `Scheduled`, Next run `Tomorrow at 02:38 PM`, Repeats
  `Once`, and no Pause/Resume action.
- Web exposed the editable `datetime-local` Run at control; Native exposed the
  equivalent formatted read-only row `Aug 17, 2026, 2:38 PM`. This is an
  intentional renderer interaction difference, not product loss.
- `native-automations-future-once-detail`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remained `0.00 -> 0.00`.
- Shared projection and Lynx route focused suites passed `6/6` each.
  Native/Desktop production build and exact-client console passed.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- The first interactive-only authority assertion was rejected as harness error.
  Browser attempts still ended at `sessions: []` with zero owned processes.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports were free.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Native Manual schedule

- Active discovery added an enabled Manual automation at `900x650`.
- Web authority and Native both rendered Status `Active`, Next run `—`,
  Repeats `Manual`, and action `Pause`.
- The first Web shell-only result was invalidated as hydration incompleteness;
  the retained authority cell used a fresh session and complete detail state.
- Real Native Pause and Resume touches completed a bidirectional canonical
  mutation roundtrip. Final projection was `enabled=1`, `next_run_at=null`, and
  `schedule_json={"type":"manual"}`.
- `native-automations-manual-pause-resume`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remained `0.00 -> 0.00`.
- Shared projection and Lynx route focused suites passed `6/6` each.
  Native/Desktop production build and exact-client console passed.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Browser attempts ended at `sessions: []` with zero owned processes. No
  screenshots were retained; local count remained `100`.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports were free.

## 2026-08-16 Native Hourly schedule

- Active discovery added an enabled `{type:"interval", everySeconds:3600}`
  automation at `900x650`.
- Web authority exposed selected schedule value `hourly`, Status `Active`, a
  future Today Next run, and Pause.
- Native rendered Status `Active`, Repeats `Hourly`, a future Today Next run,
  and Pause.
- Real Native Pause/Resume touches completed a bidirectional mutation
  roundtrip while preserving Hourly cadence.
- `native-automations-hourly-pause-resume`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remained `0.00 -> 0.00`.
- The first Web assertion incorrectly searched all select-option text for a
  static label sequence; the selected `hourly` value was valid. This was
  harness assertion error, not product loss.
- Shared projection and Lynx route focused suites passed `6/6` each.
  Native/Desktop production build and exact-client console passed.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports `58090` and
  `8891` were free.
- Port `8901` belonged to an unrelated t3code Lynxtron process (PID `18721`);
  it was not terminated and is external contention, not a Synara leak.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Native Custom interval

- Active discovery added a canonical 1800-second Custom interval at `900x650`.
- Web authority selected `custom` / `1800`, showed `Every 30 min`, Active,
  future Next run, and Pause.
- Native rendered Repeats `Custom`, Every `Every 30 minutes`, Active, future
  Next run, and Pause.
- `30 min` vs `30 minutes` is accepted copy variation over the same schedule,
  not product loss.
- Real Native Pause/Resume touches completed a bidirectional mutation
  roundtrip while preserving cadence.
- `native-automations-custom-interval-pause-resume`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remained `0.00 -> 0.00`.
- Owned Native DevTool used `localhost:8902` because unrelated t3code PID
  `18721` owned `8901`; the external client was not touched.
- Focused shared and Lynx suites passed `6/6` each; build and console passed.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports were free; the
  unrelated t3code client remained outside this run.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Native Weekly schedule

- Active discovery added a Monday 09:00 `Asia/Seoul` weekly automation at
  `900x650`.
- Web authority selected `weekly` / day `1`, time `09:00`, timezone
  `Asia/Seoul`, and rendered Active/Pause.
- Native rendered Repeats `Weekly`, Day `Mon`, Time `9:00`, Timezone
  `Asia/Seoul`, and Active/Pause.
- Real Native Pause/Resume touches completed a bidirectional mutation
  roundtrip while preserving all weekly fields.
- `native-automations-weekly-pause-resume`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remained `0.00 -> 0.00`.
- Owned Native used PID-derived `localhost:8902`; unrelated t3code `8901` was
  not touched.
- Shared projection and Lynx route focused suites passed `6/6` each; build and
  console passed.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports were free; the
  unrelated t3code client remained outside the run.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Native Cron schedule

- Active discovery added `0 9 * * 1-5` with timezone `Asia/Seoul` at
  `900x650`.
- Web authority selected `cron`, exposed the same editable expression and
  timezone, and rendered Active/Pause.
- Native rendered Repeats `Cron`, the exact expression, timezone, and
  Active/Pause.
- Cron and timezone rows remained contained inside the minimum `320px` detail
  aside.
- Real Native Pause/Resume touches completed a bidirectional mutation
  roundtrip while preserving Cron data.
- `native-automations-cron-pause-resume`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remained `0.00 -> 0.00`.
- Owned Native used PID-derived `localhost:8902`; unrelated t3code `8901` was
  not touched.
- Shared projection and Lynx route focused suites passed `6/6` each; build and
  console passed.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports were free; the
  unrelated t3code client remained outside the run.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Native Weekdays weekend boundary

- Active discovery ran on Sunday with Weekdays 09:00 `Asia/Seoul`.
- Canonical scheduler produced Monday `2026-08-17T00:00:00.000Z`.
- Web authority and Native both rendered Active, Next run
  `Tomorrow at 09:00 AM`, Weekdays, time, timezone, and Pause.
- Real Native Pause/Resume touches completed a bidirectional mutation
  roundtrip while preserving all schedule fields.
- `native-automations-weekdays-weekend-boundary`: missing coverage
  `1.00 -> 0.00`; product-loss contribution remained `0.00 -> 0.00`.
- Owned Native used PID-derived `localhost:8902`; unrelated t3code `8901` was
  not touched.
- Shared projection and Lynx route focused suites passed `6/6` each; build and
  console passed.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- Canonical cleanup returned zero visible definitions/runs; fixture state,
  runtime, and user-data directories were removed. Owned ports were free; the
  unrelated t3code client remained outside the run.
- No screenshots were retained; local count remained `100`.

## 2026-08-16 Compact dark Provider Update labels

- Active discovery added `390x844` / dark / Providers with real update rows,
  OpenCode expanded, WebSocket `Off -> On -> Off`, and collapse/reopen.
- Existing wide light/dark and OpenCode anatomy cells were treated as prior
  coverage, not counted again.
- Web authority rendered icon-and-label Update actions at `73.05x28`.
- Lynx before rendered `28x24` icon-only actions; the `Update` raw text had a
  `0x0` box.
- `lynx-provider-update-visible-label`: P1 contribution `1.00 -> 0.00`.
- Both Provider Update owners now render an explicit
  `TEXT.LxButton__text`; compact Lynx after measured `69.84x24` with a visible
  `35.84x15` text node.
- The real OpenCode switch roundtrip persisted `true`, restored `false`, and
  remained Off after disclosure collapse/reopen. SQLite stayed byte-identical.
- Exact-owned minimum Native used PID `48616`, PID-derived
  `localhost:8902/session 1`, dark `900x650`, and the exact staged production
  bundle. Each Update action measured `70x24`, with real `36x15` Update text;
  warning/error console was empty.
- The initial Vite SPA fallback was rejected as capture-identity harness loss.
  Fractional-coordinate browser scripts that failed before pointer dispatch
  were rejected as harness errors and produced no product mutation.
- The published `0.0.9` host rendered but had no owned DevTool listener; it was
  not counted as Native evidence. The temporary `0.0.9-dev` diagnostic host
  supplied the exact-owned certification client.
- Focused Provider/Settings suites passed `15/15`; Native/Desktop production
  build passed. Bundle SHA-256:
  `8b7a3c52b5775b4f11e9a460a99f078d6bc3f1d4dd8f6252d8e4fbec5bb95662`.
- Entry cleanup passed. Exit returned `sessions: []`, zero agent-browser-owned
  processes, owned ports `58090/8891/8902` free, and no retained browser
  screenshot. Local screenshot count remained `100`.
- Unrelated t3code PID `18721` on `8901` was not touched.
- Detailed evidence:
  `shots/2026-08-16/provider-update-label-compact/notes.md`.

## 2026-08-16 System-dark Settings theme owner

- Active discovery added Appearance Settings in `system` mode under host dark
  media at compact `390x844`.
- Web authority rendered the active dark variant and
  `System is currently using this dark slot.`
- Lynx before had a dark root but a light Settings page and incorrectly
  rendered `System is currently using this light slot.`
- `lynx-settings-system-dark-owner-drift`: P1 contribution `1.00 -> 0.00`.
- Root cause was Settings independently resolving system mode without the
  host appearance signal. The canonical resolved variant now flows
  `App -> SliceRouter -> SettingsPage`.
- Lynx after had dark root/page classes and the authoritative current-dark-slot
  copy, with no current-light marker.
- Native system appearance remains a documented host capability boundary; its
  shared light fallback is intentional and was not relabeled as a product pass.
- Focused suites passed `6/6`, expanded suites passed `33/33`, and both Web and
  Native/Desktop production builds passed. Native bundle SHA-256:
  `7c0e8f4672111b4538670943f81c0e3bc1b80ff167b1640c20d1de4e5931ce4c`.
- Entry cleanup passed. Exit returned `sessions: []`, zero agent-browser-owned
  processes, owned ports free, and no retained browser screenshot. Local count
  remained `100`.
- Detailed evidence:
  `shots/2026-08-16/system-dark-settings-owner/notes.md`.

## 2026-08-16 Live system appearance

- Active discovery changed host appearance dark -> light -> dark inside one
  long-lived compact Appearance session.
- Web authority followed each change. Lynx before remained dark after the host
  media query became light.
- `lynx-live-system-appearance-drift`: P1 contribution `1.00 -> 0.00`.
- The Web host now publishes a shared `synara:system-appearance` global event
  and removes its media listener on pagehide. App accepts boolean payloads and
  updates the same `systemDark` state used by root tokens and Settings.
- After the fix, root/page/current-slot changed
  `dark -> light -> dark` without reload. Relay connection attempts remained
  `1`, socket stayed open, and page errors were empty.
- Native behavior remains the documented light fallback because no reliable
  native appearance event exists.
- Focused suites passed `24/24`; Web and Native/Desktop production builds
  passed. Native bundle SHA-256:
  `3ba6c39573b90e9cd9a4a1c60ff3f6cb55e283e7a7b2f9dd13b1f1cd05fb07a5`.
- Entry and exit browser cleanup passed with `sessions: []`, zero owned
  browser processes, no retained screenshot, and local count `100`.
- A transient unrelated `8902` listener appeared after owned cleanup and exited
  independently; it was not terminated or classified as a Synara leak.
- Detailed evidence:
  `shots/2026-08-16/live-system-appearance/notes.md`.

## 2026-08-16 Reduced-motion disclosure cleanup

- Active discovery added a compact OpenCode disclosure close-timing cell under
  `prefers-reduced-motion: reduce`, plus a live no-preference -> reduce change.
- Web authority removed closed content immediately and returned to `44px`.
- Lynx before retained the `483px` disclosure at the first probe and `80ms`,
  then removed it only after the fixed `220ms + 40ms` presence timer.
- `lynx-reduced-motion-presence-delay`: P1 contribution `1.00 -> 0.00`.
- The Web host now publishes initial/live `synara:reduced-motion` events and
  cleans its listener on pagehide. The shared Lynx motion owner immediately
  unmounts closed content when reduced motion is active.
- Lynx after was `44px` with content absent on the first, `80ms`, and `320ms`
  probes. A live preference change also closed immediately without reload;
  relay connection attempts remained `1`.
- Focused suites passed `21/21`; Web and Native/Desktop production builds
  passed. Native bundle SHA-256:
  `0ff05243b2eb35ef838091e01b89e6001afb2a7561d9c7b7a9b78539aeca0114`.
- Entry/exit browser cleanup passed with `sessions: []`, zero owned browser
  processes, no retained screenshot, and local count `100`.
- Detailed evidence:
  `shots/2026-08-16/reduced-motion-disclosure/notes.md`.

## 2026-08-16 Workspace header at 320px

- Active discovery added a `320x650` Workspace header, narrower than the prior
  compact matrix and separate from the covered Native asymmetric presets.
- Web authority kept the full Workspace 1 title plus two `28x28` compact
  actions.
- Lynx before retained three text actions and compressed the default title text
  from `73.19px` to `55.78px`, clipping route identity.
- `lynx-workspace-320-header-title-clip`: P1 contribution `1.00 -> 0.00`.
- Lynx actions now own icons, explicit text nodes, and accessibility labels.
  Compact CSS keeps each action at `28px` and hides only visual action text;
  medium/wide retains labels. Title owns shrink and ellipsis semantics.
- Lynx after restored the full `73.19x15` title text and three `28x24` icon
  actions. A real Settings touch opened a contained `296x329` dialog while the
  terminal remained mounted.
- Exact-owned Native `900x650` medium regression kept visible text for all
  actions without overlap; PID-derived `8902/session 1`, exact bundle, and
  warning/error console all passed.
- Long-title rename attempts were rejected as harness input failures and were
  not scored; the retained default-title loss requires no fixture mutation.
- Focused suites passed `5/5`, expanded suites passed `25/25`, and Web plus
  Native/Desktop builds passed. Bundle SHA-256:
  `666f57f34f77dc0ee9e11bd0fa28ca75ff5373b81a5195a8de2497e493c318e4`.
- Entry/exit browser cleanup passed with `sessions: []`, zero browser-owned
  processes, no retained screenshot, and local count `100`.
- Detailed evidence:
  `shots/2026-08-16/workspace-header-320/notes.md`.

## 2026-08-16 Workspace header dark at 320px

- Active discovery extended the repaired 320px Workspace header to dark theme
  and a real Settings interaction.
- Title remained complete at `73.19x15`, and all three compact actions remained
  `28x24` with `12x12` icons and accessibility labels.
- Every icon used explicit dark foreground `#fcfcfc`; no black/invisible SVG
  regression occurred.
- A real Settings touch opened a fully contained `296x329` dark dialog with
  correct foreground/surface colors.
- `lynx-workspace-header-dark-320`: missing coverage `1.00 -> 0.00`;
  product-loss contribution remained `0.00 -> 0.00`.
- The first selector overmatched text helpers and failed before interaction;
  it was classified as harness error and replaced by an exact class-token
  probe.
- Entry/exit browser cleanup passed with `sessions: []`, zero owned browser
  processes, no retained screenshot, and local count `100`.
- Detailed evidence:
  `shots/2026-08-16/workspace-header-dark-320/notes.md`.

## 2026-08-16 Plugin Library header at 320px

- Active discovery added a 320px Plugin header with tab hit testing and the
  full provider-strip scroll range.
- Before, Skills center `x=102` overlapped fixed desktop controls
  `x=90..174`; `elementFromPoint` returned a titlebar icon and real pointer
  activation failed. The same action passed at 1280px.
- `lynx-plugin-320-tab-titlebar-overlap`: P1 contribution `1.00 -> 0.00`.
- Compact Plugin header now uses a 46px tab row inset to `x=180` and a separate
  46px full-width provider row. Medium/wide remains one 46px row.
- After, Skills hit its own text and selected through a real pointer. Provider
  viewport widened `166px -> 320px`, and far-end Pi remained fully reachable.
- Exact-owned Native `900x650` retained the single-row header; a real
  exact-client Skills touch selected it and console stayed empty.
- Early Pi/Skills timing and missing accessibility refs were rejected as
  harness gaps, not product evidence. Codex missing from PATH remained an
  environment capability boundary.
- Focused suites passed `3/3`, expanded suites passed `28/28`, and Web plus
  Native/Desktop builds passed. Bundle SHA-256:
  `063c487d08768d22c6052bcc295731d80ee62fe8fa78e69ab2e4bdec9edffef9`.
- Entry/exit browser cleanup passed with `sessions: []`, zero browser-owned
  processes, no retained screenshot, and local count `100`.
- Detailed evidence:
  `shots/2026-08-16/plugin-header-320/notes.md`.

## 2026-08-16 Workspace title hit ownership at 320px

- Active discovery checked hit ownership across the visible compact Workspace
  title, separate from the previously fixed title width.
- Before, title center was clickable but its visible right edge hit a fixed
  desktop titlebar icon because title `x=14..113` overlapped controls
  `x=90..174`.
- `lynx-workspace-320-title-hit-overlap`: P1 contribution `1.00 -> 0.00`.
- Compact Workspace now uses a 46px title row inset to `x=180` and a separate
  46px action row. All sampled title points hit Workspace text and real click
  entered rename; Settings still opened a contained dialog.
- Exact-owned Native rejected the first `display: contents` implementation:
  actions stacked vertically from `y=-14..58`. The final explicit flex wrappers
  restored a 46px medium header with horizontal `281x24` actions and clean
  console.
- Focused suites passed `5/5`, expanded suites passed `25/25`, and both builds
  passed. Bundle SHA-256:
  `cd08ea00106775c117e2e5b177472a160083504be96feae9cc3bd59f050c2581`.
- Entry/exit browser cleanup passed with `sessions: []`, zero owned browser
  processes, no retained screenshot, and local count `100`.
- Detailed evidence:
  `shots/2026-08-16/workspace-title-hit-320/notes.md`.

## 2026-08-16 Update actions at 320px

- Active discovery added a Native-only Update compact layout preflight at
  `320x568` plus exact-owned Native minimum regression.
- Before, two actions shared a `178px` row and compressed to `80/89px` wide,
  each growing to `61px` high with multiline labels.
- `lynx-update-320-action-compression`: P1 contribution `1.00 -> 0.00`.
- Compact actions now stack full-width; both measured `178x32`, while the card
  remained contained.
- Exact-owned Native `900x650` preserved the ordinary `290x32` horizontal row
  and real retry issued a second `bridge.updaterCheck`; console stayed empty.
- `/update` remains an intentional Web-platform delta. Lynx-for-Web supplied
  layout evidence only; Native supplied host/update behavior.
- Focused suite passed `4/4`; Web and Native/Desktop builds passed. Bundle:
  `ca86d22a1236c459352d723eac73ba99ef4bfe204707de56c5bdb25cb530c50d`.
- Entry/exit cleanup passed with `sessions: []`, zero browser-owned processes,
  no retained screenshot, and local count `100`.
- Detailed evidence: `shots/2026-08-16/update-actions-320/notes.md`.

## 2026-08-16 Automations list header at 320px

- Header audit added the Automations list at `320x568`, distinct from existing
  compact detail/create coverage.
- Before, Refresh `x=156..188` overlapped fixed titlebar controls `x=90..174`;
  its center hit a disabled navigation control.
- `lynx-automations-320-refresh-titlebar-overlap`: P1 contribution
  `1.00 -> 0.00`.
- New automation now owns icon/text/accessibility state; compact hides only the
  text and keeps it `32px`, moving Refresh/New to `x=240/276`.
- Real Refresh increased `automation.list` calls `2 -> 3` while preserving the
  empty state and clean relay.
- Exact-owned Native `900x650` retained the one-row header, full New automation
  text, and real Refresh behavior with empty console.
- A wrong Native node-id report failed before interaction and was rejected as
  harness script error; corrected node `124` completed the touch.
- Focused suites passed `7/7`, expanded suites passed `32/32`, and both builds
  passed. Bundle:
  `0e9a00958e4813e1c999a81f7f9fa1ca111b25788c59472b551046a065e14665`.
- Entry/exit cleanup passed with `sessions: []`, zero browser-owned processes,
  no retained screenshot, and local count `100`.
- Detailed evidence:
  `shots/2026-08-16/automations-header-320/notes.md`.

## 2026-08-16 Automation detail breadcrumb at 320px

- Active discovery added populated detail breadcrumb/action hit ownership at
  `320x568`, beyond the prior compact pane geometry coverage.
- Before, breadcrumb center `(160,23)` overlapped fixed titlebar controls
  `x=90..174`, `y=0..46` and hit a navigation icon; a real pointer sequence did
  not navigate.
- `lynx-automation-detail-320-breadcrumb-titlebar-overlap`: P1 contribution
  `1.00 -> 0.00`.
- Compact detail now uses a `92px` header with the breadcrumb in row two and a
  `246px` main pane, preserving prompt-body height. Medium/wide are unchanged.
- After, breadcrumb moved to `y=58.5..78.5`; center `(160,69)` hit its own text.
  Edit/Delete/Resume remained contained below it.
- Nested-shadow selector/pointer behavior remains an interaction harness gap;
  it is not claimed as a product interaction pass. Native compact behavior
  remains for the next batch certification.
- Focused suite passed `8/8`; Web and Native/Desktop builds passed. Web bundle:
  `c578b2bf7856a12a1f75e7c7ada0c3bb2ddd1edeff1085521ae4915226883831`.
- Every browser attempt used the guarded wrapper. Entry/failure/exit cleanup
  returned `sessions: []` with zero agent-browser-owned processes; unrelated
  Playwright jobs were traced and not killed. No screenshot was retained and
  local count remained `100`.
- Detailed evidence:
  `shots/2026-08-16/automation-detail-header-320/notes.md`.

## 2026-08-16 Automation not-found title at 320px

- Active discovery added the independent not-found detail state at `320x568`.
- Before, `Automations` extended through `x=103.36`; its visible right segment
  overlapped fixed controls from `x=90`, hitting the sidebar toggle/icon.
- `lynx-automation-not-found-320-title-overlap`: P1 contribution
  `1.00 -> 0.00`.
- Compact not-found detail now reserves the first 46px titlebar row and renders
  its title in a second row. Medium/wide remain unchanged.
- After, title moved to `y=58.5..78.5`; left, center, overlap-range, and right
  samples all hit the title. The body Back action remained safe.
- An initial after edge probe retained the before y-coordinate and was rejected
  as harness script error before the corrected `y=69` probe.
- Focused suite passed `9/9`; Web and Native/Desktop builds passed. Web bundle:
  `cb5e993d0b0b98b71d3553cfdae399b84b07b14b39447236519a05f24d1f5fbd`.
- Every browser command used the guarded wrapper; no screenshot was retained
  and local count remained `100`.
- Detailed evidence:
  `shots/2026-08-16/automation-not-found-header-320/notes.md`.

## 2026-08-16 Editor header titlebar ownership at 320px

- A global drag-header audit selected the full-window Editor as the remaining
  high-risk compact header not already covered by titlebar inset rules.
- Editor intentionally owns the first row at `z-index:90`, above global closed
  controls at `z-index:80`.
- Project samples across `x=22..160` all hit project text; Switch project,
  Hide chat, and Chat centers hit their own rendered content and remained
  within `x<=308`.
- `lynx-editor-header-320-titlebar-ownership`: product pass, contribution
  `0.00 -> 0.00`; no product change was made.
- Canonical project/thread setup used RPC only; every browser command used the
  guarded wrapper; screenshot count remained `100`.
- Detailed evidence:
  `shots/2026-08-16/editor-header-titlebar-320/notes.md`.

## 2026-08-16 Pull Requests header at 320px

- Active discovery added list-route header hit ownership at `320x568`, distinct
  from prior minimum-window populated detail/close coverage.
- Before, `Pull requests` extended to `x=105.75`; its visible right segment hit
  fixed controls beginning at `x=90`. Refresh at `x=272..300` was safe.
- `lynx-pull-requests-320-titlebar-overlap`: P1 contribution `1.00 -> 0.00`.
- Compact PR now reserves a first 46px titlebar row and renders shared route
  controls in row two. PR medium retains one-row shell geometry; Kanban rules
  are unchanged.
- After, title moved to `y=59..79`, Refresh to `y=55..83`, and both centers hit
  their own content. Medium `800x568` remained one row.
- Raw pointer publication for Refresh remained a route-specific harness gap
  and is not claimed as behavior evidence.
- Focused suite passed `4/4`, expanded PR suites `11/11`, and Web plus
  Native/Desktop builds passed. Web bundle:
  `fe8231d29424e64825f788ab8b3ede684a0723c39c0daff88c7f184bc5579701`.
- Every browser command used the guarded wrapper; screenshot count remained
  `100`.
- Detailed evidence:
  `shots/2026-08-16/pull-requests-header-320/notes.md`.

## 2026-08-16 Kanban header at 320px

- Active discovery added overview-header hit ownership at `320x568`, distinct
  from prior `390px` project action-overflow and card-action coverage.
- Before, `0 tasks` occupied `x=81.70..122.47`; its center and visible right
  portion hit fixed desktop titlebar icons from `x=90`.
- `lynx-kanban-320-count-titlebar-overlap`: P1 contribution `1.00 -> 0.00`.
- Compact Kanban now reserves the first 46px row and renders title/count/action
  in row two. Medium retains the prior one-row 20px inset contract.
- After, count center `(102,69)` hit its own text; title and New task remained
  contained. Medium `800x568` remained one row.
- The prior PR selector split exposed an omitted Kanban adapter contract test;
  it was updated and passed `1/1`. Actual existing mutation/dialog suites
  passed `6/6`; nonexistent test arguments were not counted.
- Web and Native/Desktop builds passed. Web bundle:
  `f5b70082f493c43a9d2faab6cb23e64f9a8cbf342b4c1870888f437c31a231dc`.
- Every browser command used the guarded wrapper; screenshot count remained
  `100`.
- Detailed evidence: `shots/2026-08-16/kanban-header-320/notes.md`.

## 2026-08-16 Shared Landing and Thread header at 320px

- Active discovery added compact shared chat headers, previously covered only
  by wide Landing typography evidence.
- Landing remained contained, but ordinary Thread's 212px inset left title
  width `0px` and a `378px` line box; its nominal center hit Terminal.
- `lynx-thread-header-320-identity-collapse`: P1 contribution `1.00 -> 0.00`.
- Explicit Landing/ordinary-Thread owner classes now use a compact two-row
  header; Thread title is single-line ellipsis. Editor rail headers are not
  targeted.
- After, Thread identity measured `120.55x18`, controls remained within
  `x=140.55..300`, no overflow; Landing title was safe. Medium Thread stayed
  one row and compact Editor rail stayed `46px`.
- Focused header contract passed `4/4`; Web and Native/Desktop builds passed.
  Web bundle:
  `121e1da1c90e2d46868da5543997ba4f631d3e3d17b4d1aceb92a4c8b83a125d`.
- React Doctor line-scope scan of the committed React changes completed with
  zero errors and zero warnings.
- Two unrelated source-contract tests remain stale and were explicitly not
  counted as this slice's validation: identity usage count `2 -> 3` and a
  removed Environment `presentationMode="editor"` literal.
- Every browser command used the guarded wrapper; screenshot count remained
  `100`.
- Detailed evidence: `shots/2026-08-16/shared-chat-header-320/notes.md`.

## 2026-08-16 Shared header verification-contract refresh

- The shared-header expanded suite exposed two stale source contracts rather
  than product regressions.
- Header identity coverage no longer assumes exactly two component usages; it
  asserts the Landing, ordinary Thread, and Editor New chat identities
  individually.
- Environment Editor coverage now asserts the current dynamic
  `editor-search | editor` presentation contract instead of a removed static
  literal.
- Focused identity and Environment suites passed `10/10`.
- This closes verification debt only; product-loss contribution remained
  `0.00 -> 0.00`.

## 2026-08-16 Native compact-header batch preflight

- An exact-owned Native batch attempted to certify the recent `320px` header
  fixes with isolated user data and an explicit `320x568` window state.
- Repository-local Lynxtron normalized the window to `1280x820`; both persisted
  state and CoreGraphics confirmed the enforced minimum. DevTool root reported
  `SliceRoot--viewport-wide`.
- `native-compact-header-batch`: missing coverage remains `1.00`; this is a
  host minimum/platform harness boundary, not a Native product pass or loss.
- PID-derived client `localhost:8903` was `@synara/lynx`, session 1, exact
  staged bundle. Wide Landing retained `984x46` header and `56x18` New Chat;
  warning/error console was empty.
- Owned PID/state/server were removed; `8903` disappeared. Unrelated t3code
  `8901` and iOS Explorer `8902` remained untouched. Browser gate returned
  `sessions: []` and zero owned processes.
- Detailed evidence:
  `shots/2026-08-16/native-compact-header-batch/notes.md`.

## 2026-08-16 Kanban medium closed-sidebar header

- Active discovery added `800x568` medium plus sidebar-closed, which was not
  covered by the earlier compact-closed and medium-open cells.
- Before, `0 tasks` center `(102,23)` hit fixed titlebar controls.
- `lynx-kanban-medium-closed-count-overlap`: P1 contribution `1.00 -> 0.00`.
- Compact and medium closed Kanban now use a two-row header; medium open remains
  one row at `x=208..800`.
- After, count center `(102,69)` hit its own text and New task remained
  contained.
- DOM click established the closed state because raw pointer publication is a
  route-specific harness gap; no interaction pass is claimed.
- Header contract passed `1/1`; Web and Native/Desktop builds passed. Web
  bundle: `6d11e3fbd9108d26f6e71e34cb5e6fbaeda2eee0aff7bf97f4da1937245bee86`.
- Detailed evidence:
  `shots/2026-08-16/kanban-header-medium-closed/notes.md`.

## 2026-08-16 Medium closed-sidebar header family

- The same `800x568` closed-sidebar state was exercised for Pull Requests and
  ordinary Thread after the Kanban fix.
- Pull Requests retained one row: title `x=212..297.75`, Refresh
  `x=752..780`, outside fixed controls ending at `x=174`.
- Thread retained one row: title `x=234..409.56`, controls
  `x=620.55..780`, no overflow.
- Both are product passes with contribution `0.00 -> 0.00`; no additional code
  change was required.
- A generic PR probe assumed an optional scope element existed in the empty
  state and failed before evidence. Cleanup reran, and a PR-specific nullable
  probe produced the retained result.
- DOM click was used only to establish sidebar-closed state; no toggle
  interaction pass is claimed.

## 2026-08-16 Medium closed app headers

- Active discovery crossed `800x568` medium with sidebar-closed for
  Automations and Plugin Library.
- Automations passed: Refresh/New remained at `x>=616`; contribution stayed
  `0.00 -> 0.00`.
- Plugin exposed a P1: Skills `x=97.38..127.92` was covered by fixed controls.
- `lynx-plugin-medium-closed-titlebar-overlap`: P1 contribution
  `1.00 -> 0.00`.
- Medium Plugin now uses its two-row header only when the sidebar is closed;
  medium open remains `592x46 @ (208,0)`.
- After, tabs began at `x=191/261` and providers occupied row two.
- Focused Plugin suite passed `3/3`; Web and Native/Desktop builds passed. Web
  bundle: `c0ad94f21a061d646d856f50beadd1d1d99b0f46450e2179eaa54bd904013eee`.
- Workspace medium closed remains a separate real-terminal state.
- Detailed evidence:
  `shots/2026-08-16/plugin-header-medium-closed/notes.md`.

## 2026-08-16 Plugin light open-close-open transition

- A fresh `800x568`, light Plugin cell exercised open -> closed -> open in one
  renderer session after the medium header fix.
- Root remained `SliceRoot--theme-light` with white background throughout.
- Header geometry restored exactly `592x46 @ x=208` ->
  `800x92 @ x=0` -> `592x46 @ x=208`.
- Skills restored `x=305.38` -> `x=261.38` -> `x=305.38`.
- This is a product/theme/responsive-state pass, contribution
  `0.00 -> 0.00`; no code change was required.
- DOM clicks established sidebar states because raw pointer publication remains
  a route-specific harness gap; no toggle interaction pass is claimed.

## 2026-08-16 Plugin closed responsive roundtrip

- A single dark Plugin session preserved the closed-sidebar user override
  across `800x568 -> 1280x820 -> 800x568`.
- Root classes changed medium -> wide -> medium while `AppMain--sidebar-closed`
  remained stable.
- Header geometry restored exactly `800x92 -> 1280x46 -> 800x92`; no stale
  compact/medium height survived the wide transition.
- This is a responsive-state product pass, contribution `0.00 -> 0.00`; no
  code change was required.

## 2026-08-16 Short-height compact headers

- A new `320x200` viewport axis checked the cost of recent 92px compact
  headers.
- Automation not-found passed: its body retained `108px`; message and Back to
  automations button were fully visible, with page `scrollHeight=clientHeight`.
- Plugin retained a `108px` scroller with `scrollHeight=417`; content extends
  beyond the viewport.
- Agent-browser wheel input did not move the Lynx custom scroll-view
  (`scrollTop` remained zero). Plugin short-height content reachability
  therefore remains missing interaction coverage/harness gap, not a product
  pass or loss.
- No code change was made; product-loss contribution stayed `0.00 -> 0.00`.

## 2026-08-16 Closed-sidebar route overlap matrix

- A production-bundle scanner covered 14 empty/no-fixture cells:
  `/`, `/kanban`, `/pull-requests`, `/plugins`, `/automations`,
  `/automations/missing`, and `/update`, each at `320x568` and `800x568`.
- Every medium cell was deterministically moved to sidebar-closed before
  scanning.
- The scanner compared visible text, buttons, and accessible controls against
  the measured fixed titlebar rectangle and excluded the titlebar subtree
  itself.
- All 14 cells returned zero non-titlebar overlap candidates.
- This supports header-ownership exhaustion for the listed empty routes only.
  It does not replace the separate fixture evidence for Thread, Workspace,
  populated Automation detail, or other interaction states.
- No code change was required; product-loss contribution stayed
  `0.00 -> 0.00`.

## 2026-08-16 Spacious-density compact Plugin

- UI density was changed through the rendered Settings Appearance
  `UI density: Spacious` control, then verified after navigating to Plugin at
  `320x568`.
- Root projected `SliceRoot--density-spacious`; this was not a synthetic class
  mutation.
- Plugin header remained `320x92`, tabs stayed at `x=191/261`, provider strip
  stayed `320x45 @ y=46`, and header `scrollWidth=clientWidth=320`.
- This is a density/compact product pass, contribution `0.00 -> 0.00`; no code
  change was required.

## 2026-08-16 Spacious-density Landing composer

- UI density was selected through the rendered Settings control and persisted
  to Landing as `SliceRoot--density-spacious`.
- At `320x568`, spacious Landing composer remained contained:
  `296x142.72 @ (12,370.64)`, with editor `67.83px` and footer `34.89px`.
- At `320x200`, both comfortable and spacious layouts place the composer below
  the initial 64px body viewport. Full anatomy shows this is a real vertical
  scroll-view (`clientHeight=64`, `scrollHeight=279`), not static content lost
  outside its owner.
- Agent-browser wheel input did not move the Lynx custom scroll-view
  (`scrollTop=0`). Short-height composer reachability therefore remains missing
  interaction coverage/harness gap, not a product pass or loss.
- No code change was made; product-loss contribution stayed `0.00 -> 0.00`.

## 2026-08-16 Workspace short-height terminal

- A real host-backed Workspace terminal was measured at `320x200`.
- The 92px compact header left a `320x108` terminal pane containing:
  - terminal header `36px`;
  - output viewport `27px`;
  - command row `45px`;
  - command input `239.64x32 @ (14,162)`, fully inside the viewport.
- This is an extreme short-height product pass, contribution
  `0.00 -> 0.00`; no code change was required.

## 2026-08-16 Workspace header at medium width with sidebar closed

- Active discovery added real Workspace/terminal at `800x568`, medium, closed.
- Before, title `x=14..113.19` overlapped fixed controls from `x=90`.
- `lynx-workspace-medium-closed-title-overlap`: P1 contribution
  `1.00 -> 0.00`.
- Medium closed Workspace now uses separate title/action rows while preserving
  full labels. Title starts at `x=180`; actions occupy `y=46..92`.
- Real terminal remained running. Medium open retained one `46px` row.
- Focused suite passed `5/5`; Web and Native/Desktop builds passed. Web bundle:
  `2a20a4d953a9c661c55c41d1f69200e43c4954227684562e5664fd47b945dffa`.
- The first route attempt lacked `workspaceVisible=open` and was rejected as a
  missing prerequisite, not product evidence.
- Detailed evidence:
  `shots/2026-08-16/workspace-header-medium-closed/notes.md`.

## 2026-08-16 Automation detail headers at medium width with sidebar closed

- Active discovery added populated and not-found detail owners at `800x568`,
  medium, closed; list-header evidence did not cover them.
- Not-found title `x=20..103.36` and populated breadcrumb `x=20..460` both
  crossed fixed controls `x=90..174`.
- `lynx-automation-not-found-medium-closed-title-overlap`: P1
  `1.00 -> 0.00`.
- `lynx-automation-detail-medium-closed-breadcrumb-overlap`: P1
  `1.00 -> 0.00`.
- Both left headers retain 46px height and use `padding-left:180px`; populated
  actions at `x=480..800` and sidebar-open geometry remain unchanged.
- Focused suite passed `10/10`; Web and Native/Desktop builds passed. Web
  bundle: `cd3a164f4c2cef288b8acf0b047b6de5040c2837d5169cb61fcd619251000b2d`.
- Detailed evidence:
  `shots/2026-08-16/automation-detail-medium-closed/notes.md`.

## 2026-08-16 Empty Thread at 320x200

- Canonical empty Thread combined the compact header, provider banner, hero,
  composer, and context tray at short height.
- Before, composer was `296x95 @ y=192`, almost entirely below the viewport;
  Thread owned no vertical scroll-view and wheel input moved no scroll owner.
- `lynx-empty-thread-short-composer-unreachable`: P1 contribution
  `1.00 -> 0.00`.
- Short-height ordinary Thread now hides hero/context/banner and keeps the full
  composer at `y=98.5..193.5`.
- At `320x568`, banner, hero, composer, and context tray all remain.
- Focused suites passed `8/8`; Web and Native/Desktop builds passed. Web bundle:
  `3430636cc7403b7bb43d00ac8fa6915b65566673b10af8deb48747f516a43f6a`.
- Detailed evidence:
  `shots/2026-08-16/thread-empty-short-height/notes.md`.

## 2026-08-16 Spacious empty Thread at 320x200

- The short-height Thread fix was reverified at maximum UI density selected
  through the rendered Settings control.
- Root projected `SliceRoot--density-spacious`.
- Hero/context/banner remained hidden; the uncompressed spacious composer was
  `296x104.72 @ (12,93.64)` and ended at `y=198.36`, fully inside the 200px
  viewport.
- This is a density/short-height boundary pass, contribution
  `0.00 -> 0.00`; no additional code change was required.

## 2026-08-16 Update actions at 320x200

- A six-route short-height interaction matrix identified Update as the only
  primary-action surface offscreen without a real vertical scroll owner.
- Before, actions began at `y=192/233` in a 200px viewport.
- `lynx-update-short-actions-unreachable`: P1 contribution `1.00 -> 0.00`.
- Short-height Update now hides secondary decoration/detail and keeps both
  full-width actions at `y=76/114`, ending at `y=146`.
- Normal `320x568` layout retains mark, description, spacing, and original
  action positions.
- Focused suite passed `5/5`; Web and Native/Desktop builds passed. Web bundle:
  `2dbbacc557364f7c475d1b2d6facf502fc974a5d693a17f1044e9e8fbe699ca7`.
- Detailed evidence: `shots/2026-08-16/update-short-height/notes.md`.

## 2026-08-16 Populated Thread at 320x200

- A public `thread.activity.append` fixture exercised the real transcript path
  without provider execution.
- Before final repair, the composer was visible but the 80px bottom inset filled
  the entire 46px transcript viewport; all visible points were blank inset.
- `lynx-populated-thread-short-transcript-hidden`: P1 contribution
  `1.00 -> 0.00`.
- Short Thread now uses a 20px one-line editor and an 8px Thread-only transcript
  inset. Composer remains full-width with complete footer.
- After, TranscriptList was `46/46`, and points `y=96/105/120` hit the retained
  activity row.
- Focused suites passed `8/8`; Web and Native/Desktop builds passed. Web bundle:
  `72f816522a670d24f5e48d855075fc5ef9351e66e40c3bbb74fce4e5364e421c`.
- Detailed evidence:
  `shots/2026-08-16/thread-populated-short-height/notes.md`.

## 2026-08-16 Populated Automation detail at 320x200

- Before, fixed `246px` main exceeded the 200px viewport; aside height was zero
  and Edit/Delete/Resume began at `y=246`.
- `lynx-automation-populated-short-actions-unreachable`: P1 contribution
  `1.00 -> 0.00`.
- Compact short detail now uses a 120px main and 80px aside. Actions are fully
  visible at `y=120..166`; metadata retains a 34px scroll viewport.
- Normal `320x568` allocation remains `246/322`.
- Focused suite passed `11/11`; Web and Native/Desktop builds passed.
- Detailed evidence:
  `shots/2026-08-16/automation-populated-short-height/notes.md`.

## 2026-08-16 Automation create dialog at 320x200

- A canonical project enabled the rendered create dialog at `320x200`.
- Popup remained fully visible: `288x168 @ (16,16)`.
- Form panel retained a real 48px viewport with `scrollHeight=810`.
- Footer and both actions were fully visible at `y=135..167`.
- This is a short-height product pass, contribution `0.00 -> 0.00`; no code
  change was required.

## 2026-08-16 Empty Editor Chat rail responsive matrix

- Empty Editor Chat was newly tested at `320x200`, `320x568`, `800x568`, and
  `1280x820`.
- Before, short Chat had only `57.75px` but header/hero/composer required over
  350px; compact and medium composers also extended below the rail.
- Closed P1s:
  - `lynx-editor-short-empty-chat-unreachable` `1.00 -> 0.00`;
  - `lynx-editor-compact-empty-chat-unreachable` `1.00 -> 0.00`;
  - `lynx-editor-medium-empty-chat-overflow` `1.00 -> 0.00`.
- Short uses equal rows and a compact composer; compact/medium omit redundant
  empty hero/context and provider banner. Wide retains full composition.
- After, short composer ends at `y=192.5`; compact/medium at `y=540.63`, all
  within their Chat rails.
- Focused suites passed `12/12`; Web and Native/Desktop builds passed.
- Detailed evidence:
  `shots/2026-08-16/editor-empty-short-height/notes.md`.

## 2026-08-16 Settings Appearance at 320x200

- Appearance owns one full-viewport vertical `SettingsContent` scroll-view:
  `clientHeight=200`, `scrollHeight=2253`.
- UI density controls begin offscreen at `y=1679`, but a controlled anatomy
  probe at `scrollTop=1550` placed all three rendered controls fully inside the
  viewport at `y=129..157`.
- This is a short-height layout pass, contribution `0.00 -> 0.00`; no product
  code change was required.
- Agent-browser could not resolve `.SettingsContent` through the Lynx custom
  element shadow tree for a real `scroll --selector` action. The failed probe
  exited through `browser:run`; cleanup and a separate session-list gate then
  reconfirmed `sessions: []` and zero agent-browser-owned processes before the
  next probe. Real wheel reachability remains a harness gap and is not claimed
  as an interaction pass.
- The current Vite origin served the Web route assets but left `#root`
  unhydrated with no page errors, controls, or scroll owners. That Web authority
  cell is invalid harness evidence and is recorded separately from the Lynx
  product result.
- Every browser workflow used `bun run browser:run -- ...` and its final cleanup
  passed. No screenshots were retained; the repository screenshot count
  remained 100.

## 2026-08-17 Settings sidebar at 320x200

- The open Settings sidebar preserves a fixed 46px titlebar and gives its body
  an independent vertical scroll owner: `clientHeight=154`,
  `scrollHeight=604`, maximum `scrollTop=450`.
- At maximum offset, the final five navigation rows were fully reachable below
  the titlebar: Providers `y=46..74`, Skills `76..104`, Usage `106..134`,
  Integrations `136..164`, and Advanced `166..194`.
- This is a short-height sidebar layout pass, contribution `0.00 -> 0.00`; no
  product code change was required.
- A DOM click on the rendered `Toggle thread sidebar` control established the
  deterministic open state because raw agent-browser pointer publication for
  Lynx custom elements remains a harness gap. The controlled `scrollTop`
  mutation is anatomy evidence only; no pointer or wheel interaction pass is
  claimed.
- Every browser workflow used `bun run browser:run -- ...` and returned through
  its zero-session/zero-owned-process cleanup gate.

## 2026-08-17 Kanban new-task dialog at 320x200

- A canonical project created through `project.create` exposed the rendered
  Kanban `New task` control at `320x200`, dark.
- The dialog remained inside the viewport at `288x160 @ (16,20)`. Its shared
  panel retained a vertical scroll owner (`clientHeight=54`,
  `scrollHeight=100`), while the draft switch and complete 32px Create task
  hit area remained visible below it.
- At `320x568`, the same dialog expanded to `288x246`; the panel was
  `100/100` and the action remained 32px. The short-height delta is therefore a
  constrained shared-panel layout rather than page-level overflow.
- This is a short-height dialog-shell pass, contribution `0.00 -> 0.00`; no
  product code change was required.
- The native textarea reported `0x0` in Lynx-for-Web at both 200px and 568px
  heights. Input visibility, focus, and enabled-submit behavior remain Native
  missing coverage and are not claimed as a browser pass or scored as a
  short-height product loss.
- DOM activation established the dialog because raw agent-browser pointer
  publication for Lynx custom elements remains a harness gap. Every browser
  workflow ran through `bun run browser:run -- ...` and passed final cleanup.

## 2026-08-17 Workspace settings dialog at 320x200

- Workspace was enabled and created through rendered product controls before
  opening its settings dialog at `320x200`, dark.
- Before, the popup remained in bounds and the preset panel had a real scroll
  owner, but flex shrink collapsed the `Workspace settings` title to
  `8/21px`; the description disappeared without an intentional short-height
  contract.
- `lynx-workspace-settings-short-title-collapsed`: P1 contribution
  `1.00 -> 0.00`.
- The workspace-scoped short-height fix keeps the title at `21/21px`, hides the
  secondary description intentionally, and gives the preset panel the remaining
  `97px` as its scroll viewport.
- At maximum `scrollTop=159`, the final `Quad · 4 panes` preset was fully
  visible at `y=139..163`; the close action remained a full `30x30` hit area.
- Focused Workspace suite passed `6/6`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.
- The first post-setup probe used a fresh named browser session and therefore
  lacked session-local Workspace state. It was rejected as a harness
  prerequisite mismatch; cleanup immediately reconfirmed `sessions: []` and
  zero agent-browser-owned processes before the combined setup/probe.

## 2026-08-17 Advanced release-history dialog at 320x200

- The rendered Advanced `View release history` action opened the real fixed
  release-history dialog at `320x200`, dark.
- Before, the `626.390625px` popup was centered at `y=-213.19..413.20`.
  Title, close affordance, and header were above the viewport, while the footer
  and Close action were below it. The internal release list scroller could not
  make those fixed controls reachable.
- `lynx-release-history-short-dialog-offscreen`: P1 contribution
  `1.00 -> 0.00`.
- The release-dialog-specific short-height contract now uses
  `height: calc(100vh - 32px)`, keeps header/footer fixed, intentionally hides
  the secondary description, and gives the panel the remaining scrollable
  height.
- After, popup was `288x168 @ (16,16)`, title `24px @ y=27`, panel
  `86/4158 @ y=53`, footer `44px @ y=139`, top close `30x30`, and footer Close
  `52.53x28 @ y=147`; all fixed controls were in bounds.
- Focused Advanced suite passed `3/3`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Profile share dialog at 320x200

- The rendered Profile `Share` action opened the real share-card dialog at
  `320x200`, dark.
- Before, flex shrink collapsed the title to `7/28px`; the body had no scroll
  owner, and LinkedIn/Reddit actions ended at `y=210`, outside the viewport.
- `lynx-profile-share-short-title-and-actions`: P1 contribution
  `1.00 -> 0.00`.
- The share body now uses the shared `DialogPanel` scroll owner. Its
  short-height contract keeps the title at `28/28px`, constrains the popup to
  `288x168 @ (16,16)`, and reduces only the preview to 64px.
- The body measured `102/140`; at maximum `scrollTop=38`, LinkedIn and Reddit
  were fully visible at `y=139..167`, while Copy/Save/X remained at
  `y=103..131`.
- Focused Profile suite passed `5/5`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Profile edit dialog at 320x200

- The rendered Profile `Edit` action opened the real edit dialog at
  `320x200`, dark.
- Before, the title collapsed to `22/40px`, avatar to `10/80px`, and fields to
  `16/121px`; the body had no scroll owner. Footer content also extended beyond
  the popup even though Cancel/Save remained partly visible.
- `lynx-profile-edit-short-form-collapsed`: P1 contribution `1.00 -> 0.00`.
- The edit body now uses the shared `DialogPanel`. The short-height contract
  fixes title/footer allocation, reduces the avatar to 48px, and gives the form
  body the remaining scrollable height.
- After, popup was `288x168 @ (16,16)`, title `40/40`, body `74/253`, footer
  `52/52`, and Cancel/Save retained full 36px hit areas at `y=135..171`.
- At maximum `scrollTop=179`, the complete 123px fields block aligned to the
  body bottom, proving the form remains reachable without moving the fixed
  footer.
- Focused Profile suite passed `5/5`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Automation edit dialog at 320x200

- A canonical project and manual automation were created through RPC, then the
  rendered detail `Edit` action opened the real edit dialog at `320x200`, dark.
- Before, title collapsed to `6/21px`, description to `9/30px`, and footer to
  `9/32px`. The form panel had a real scroll owner, but all fixed dialog
  regions participated in flex shrink.
- `lynx-automation-edit-short-fixed-regions-collapsed`: P1 contribution
  `1.00 -> 0.00`.
- The edit-specific short-height contract now fixes the 168px popup and title /
  footer allocation, intentionally hides secondary description, and gives the
  panel the remaining scrollable height.
- After, popup was `288x168 @ (16,16)`, title `21/21`, panel `73/268`, footer
  `40/40`, and Cancel/Save retained full 36px hit areas at `y=131..167`.
- At maximum `scrollTop=195`, title/footer/buttons remained fixed while the
  form reached its final content.
- Focused Automations suite passed `11/11`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Environment Git action dialog prerequisite

- A canonical project/thread was created against the current repository, then
  recreated under a fresh thread id with the exact current branch and worktree
  path after the first fixture exposed `No branch`.
- Direct read-only `git.status` RPC succeeded and reported the current branch,
  upstream, and real working-tree changes. The rendered Environment panel,
  however, remained at `Loading changes…`; `Commit and Push` stayed disabled.
- The Git action dialog therefore could not be opened through a valid rendered
  product path. This is runtime/harness missing coverage, not a product pass or
  loss; no disabled state was bypassed and no Git mutation was attempted.
- Reusing the deleted thread id failed the orchestration invariant as expected.
  The failed browser workflow exited through `browser:run`, and cleanup
  immediately reconfirmed `sessions: []` and zero agent-browser-owned
  processes before creating the replacement fixture.
- Canonical cleanup removed the replacement thread and project. The user's
  pre-existing `.p10-view*` working-tree content was read by status only and
  never modified.

## 2026-08-17 Theme import sheet at 320x200

- The rendered Appearance `Import` action opened the compact theme-import sheet
  at `320x200`, dark. Both light/dark pack triggers were present; the first
  rendered pack established the measured state.
- The sheet was `320x152 @ (0,48)`. Its complete header, 96px textarea, and
  stacked 96px footer exceeded the initial viewport, but all content belonged
  to one explicit `SharedThemePackImportScroll` owner (`151/301`).
- At maximum `scrollTop=150`, Import was fully visible at `y=115.5..147.5`
  and Cancel at `155.5..187.5`; the independent close action remained
  `32x32 @ (280,57)`.
- This is a short-height layout pass, contribution `0.00 -> 0.00`; no product
  code change was required.
- Programmatic offset is anatomy evidence only. Real wheel publication through
  the Lynx custom scroll-view remains harness missing coverage and is not
  claimed as an interaction pass.

## 2026-08-17 Sidebar command palette at 320x200

- The rendered sidebar `Search` action opened the physical-shared command
  palette at `320x200`, dark.
- Before, the popup measured about `272x229 @ (18,-25.66)`: the 48px search
  input was above the viewport and the 56px footer extended below it.
- `lynx-command-palette-short-popup-offscreen`: P1 contribution
  `1.00 -> 0.00`.
- The shared short-height command contract removes proportional viewport
  padding, constrains the popup to `calc(100vh - 16px)`, fixes input/footer,
  and gives the result list the remaining scrollable height.
- After, popup was `262.8x184 @ (22.6,8)`, input `48px @ y=10`, list
  `70/220 @ y=58`, and footer `57px @ y=134`; all fixed regions were in bounds.
- Focused Command suite passed `9/9`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Composer model picker at 320x200

- The rendered Landing `Choose model` control opened the provider picker at
  `320x200`, dark.
- Before, popup measured `260x300 @ (0,0)` and extended 100px beyond the
  viewport. Its provider list was `288/288`, so no internal scroll range could
  recover the clipped providers.
- `lynx-composer-model-picker-short-overflow`: P1 contribution `1.00 -> 0.00`.
- The short-height model popup now uses `calc(100vh - 16px)` and lets provider /
  model option lists flex into the remaining height with explicit scroll
  ownership.
- After, popup was `260x184 @ (0,16)` and provider list `172/288 @ y=22`;
  the complete overlay stayed in bounds with 116px of real scroll range.
- Focused Composer suite passed `3/3`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Composer traits menu at 320x200

- The rendered `Change effort, context, and speed` control opened the distinct
  traits menu at `320x200`, dark.
- The current Codex state rendered one 179px trait section. Popup measured
  `260x191 @ (59,9)` and ended exactly at `y=200`; its section remained fully
  inside at `y=15..194`.
- This is a current-state short-height layout pass, contribution
  `0.00 -> 0.00`; no product code change was required.
- The pass is scoped to the real one-section capability state. Providers that
  expose additional simultaneous trait sections remain separate future scope,
  not inferred coverage.

## 2026-08-17 Composer extras menu at 320x200

- The rendered `Composer extras` control opened the real three-row menu at
  `320x200`, dark.
- Popup measured `142x108 @ (19,92)` and ended exactly at `y=200`. Add files,
  Plan mode, and Fast retained complete 26px rows at `y=98..194`.
- This is a primary-menu short-height layout pass, contribution
  `0.00 -> 0.00`; no product code change was required.
- A DOM activation of Plan mode did not publish a `LxMenuSubPopup` in
  Lynx-for-Web. Nested submenu geometry remains interaction/harness missing
  coverage and is not included in the primary-menu pass.

## 2026-08-17 Composer project picker at 320x200

- Two projects were created through canonical `project.create`, then the
  rendered Landing project control opened the real searchable picker at
  `320x200`, dark.
- Before, popup measured `288x258 @ (20,0)` and extended 58px below the
  viewport. The list had a real scroll owner, but the popup shell itself was
  outside the valid cell.
- `lynx-composer-project-picker-short-overflow`: P1 contribution
  `1.00 -> 0.00`.
- The short-height picker now uses `calc(100vh - 16px)` and lets its list flex
  into the remaining height while search/footer retain their fixed allocation.
- After, popup was `288x184 @ (20,16)`, search `43px @ y=17`, and list
  `74/797 @ y=60`; the overlay stayed in bounds with a real scroll range.
- Focused Landing composer suite passed `3/3`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Theme pack code-theme menu availability

- The full Appearance theme-pack editor rendered at both normal and short
  heights, including dark/light color, font, translucency, contrast, Import,
  and Copy controls.
- No `SharedThemePackCodeSelect` trigger was mounted in the current Lynx
  capability state, so the code-theme `MenuPopup` could not be opened through a
  rendered product path.
- This is current-build missing coverage, not a product pass or loss. The
  adapter owner remains future scope if code-theme selection becomes enabled;
  no synthetic trigger or hidden state was forced.

## 2026-08-17 Settings default-provider menu at 320x200

- The rendered General default-provider control opened the real nine-option
  provider menu at `320x200`, dark.
- Before, popup measured `220x302 @ (63,0)`, extended 102px below the viewport,
  and had no scroll range despite the nine rows.
- `lynx-settings-provider-select-short-overflow`: P1 contribution
  `1.00 -> 0.00`.
- The shared Settings select popup now uses `calc(100vh - 16px)` and owns
  vertical scrolling at short heights.
- After, popup was `220x184 @ (63,16)` with `clientHeight=182` and
  `scrollHeight=294`; the complete menu stayed in bounds with 112px of scroll
  range.
- Focused Settings General suite passed `3/3`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Appearance terminal-font popup interaction gap

- The rendered terminal-font input and passive menu trigger were scrolled into
  view at `320x200`, dark.
- Neither synthetic focus publication nor rendered-trigger DOM activation
  caused the controlled `SharedSettingsAppearanceFontPopup` to mount in
  Lynx-for-Web.
- This is interaction/harness missing coverage, not a product pass or loss.
  The declared 320px suggestion-list maximum is not scored without a real
  mounted popup; no speculative CSS patch was applied.

## 2026-08-17 Custom Models provider menu at 320x200

- The rendered Models provider control opened the real eight-option menu at
  `320x200`, dark.
- Before, popup measured `160x270 @ (80,0)`, extended 70px below the viewport,
  and had no scroll range.
- `lynx-custom-model-provider-menu-short-overflow`: P1 contribution
  `1.00 -> 0.00`.
- The Custom Models provider popup now uses `calc(100vh - 16px)` and owns
  vertical scrolling at short heights.
- After, popup was `160x184 @ (80,16)` with `clientHeight=182` and
  `scrollHeight=262`; the complete menu stayed in bounds with 80px of scroll
  range.
- Focused Custom Models suite passed `2/2`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Sidebar project/thread sort menu at 320x200

- A canonical project exposed the rendered sidebar `Sort projects` control,
  which opened the combined three-project/two-thread option menu at
  `320x200`, dark.
- Popup measured `176x192 @ (94,8)` and ended exactly at `y=200`. All group
  labels and five 26px options remained in bounds with no content overflow.
- This is a short-height layout pass, contribution `0.00 -> 0.00`; no product
  code change was required.

## 2026-08-17 Pull Request project filter at 320x200

- A canonical current-repository project exposed the rendered PR project-filter
  control at `320x200`, dark.
- Popup measured `256x116 @ (36,84)`, ending exactly at `y=200`; the list was
  `68/68` and both `All projects` plus the current populated project remained
  visible.
- Adding eight more canonical projects did not expand the filter because they
  had no projected PR data. The measured two-option state is therefore the
  valid current product state, not filtered evidence.
- This is a short-height layout pass, contribution `0.00 -> 0.00`; a future
  snapshot with PR data across multiple projects remains separate scope.

## 2026-08-17 Appearance select menu availability

- No `SharedSettingsAppearanceSelect` trigger was mounted in the current Lynx
  Appearance page.
- Source confirms the platform boundary is explicit:
  `showCodeThemeSelection={false}` and `showTimestampFormat={false}`.
- The shared Appearance select popup is therefore current-build missing
  coverage, not a product pass or loss. The failed discovery probe exited
  through `browser:run`, followed by an immediate zero-session/zero-process
  cleanup gate.

## 2026-08-17 Environment branch menu interaction gap

- A canonical local thread was created with the exact current branch and
  worktree path, exposing an enabled rendered `Choose branch` trigger at
  `320x200`, dark.
- Read-only `git.listBranches` succeeded with 140 total branches and two local
  branches, so the menu data source was healthy.
- Rendered-trigger DOM activation did not publish an
  `EnvironmentBranchPopup` in Lynx-for-Web. This is interaction/harness missing
  coverage, not a product pass or loss; no branch switch or Git mutation was
  attempted.
- The declared 320px maximum is not scored without a mounted popup.

## 2026-08-17 Environment Local Servers menu at 320x200

- A canonical branch-backed local thread exposed the rendered `Local Servers`
  control at `320x200`, dark.
- The real scanner returned one running server. Popup measured
  `288x116 @ (32,84)` and ended exactly at `y=200`; header, refresh action, and
  the complete server row remained in bounds.
- This is a current one-server layout pass, contribution `0.00 -> 0.00`; no
  product code change was required.
- No extra process was launched to inflate the list. A naturally occurring
  multi-server state remains separate future scope.

## 2026-08-17 Environment editor menu at 320x200

- A canonical branch-backed local thread and real server config exposed seven
  available editor targets: Cursor, Trae, VS Code, Ghostty, Terminal, Xcode,
  and file manager.
- Entering directly at 200px did not mount the lower Environment editor section.
  After the same named session hydrated at `320x568` and resized to `320x200`,
  the rendered `Open in Cursor` trigger opened the real seven-option menu.
- Popup measured `176x192 @ (144,8)` and ended exactly at `y=200`; all options
  remained in bounds with no content overflow.
- This is a short-height layout pass, contribution `0.00 -> 0.00`. The first
  direct-entry result is classified as a harness/hydration prerequisite
  mismatch, not a product loss.
- No editor launch action was activated.

## 2026-08-17 Composer runtime-permissions menu at 320x200

- The rendered Landing `Full access — change permissions` control opened the
  distinct runtime menu at `320x200`, dark.
- Popup measured `188x116 @ (40,84)` and ended exactly at `y=200`. Full access
  and Default permissions remained fully visible.
- This is a short-height layout pass, contribution `0.00 -> 0.00`; no product
  code change was required and no permission mode was changed.

## 2026-08-17 Environment multi-server fixture attempt

- Five owned temporary HTTP listeners were started on isolated ports to extend
  the earlier one-server Local Servers menu into a long-list state.
- A single process with five listeners correctly projected as one row. Five
  separate child processes also projected as one row, so the scanner applies
  higher-level ownership/filtering rather than one-row-per-listener or PID.
- The intended multi-row prerequisite was therefore not established. This is a
  fixture/harness gap, not a repeated one-row pass and not a product loss.
- All owned listeners were stopped and ports `58111..58115` were verified free.

## 2026-08-17 Explorer preview actions at 320x200

- A canonical branch-backed thread used the explicit Web harness identity:
  `explorer=open`, `explorerPath=README.md`, and
  `explorerActionMenu=open`.
- The real selected-file preview mounted its `More actions` menu at
  `320x200`, dark.
- Popup measured `208x116 @ (100,84)` and ended exactly at `y=200`.
  `Reference in chat` and `Ask why this changed` remained fully visible.
- This is a deterministic short-height layout pass, contribution
  `0.00 -> 0.00`; no product code change was required and neither chat action
  was activated.

## 2026-08-17 Explorer line-comment editor at 320x200

- A canonical branch-backed thread used `explorer=open`,
  `explorerPath=package.json`, and `explorerCommentLine=1` to mount the real
  syntax-preview comment editor at `320x200`, dark.
- `README.md` was rejected as an invalid fixture because Markdown preview has
  no line-number comment editor.
- Before, the preview scroller ended at `x=308`, but the fixed 240px comment
  editor reached `x=367` and actions `x=352`; no horizontal owner existed.
- `lynx-explorer-comment-compact-horizontal-overflow`: P1 contribution
  `1.00 -> 0.00`.
- Compact Explorer now removes the fixed minimum width and uses
  `width: calc(100% - 12px)` with 6px side margins.
- After, editor ended at `x=302` and actions at `x=287`, both inside the preview
  boundary `x=308`. Vertical content remains owned by the real
  `ExplorerDockPreviewScroll`.
- Focused Explorer suite passed `2/2`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only.

## 2026-08-17 Editor chat-history dialog at 320x200

- A canonical thread used `editor=open` and `editorHistory=open` to mount the
  real custom chat-history overlay at `320x200`, dark.
- Dialog measured `296x120 @ (12,40)` with its close action in bounds.
  Heading was `21px @ y=57`, description `15px @ y=82`, and the active
  34px history row fit at `y=109..143`.
- This is a deterministic one-item short-height layout pass, contribution
  `0.00 -> 0.00`; no product code change was required and no history item was
  activated.

## 2026-08-17 Editor new-rail-item dialog at 320x200

- Canonical `project.create` and `thread.create` commands established
  `project-fidelity-editor-new` and `thread-fidelity-editor-new`; the read
  model advanced from sequence `0` to `2` without direct SQLite writes.
- The explicit Web harness identity `editor=open&editorNew=open` mounted the
  real `New editor rail item` overlay on a direct cold `320x200` entry, dark.
- Dialog measured `240x123 @ (40,38.5)` with `clientHeight=121` and
  `scrollHeight=121`. `New chat` occupied `y=76.5..110.5`; `New terminal`
  occupied `y=114.5..148.5`. The complete dialog ended at `y=161.5`.
- A separate `320x568 -> 320x200` hydration probe produced identical geometry,
  so the direct short entry does not depend on a taller initial viewport.
- This is a deterministic short-height layout pass, contribution
  `0.00 -> 0.00`; no product code change was required and neither creation
  action was activated.
- Rejected harness probes were kept separate: Web authority was sampled before
  usable hydration, a static server entry was addressed as `/lynx/index.html`
  instead of `/index.html`, and a standalone `8904` origin was not trusted by
  the isolated server. None was scored as product evidence. The accepted cell
  used Vite's existing `/lynx` development surface on trusted origin `8891`.
- The accepted relay had one connection attempt, zero pending requests, and no
  transport error. The environment-only `provider.listModels` error
  (`codex not found in PATH`) remains accepted noise and did not affect the
  mounted dialog or its geometry.
- Every failed or successful browser workflow ran through
  `bun run browser:run -- ...`. Each failure was followed by an independent
  `browser:cleanup` plus `session list` gate before continuing.

## 2026-08-17 Temporary Thread marker at 320x200

- Active discovery combined an ordinary empty Thread, dark theme,
  `temporary=open`, and the extreme `320x200` viewport. Earlier temporary
  coverage tested departure cleanup but not active-state reachability.
- Web authority retained a real icon-only `Temporary chat` control at
  `32x32 @ (144,161.671875)`. A rendered browser click set
  `aria-pressed=true` without viewport overflow.
- Lynx received the same active state but hid the complete context tray at
  short height, leaving a destructive-on-departure state with no visible or
  operable marker.
- `lynx-temporary-thread-short-marker-hidden`: P1 contribution
  `1.00 -> 0.00`.
- The short-height Thread contract still hides the decorative hero and direct
  provider banner, but now degrades the shared context tray to a centered
  icon-only `28x28 @ (146,170)` Temporary control with 2px bottom clearance.
  It does not overlap the Composer footer at `y=142..170`.
- `accessibility-label=Temporary chat`, button traits, and active state remain.
  At `320x568`, the original `296x58` tray and `102x28` button are unchanged.
- Focused tests passed `6/6`; Lynx-for-Web and Native/Desktop production builds
  passed with registered warnings only. Native loaded the same current bundle
  and snapshot in a background exact-owned instance but published no new
  DevTool client, so Native DOM/interaction remains harness missing coverage.
- Detailed evidence:
  `shots/2026-08-17/temporary-thread-short-height/notes.md`.

## 2026-08-17 Explorer query at 320x200

- Active discovery combined an ordinary Thread Explorer, a real repository,
  populated/no-result queries, dark theme, and the extreme `320x200` viewport.
  Previous search evidence covered normal and Editor compact sizes only.
- Before, the desktop `480px` minimum placed the dock at `x=-160..320`.
  Search, results, and `No matching files.` were almost entirely offscreen;
  the dock also started at `y=46`, inside the 92px compact Thread header.
- `lynx-explorer-query-compact-offscreen`: P1 contribution
  `1.00 -> 0.00`.
- The compact ordinary Thread dock now clamps to `320x108 @ (0,92)` while
  preserving Web's horizontal 240px sidebar + flexible preview anatomy.
- Search is `231x28 @ (5,124)`. The result owner is
  `239x43 @ (1,157)` with `scrollHeight=3478`; its first 40px result ends
  exactly at `y=200`. The no-result copy ends at `y=187.5`.
- Focused Explorer tests passed `2/2`; Lynx-for-Web and Native/Desktop
  production builds passed with registered warnings only. Native build is
  supporting evidence because the host cannot represent `320x200`.
- A Web authority hydration failure was rejected and separately classified;
  it was not used as product evidence.
- Detailed evidence:
  `shots/2026-08-17/explorer-query-short-height/notes.md`.

## 2026-08-17 Explorer selected preview at 320x200

- Discovery continued from the newly reachable compact query list into its
  selected-file state rather than treating search reachability as full
  Explorer coverage.
- With the desktop 240px sidebar retained, the selected preview received only
  79px. `package.json` collapsed to a `19x96` path and escaped its 40px header;
  the source scroller was only 71px wide.
- `lynx-explorer-selected-preview-compact-cramped`: P1 contribution
  `1.00 -> 0.00`.
- Compact ordinary Thread Explorer now splits the dock 50/50 while preserving
  Web's horizontal sidebar + preview anatomy. Auxiliary result paths hide only
  at short height; filenames and canonical result rows remain.
- After, sidebar and preview are each about `159.5px`; the filename is
  `99.5x16`, the 28px More actions control remains in bounds, and the source
  scroller is `151.5px` wide with its full vertical range.
- The preceding query cell was reverified: its first result is a complete 28px
  row ending at `y=188`, so the continuation does not regress search.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed with registered warnings only.
- Detailed evidence:
  `shots/2026-08-17/explorer-selected-preview-short-height/notes.md`.

## 2026-08-17 Explorer PDF at 320x200

- Active discovery continued into the distinct PDF fallback branch using a
  canonical one-page PDF fixture.
- Before, the nested 44px PDF toolbar overflowed to `x=414.125`; the safe Open
  action was offscreen and the page frame began at `y=208`.
- `lynx-explorer-pdf-compact-toolbar-overflow`: P1 contribution
  `1.00 -> 0.00`.
- Short-height PDF fallback now uses full preview height, a 32px toolbar,
  page-count + Open controls, a 28px More actions overlay, and hides only the
  duplicate identity plus disabled single-page navigation.
- After, Open ends at `x=284`; the page image is
  `155.5x43 @ (162.5,155)` and ends at `y=198`.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed with registered warnings only. Open was not activated because it
  would launch an external application.
- Detailed evidence:
  `shots/2026-08-17/explorer-pdf-short-height/notes.md`.

## 2026-08-17 Explorer image at 320x200

- Active discovery continued into the distinct image-preview branch using a
  real `32x24` PNG fixture.
- Before, the 40px selected-file header plus filename footer and frame gap left
  the aspect-fit image only `151.5x8`.
- `lynx-explorer-image-compact-preview-collapsed`: P1 contribution
  `1.00 -> 0.00`.
- Short-height image preview now uses full content height, hides only duplicate
  path/filename copy, and keeps More actions as a 28px overlay.
- After, the image is `155.5x76 @ (162.5,122)` and ends at `y=198`.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed with registered warnings only.
- Detailed evidence:
  `shots/2026-08-17/explorer-image-short-height/notes.md`.

## 2026-08-17 Explorer Markdown at 320x200

- Active discovery continued into the shared Markdown-renderer branch with the
  canonical repository `README.md`.
- Before, the 40px selected-file header left a 32px Markdown scroll owner; the
  first 30px heading ended at `y=209` and was clipped.
- `lynx-explorer-markdown-compact-preview-collapsed`: P1 contribution
  `1.00 -> 0.00`.
- Short-height Markdown preview now uses full content height, hides only the
  duplicate path, and keeps More actions as a 28px overlay.
- After, the scroll owner is `155.5x76 @ (162.5,122)` and the first heading is
  fully visible at `y=137..167`.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed with registered warnings only.
- Detailed evidence:
  `shots/2026-08-17/explorer-markdown-short-height/notes.md`.

## 2026-08-17 Explorer multi-page PDF at 320x200

- Active discovery rechecked compact PDF with a real two-page fixture instead
  of extrapolating the single-page fallback.
- Before, `1 / 2` rendered but Previous and Next were both `display:none`.
- `lynx-explorer-pdf-compact-navigation-hidden`: P1 contribution
  `1.00 -> 0.00`.
- Multi-page compact PDFs now restore 28px `‹`/`›` navigation and a 28px Open
  glyph in one non-overlapping toolbar; single-page PDFs still hide ineffective
  navigation.
- Controlled activation changed `1 / 2 -> 2 / 2` and the preview URL from
  `page=1` to `page=2`. This is handler evidence, not claimed pointer evidence.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed with registered warnings only.
- Detailed evidence:
  `shots/2026-08-17/explorer-pdf-multi-page-short-height/notes.md`.

## 2026-08-17 Explorer long selected path at 320x200

- Active discovery selected a deeply nested JSON file with a long filename.
- Before, the path became `99.5x128 @ (172.5,75.5)` and painted through its
  40px header into the content; header `scrollHeight` was 84px.
- `lynx-explorer-long-path-header-wrap`: P1 contribution `1.00 -> 0.00`.
- The shared preview-path owner now enforces one-line ellipsis with hidden
  overflow.
- After, the path is `99.5x16 @ (172.5,131.5)`, header `scrollHeight=39`, and
  More actions remains in bounds.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed with registered warnings only.
- Detailed evidence:
  `shots/2026-08-17/explorer-long-path-short-height/notes.md`.

## 2026-08-17 Explorer read-error recovery at 320x200

- A real missing selected path produced canonical `projects.readFile` failure
  in the ordinary compact Explorer.
- `Could not read this file.` measured `131.71875x18 @ (174.390625,171)` and
  ended at `y=189`; path and More actions remained in bounds.
- Controlled activation of a real sibling file changed the selected path,
  removed the error, loaded `available`, and issued a fresh read RPC.
- This is a compact failure-boundary and recovery pass, contribution
  `0.00 -> 0.00`; no product code change was required. Activation is
  handler/state evidence, not claimed pointer evidence.
- Detailed evidence:
  `shots/2026-08-17/explorer-read-error-short-height/notes.md`.

## 2026-08-17 Explorer expanded tree at 320x200

- A real nested workspace mounted root plus two expanded directory levels in
  the ordinary compact Explorer.
- All rows remained `152.5x28`; indentation was 8/20/32px for
  root/child/grandchild, and copy stayed inside `x=148.5`.
- The entries owner was `158.5x43` with `scrollHeight=174`, and three canonical
  directory-list RPCs loaded the hierarchy.
- This is a compact tree product pass, contribution `0.00 -> 0.00`; no code
  change was required. Deterministic expansion and measured scroll range are
  not claimed as pointer or wheel evidence.
- Detailed evidence:
  `shots/2026-08-17/explorer-tree-short-height/notes.md`.

## 2026-08-17 Explorer Reference in chat at 320x200

- The previously unexecuted `Reference in chat` menuitem was activated through
  its real accessibility ref for selected `package.json`.
- The menu closed and the composer received a structured mention placeholder.
  After revealing the composer, `ComposerChip--mention` measured
  `92.5625x19.5 @ (27,120.25)` with label `package.json`.
- This is a compact action product pass, contribution `0.00 -> 0.00`; no code
  change was required.
- A failed direct text-selector probe was cleaned before the retained ref-based
  interaction. Explorer Close was controlled DOM activation only and is not
  claimed pointer evidence here.
- Detailed evidence:
  `shots/2026-08-17/explorer-reference-action-short-height/notes.md`.

## 2026-08-17 Explorer Ask why this changed at 320x200

- The second compact Explorer action was activated through its real accessible
  menuitem ref for `package.json`.
- The composer received the exact Ask-why prompt and a structured
  `ComposerChip--mention` measuring
  `92.5625x19.5 @ (154.984375,120)`.
- The mention placeholder stayed between the prompt prefix/suffix, and the
  projected sentence remained complete.
- This is a compact action product pass, contribution `0.00 -> 0.00`; no code
  change was required. Explorer Close is controlled DOM activation only.
- Detailed evidence:
  `shots/2026-08-17/explorer-ask-why-action-short-height/notes.md`.

## 2026-08-17 Explorer persisted width at 320x200

- A deterministic `explorerWidth=960` restoration tested inline width
  precedence against the compact responsive dock.
- At `320x200`, runtime clamped to a `320x108 @ (0,92)` dock with 159.5px
  sidebar/preview halves and Thread `padding-right:0`.
- At `1280x820`, the same request restored to 704px with matching Thread
  padding, preserving the 320px minimum main content area.
- This is a persisted-width responsive pass, contribution `0.00 -> 0.00`; no
  code change or resize interaction was required.
- Detailed evidence:
  `shots/2026-08-17/explorer-persisted-width-short-height/notes.md`.

## 2026-08-17 Explorer root-list error at 320x200

- A canonical project/thread lost its real workspace root before Explorer
  opened, producing a genuine `projects.listDirectories` failure.
- `Could not load files.` measured
  `112.828125x18 @ (23.828125,169.5)` and ended at `y=187.5`.
- Search, Close, entries owner, and empty preview all remained in bounds.
- This is a compact failure-boundary pass, contribution `0.00 -> 0.00`; no code
  change was required and no automatic retry is claimed.
- Detailed evidence:
  `shots/2026-08-17/explorer-list-error-short-height/notes.md`.

## 2026-08-17 Explorer close transition at 320x200

- A selected source preview was closed from the ordinary compact Explorer.
- Before, the dock was `320x108 @ (0,92)`, Files was active, and the composer
  input was `296x62 @ (12,115)`.
- Controlled activation unmounted the dock/Close control, removed the active
  Files class, kept `padding-right:0`, and preserved the composer geometry.
- This is a compact close-transition product pass, contribution
  `0.00 -> 0.00`; no code change was required. Activation is handler/state
  evidence, not claimed pointer evidence.
- Detailed evidence:
  `shots/2026-08-17/explorer-close-short-height/notes.md`.

## 2026-08-17 Explorer long source line at 320x200

- Active discovery selected a real JSON file containing one 500-character
  unbroken line.
- Before, the compact source code retained `white-space:pre` inside a
  vertical-only Lynx scroll owner. The code measured `117.5x17`, and almost
  all 512 characters were clipped with no horizontal interaction path.
- `lynx-explorer-source-long-line-clipped`: P1 contribution
  `1.00 -> 0.00`.
- Short-height ordinary Thread Explorer now uses `pre-wrap` plus `break-word`
  for syntax content. Normal-height and Editor Explorer rendering remain
  unchanged.
- After, the code is `117.5x527`, the syntax container is `151.5x544`, and
  the existing scroller has `scrollHeight=544` with no horizontal overflow.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed with registered warnings only.
- Detailed evidence:
  `shots/2026-08-17/explorer-long-line-short-height/notes.md`.

## 2026-08-17 Explorer truncated preview at 320x200

- Active discovery selected real text and Markdown files above the canonical
  `1,000,000` byte read limit. `projects.readFile` returned exactly
  `1,000,000` characters with `truncated:true`.
- Before, Lynx placed its only disclosure after the one-megabyte content body:
  `784594px` below the compact viewport and `522424px` below the normal
  `1280x820` viewport.
- `lynx-explorer-truncated-disclosure-buried`: P1 contribution
  `1.00 -> 0.00`.
- Truncation is now fixed preview identity: Lynx shows accessible `Partial` in
  ordinary, normal, and compact Markdown headers; Web shows `Partial` at narrow
  width and `Shown partially` at its existing header breakpoint.
- Compact ordinary filename, disclosure, and More actions have zero overlap.
  Compact Markdown keeps its full-height content and a non-overlapping
  `Partial` + More overlay.
- Lynx focused tests passed `5/5`, Web focused test passed `1/1`, and all three
  production builds passed.
- Exact Web runtime hydration published no body or controls and was classified
  as harness loss rather than product evidence.
- Detailed evidence:
  `shots/2026-08-17/explorer-truncated-preview-short-height/notes.md`.

## 2026-08-17 Explorer corrupt image at 320x200

- Active discovery selected a real `.png` whose 30-byte body was not valid PNG
  data. The local-image request returned HTTP `200`, isolating decode failure
  from URL, transport, authorization, and missing-file errors.
- Before, Lynx retained a `155.5x76` blank image/frame with no error copy after
  decode failed.
- `lynx-explorer-image-decode-failure-blank`: P1 contribution
  `1.00 -> 0.00`.
- A keyed `ExplorerImagePreview` now handles the real `binderror`, unmounts the
  failed image, and renders the existing `Could not load this image.` state.
- After, the error measured `147.59375x18 @ (166.453125,151)` and ended at
  `y=169`, fully inside the compact viewport. Runtime evidence came from the
  browser decoder, not synthetic state mutation.
- Focused Lynx tests passed `3/3`; Lynx-for-Web and Native/Desktop production
  builds passed.
- Detailed evidence:
  `shots/2026-08-17/explorer-corrupt-image-short-height/notes.md`.

## 2026-08-17 Explorer corrupt PDF at 320x200

- Active discovery selected a real malformed PDF whose canonical metadata RPC
  failed with `InvalidPDFException: Invalid PDF structure.`.
- The same thread without a selected PDF hydrated normally. With the corrupt
  PDF path, Lynx-for-Web remained on `Preparing Synara…` for more than
  20 seconds and never published Explorer or local error UI.
- Raw wire evidence showed an Effect RPC `Defect` frame without a request id.
  The Web relay parsed only `Exit`/`Chunk`, dropped the defect, and left
  `projects.inspectPdf` pending forever.
- `lynx-web-rpc-defect-bootstrap-deadlock`: P0 contribution
  `1.00 -> 0.00`.
- The relay now recognizes connection-level defects, clears and rejects all
  pending RPCs as business failures, preserves the healthy socket, and lets
  existing local error boundaries settle.
- After, the compact Explorer rendered `Could not render this PDF.` in a
  `137.828125x26` error container ending at `y=190.5`; a later canonical
  snapshot RPC succeeded on the same connection.
- A nine-second stability run held `pendingRequests=0` and a stable
  `projects.inspectPdf` count, rejecting the initial transient pending sample
  as a leak.
- Focused tests passed `8/8`; Lynx-for-Web and Native/Desktop production builds
  passed.
- Detailed evidence:
  `shots/2026-08-17/explorer-corrupt-pdf-short-height/notes.md`.

## 2026-08-17 Explorer binary file at 320x200

- Active discovery selected a real file containing NUL/non-text bytes,
  exercising a distinct canonical `projects.readFile` failure.
- The ordinary compact Explorer rendered `Could not read this file.` at
  `131.71875x18 @ (174.390625,171)`, ending at `y=189`.
- The renderer reached its ready route, transport stayed healthy, and
  `projects.readFile` remained at one call.
- This is a compact failure-boundary pass, contribution `0.00 -> 0.00`; no
  product code change was required.
- The known `provider.listModels: codex not found in PATH` failure was
  classified as accepted environment noise.
- Detailed evidence:
  `shots/2026-08-17/explorer-binary-file-short-height/notes.md`.

## 2026-08-17 Explorer nested directory error at 320x200

- Active discovery exposed a root directory successfully, then produced a real
  nested `projects.listDirectories` `EACCES` failure on expansion.
- Before, the 28px error began at `y=184.921` and ended at `212.921`, below
  the 43px entries owner and viewport. A real wheel interaction left
  `scrollTop=0`, so the nominal scroll range did not make it reachable.
- `lynx-explorer-nested-directory-error-clipped`: P1 contribution
  `1.00 -> 0.00`.
- Short-height ordinary Explorer now compresses only nested loading/error state
  rows to 12px with 9px meta type; normal-size and Editor contracts remain
  unchanged.
- After, the 28px directory row plus `152.5x12 @ (4,188)` error fit exactly
  inside the entries owner, ending at `y=200` without scrolling.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed.
- Detailed evidence:
  `shots/2026-08-17/explorer-nested-directory-error-short-height/notes.md`.

## 2026-08-17 Explorer PDF page load failure at 320x200

- A valid two-page PDF returned metadata and rendered page 1 successfully.
  After the owned file was deleted, a real browser pointer activated Next.
- Before, the state changed to `2 / 2` and the page endpoint returned HTTP
  `422`, but Lynx retained a blank `155.5x43` page image with no error.
- `lynx-explorer-pdf-page-load-failure-blank`: P1 contribution
  `1.00 -> 0.00`.
- A URL-keyed `ExplorerPdfPageImage` now handles the real `binderror`, unmounts
  the failed image, and renders the existing PDF error state.
- After, `Could not render this PDF.` measured
  `137.828125x26 @ (171.328125,163.5)`, ending at `y=189.5`; pending requests
  remained zero.
- Focused tests passed `3/3`; Lynx-for-Web and Native/Desktop production builds
  passed.
- Detailed evidence:
  `shots/2026-08-17/explorer-pdf-page-load-failure-short-height/notes.md`.

## 2026-08-17 Explorer truncated search at 320x200

- A canonical 100-file workspace returned exactly 80 `match` results with
  `truncated:true`.
- Before, Lynx rendered all 80 returned rows but discarded the truncation flag,
  giving no indication that 20 matches were omitted.
- `lynx-explorer-search-truncation-hidden`: P1 contribution
  `1.00 -> 0.00`.
- The flag now flows through active thread data and both Explorer
  presentations. A shared footer asks the user to refine the search.
- At short height, the first row is `158.5x28 @ (1,157)` and the footer is
  `158.5x14 @ (1,186)`; both are fully visible and the footer ends at `y=200`.
- Intermediate empty-renderer probes were classified as harness failures. One
  revealed and fixed a missing ThreadPage prop destructure before final
  evidence was retained.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed.
- Detailed evidence:
  `shots/2026-08-17/explorer-truncated-search-short-height/notes.md`.

## 2026-08-17 Explorer empty source at 320x200

- A canonical zero-byte text file returned successfully with content length
  `0` and `truncated:false`.
- Before, both Web source and Lynx rendered an unexplained blank code surface;
  Lynx's code element had zero height and no state copy.
- `explorer-empty-file-indistinguishable`: P1 contribution
  `1.00 -> 0.00`.
- Successful zero-byte reads now show `Empty file.` through each renderer's
  shared compact state component.
- In Lynx, the state measured
  `59.9375x18 @ (210.28125,171)` and ended at `y=189`; the empty source
  scroller/code no longer mounted.
- Focused Lynx and Web tests passed `2/2` each; all three production builds
  passed.
- Detailed evidence:
  `shots/2026-08-17/explorer-empty-source-short-height/notes.md`.

## 2026-08-17 Explorer long search result at 320x200

- A real root-level filename with 241 characters matched a compact Explorer
  search.
- Before, the result row grew to `152.5x248`, its name grew to 240px tall, and
  the same root filename rendered twice as name and path.
- `lynx-explorer-long-search-result-wrap`: P1 contribution
  `1.00 -> 0.00`.
- Result copy now clips overflow, name/path use one-line ellipsis, and
  root-level auxiliary paths are omitted when identical to the filename.
- After, the row returned to `152.5x28 @ (4,160)` and the name to
  `116.5x16 @ (32,166)` with no duplicate path.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed.
- Detailed evidence:
  `shots/2026-08-17/explorer-long-search-result-short-height/notes.md`.

## 2026-08-17 Editor Explorer truncated search at 320x200

- The canonical 80-result `truncated:true` search was opened in the distinct
  Editor Search presentation.
- Before, Editor retained a 176px sidebar inside its 76px center row; the
  22px truncation footer began at `y=199` and ended at `221`, while the Editor
  surface grew to 252px.
- `lynx-editor-explorer-truncated-footer-offscreen`: P1 contribution
  `1.00 -> 0.00`.
- Short-height Editor Search now uses the actual center height, compact search
  and footer spacing, a complete 28px first row, and hides the zero-space empty
  preview.
- After, dock/sidebar are `272x76 @ (48,46)`, first row is
  `272x28 @ (48,79)`, and footer is `272x14 @ (48,107)`, ending at `y=121`.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed.
- Detailed evidence:
  `shots/2026-08-17/editor-explorer-truncated-search-short-height/notes.md`.

## 2026-08-17 Explorer Markdown file link at 320x200

- A canonical `README.md` rendered an inline-code reference to `target.txt`.
- The real token measured `75.28125x17 @ (203.203125,184)` and published
  `Open target.txt`.
- Trusted browser mouse move/down/up changed the selected path to `target.txt`,
  unmounted Markdown, loaded `target content`, and issued a fresh
  `projects.readFile`.
- This is a compact interaction pass, contribution `0.00 -> 0.00`; no code
  change was required.
- Earlier probes selected the sidebar row with the same accessibility label or
  used invalid `@target.txt` Markdown syntax; both were classified as harness
  mismatches and cleaned before retained evidence.
- Detailed evidence:
  `shots/2026-08-17/explorer-markdown-file-link-short-height/notes.md`.

## 2026-08-17 Explorer truncated-search refine at 320x200

- The canonical 100-file truncated search started with query `match`.
- The real accessible search input was filled with `match-100`.
- After settlement, the footer unmounted, entries returned to
  `158.5x43 @ (1,157)`, and the only result was a complete
  `152.5x28 @ (4,160)` row for `match-100.txt`.
- A new `projects.searchEntries` RPC carried the refined query.
- This is a compact interaction pass, contribution `0.00 -> 0.00`; no product
  code change was required.
- The first probe expected the wrong accessibility role and was cleaned before
  the retained exact-ref interaction.
- Detailed evidence:
  `shots/2026-08-17/explorer-truncated-search-refine-short-height/notes.md`.

## 2026-08-17 Explorer nested search identity at 1280x820

- A normal-size search returned `src/deep/needle.ts`.
- Before, Lynx rendered `needle.ts` plus `src/deep/needle.ts`, duplicating the
  filename and weakening filename/directory hierarchy.
- `lynx-explorer-nested-search-path-duplicates-name`: P1 contribution
  `1.00 -> 0.00`.
- Result rows now derive only the normalized directory prefix and omit it for
  root-level files.
- After, filename remained `needle.ts` and the auxiliary path became
  `src/deep/`, shrinking from `89.5625px` to `45.3125px`.
- Focused tests passed `2/2`; Lynx-for-Web and Native/Desktop production builds
  passed.
- Detailed evidence:
  `shots/2026-08-17/explorer-nested-search-identity-normal/notes.md`.

## 2026-08-17 Explorer search error at 320x200

- A canonical workspace root was removed before opening Explorer with a
  non-empty query, producing a real `projects.searchEntries` failure.
- Lynx rendered `Could not load files.` at
  `112.828125x18 @ (23.828125,169.5)`, ending at `y=187.5`.
- The renderer stayed ready, pending requests returned to zero, and the empty
  preview copy remained contained.
- This is a compact search failure-boundary pass, contribution
  `0.00 -> 0.00`; no code change was required.
- Detailed evidence:
  `shots/2026-08-17/explorer-search-error-short-height/notes.md`.

## 2026-08-17 Editor Changes at 320x200

- Active discovery moved from Explorer preview states to a new Editor Changes
  presentation with a canonical two-file, `449`-byte working-tree patch.
- The `76px` Editor center retained a fixed `176px` changed-files sidebar,
  placing the diff scroller entirely below the visible center and growing the
  Editor body from `154px` client height to `200px` scroll height.
- Short-height Editor Changes now uses a `104px` full-height file rail beside
  a `168x76` patch scroller. Both complete file rows and the selected patch
  remain reachable, while normal `1280x820` Editor keeps its `224px` sidebar.
- `lynx-editor-diff-short-preview-offscreen`: P1 contribution
  `1.00 -> 0.00`.
- The Web authority empty-root condition, a rejected stale-bundle capture, and
  missing browser refs for custom diff rows are separately classified as
  harness losses or missing interaction coverage, not product passes.
- Detailed evidence:
  `shots/2026-08-17/editor-diff-short-height/notes.md`.

## 2026-08-17 Environment close containment at 320x200

- Active discovery entered the standalone Changes dock through a real pointer
  click on the rendered Environment `Changes` row in a canonical clean Git
  workspace.
- The clean dock itself passed: `320x154`, with the complete
  `No working tree changes.` state in a `319x110` scroller.
- Opening Changes translated the closed Environment overlay to `x=320..632`.
  Before the fix this expanded root/page `scrollWidth` from `320` to `632`,
  and a real Close interaction removed the dock without restoring the root.
- `ThreadPage` now clips its page-internal overlays. Root width remains
  `320/320` before open, while Changes is open, and after Close; the normal
  `1280x820` Environment surface remains fully visible.
- `lynx-environment-close-offcanvas-overflow`: P1 contribution
  `1.00 -> 0.00`.
- Detailed evidence:
  `shots/2026-08-17/environment-close-containment-short-height/notes.md`.

## 2026-08-17 Standalone Changes error at 320x200

- A valid hydrated Git workspace was removed before opening standalone
  Changes, producing a real `git.readWorkingTreeDiff` typed failure.
- The `110px` dock body retained a `180px` state minimum: the error copy ended
  at `y=201`, Retry at `y=206`, and the state itself at `y=282`.
- Short-height standalone state feedback now fills its actual scroller:
  state `295x86 @ y=102..188`, copy ending at `154`, Retry ending at `159`,
  and scroller `110/110` client/scroll height.
- A real Retry mouse click increased `git.readWorkingTreeDiff` calls from
  `1` to `2`; the repeated failure stayed local and pending requests returned
  to zero.
- `lynx-standalone-diff-error-short-overflow`: P1 contribution
  `1.00 -> 0.00`.
- Detailed evidence:
  `shots/2026-08-17/standalone-diff-error-short-height/notes.md`.

## 2026-08-17 Standalone Changes recovery at 320x200

- After reaching the real contained Changes error, the same workspace path was
  recreated as a clean Git repository and the rendered Retry control received
  a real pointer click.
- `git.readWorkingTreeDiff` calls increased from `1` to `2`; the error state
  disappeared, `No working tree changes.` replaced it, `lastRpcError` cleared,
  pending requests returned to zero, and root width stayed `320/320`.
- `standalone-diff-error-recovery`: missing coverage `1.00 -> 0.00`;
  product-loss contribution `0.00 -> 0.00`.
- Detailed evidence:
  `shots/2026-08-17/standalone-diff-recovery-short-height/notes.md`.

## 2026-08-17 Standalone populated Changes at 320x200

- A canonical `501`-byte, two-file working-tree diff was opened through a real
  Environment `Changes` click.
- Collapsed state retained `Changes`, `+4/-2`, the complete first file
  identity, and the second file in a `319x110` scroll owner.
- A real first-file click expanded `docs/readme.md` to `134px` and mounted its
  real patch while root width stayed `320/320`.
- `standalone-diff-populated-compact`: missing coverage `1.00 -> 0.00`;
  product-loss contribution `0.00 -> 0.00`.
- The attempted mouse-wheel probe did not produce retained scroll-position
  evidence, so wheel behavior remains harness missing coverage rather than a
  claimed pass.
- Detailed evidence:
  `shots/2026-08-17/standalone-diff-populated-short-height/notes.md`.
