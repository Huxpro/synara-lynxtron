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
| Lynx-for-Web | Named isolated browser sessions used real canonical server snapshots and deterministic init only where the dynamic-event blocker prevents retained clicks. | Passing for rendered/geometry states; interaction coverage remains blocked. |
| Native | Production bundles build and stage, but no exact-owned Native Editor client can coexist with the user-owned PID `77846` on fixed DevTool port `8901`. | Incomplete; harness blocker, not product loss. |
| 2. Identity preflight | Editor ledger records `.synara-fidelity-editor-changes`, server port `59260`, canonical project/thread/workspace IDs, viewport/DPR/theme, sequential trusted origins, PNG dimensions, and relay identity. | Passing for retained fast-loop cells. |
| Harness mismatch separation | Empty accessibility snapshots, unquoted zsh URL globbing, origin mismatch, capture timing, fixed Native port, and provider CLI absence are explicitly classified separately. | Passing. |
| 3. Screenshot evidence | Retained `/tmp/synara-editor-*.png` paths are enumerated in the Editor ledger. Local screenshot count was rechecked at `47`, below the 100-image cap. | Passing. |
| Geometry evidence | Each Editor slice records measured rail/sidebar/preview/Chat/header boundaries before and after. | Passing. |
| Style/token evidence | Light-theme root, sidebar, selected-row, addition, deletion, divider, and foreground tokens are recorded. | Passing. |
| Console/relay evidence | Retained cells record Web console state and Lynx relay connection count, pending count, RPC tags, transport error, and RPC error. | Passing where applicable. |
| Behavior evidence | Web retained real clicks for changed-file selection, Search, Chat visibility, project switching, and theme. Lynx deterministic projections are explicitly not mislabeled as click evidence. | Partial because dynamic product handlers do not publish in Lynx-for-Web. |
| Ledger update | `shots/2026-08-14/editor-view/notes.md` contains before/after values and residual classifications for every current Editor slice. | Passing. |
| 4. Highest loss first | P1 Editor losses closed include missing Editor/Changes, pre-relay loading, dead center area, hidden patch, compact navigation, cramped preview, clean-copy semantics, non-Git misclassification, medium compression, compact stale width, and header hierarchy. | Passing for discovered local losses. |
| No score manipulation | Loss changes come from product implementation and measured geometry/state changes; no weight/filter/scope reduction was used. | Passing. |
| 5. Focused tests | Relevant Rstest/Vitest suites were run after each slice. Recent examples: Editor 5/5, Editor+resize 9/9, Editor+Desktop 19/19, Web Editor 15/15. | Passing for committed slices. |
| Production build | `CI=1 bun run build` in `apps/lynx` passed after each code slice, staging Lynx and Desktop bundles. Existing optional `bufferutil` / `utf-8-validate` and unsupported CSS warnings remain named. | Passing. |
| Web validation | Real Web authority cells were captured for every paired Editor slice. | Passing. |
| Lynx validation | Real canonical RPC data, geometry, tokens, and relay state were captured for every paired Editor slice. | Passing. |
| Native validation | Exact-owned Native Editor certification was not performed because the workspace executable and user-owned app contend for the fixed DevTool listener. | Incomplete harness boundary. |
| 6. Independent commits | Recent coherent commits range from `f90858e94` through `e99b1c36b`; every code/evidence slice was pushed immediately. | Passing. |
| Commit trailer | Recent commit messages were checked and contain exactly one `Co-authored-by: TRAE CLI <noreply@bytedance.com>` trailer. | Passing. |
| Remote state | Local `HEAD` and `origin/huxcx/lynxtron-port-current-state` were repeatedly compared after push. | Passing at the last checked commit. |
| Working tree hygiene | Only pre-existing `.p10-view/` and `.p10-view-native/` remain untracked and untouched. | Passing. |
| 7. No new scope | New Editor states continued to produce real P1/P2 findings, so exhaustion has not yet been proven. | Not achieved. |
| All P0/P1 closed | Local discovered Editor P1 product losses are closed. `lynx-web-pointer-to-bindtap` remains a P1 fast-loop interaction blocker for ReactLynx dynamic event registration. | Not achieved. |

## Verifier coverage audit

- Focused tests cover contracts and source wiring but cannot prove browser event
  publication, exact Native input semantics, or visual geometry by themselves.
- `CI=1 bun run build` proves bundle production/staging, not behavior.
- The host-input probe proves static `tap` delivery, but the real Editor rail
  proves dynamic handler IDs compiled through ReactLynx `updateEvent` still do
  not publish. The probe is therefore not a global interaction pass.
- Deterministic init states prove product rendering and data projection, not
  the blocked click that would normally enter those states.
- Web screenshots with empty accessibility/`innerText` extraction were rejected
  unless direct product-node DOM and geometry proved the state.
- Native production builds do not certify the running executable, staged
  bundle, PID-derived client, focus, IME, accessibility, restart, or persistence.

## Missing and uncovered requirements

1. **P1 harness blocker:** `lynx-web-pointer-to-bindtap` remains open for
   ReactLynx dynamic event registration. Static snapshot events work; handlers
   compiled through `updateEvent` do not reach product callbacks.
2. **Native certification:** exact-owned Editor cells remain blocked while the
   user-owned PID `77846` occupies the fixed DevTool port `8901`.
3. **P2 Editor coverage:** project switching and Chat-history/terminal tab
   lifecycle remain incomplete. The project-switch Menu trial was reverted
   after it produced an empty Lynx root.
4. **Discovery exhaustion:** other route/state/theme/viewport combinations have
   not been proven exhausted.

## Completion decision

The active objective is **not achieved**. No `update_goal complete` call is
permitted while the dynamic-event P1 blocker, Native certification boundary,
and discovery-exhaustion requirement remain open.
