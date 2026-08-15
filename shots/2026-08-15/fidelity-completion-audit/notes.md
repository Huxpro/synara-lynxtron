# Fidelity Loss Loop completion audit

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

## Completion decision

The active objective is **not achieved**. No `update_goal complete` call is
permitted while the Native certification boundary, route-specific missing
interaction coverage, and discovery-exhaustion requirement remain open. The
former dynamic-event P1 is no longer a valid blocker.
