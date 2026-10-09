# Upstream sync 2026-09-29

Merge of `Emanuele-web04/synara` `main` at `529ad049c` (1,460 upstream commits since the
merge base `a183bac9c`) into the Lynxtron port (1,624 fork commits), on branch
`huxcx/upstream-sync-2026-09-29`. Electron (`apps/desktop` + `apps/web`) stays the only UI/UX
standard; this merge adopts upstream's Electron product and keeps the Lynx renderer building,
passing its tests and sharing code with web where it did before.

## Resolution policy

- Non-Lynx web files, server, desktop, contracts and shared take upstream's logic. The fork's
  platform-neutral access (`~/platform/*`), shared extractions and harness hooks were
  re-applied on top of upstream's version wherever the fork depended on them.
- Files in the Lynx reuse graph were merged by hand. Upstream logic was ported into the fork's
  shared `.logic` modules instead of forking it again.
- Features that upstream removed were removed from Lynx too: thread markers, the Workspace view,
  the Kilo provider (migrated to OpenCode), `stopOnError`, and the automation edit dialog.

## Fork hooks re-applied onto upstream files

| Area           | What was restored                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Harness        | `data-thread-id`/`data-project-id`/`data-active` on Electron sidebar rows; Components Lab menu navigation and product-surface isolation in `__root.tsx`; comparison launches use `SYNARA_DESKTOP_SMOKE_USER_DATA` + the source-build marker (upstream removed `SYNARA_DESKTOP_USER_DATA_DIR`, so the old variable would have opened the real profile). |
| Tokens         | `tokens.css` rebuilt from upstream's current `:root` block plus the fork-only tokens (disabled opacity, focus roles, browser home palette, typography roles); `index.css` imports it again. Lynx palette gained the project colors (Tailwind v4 values in sRGB) and the restated `--secondary` family moved to 3%.                                     |
| Shared logic   | Sidebar sort catalog, file-preview breadcrumb and mode, file-preview error state with Retry/Close and the empty-file state, provider update batching (`runProviderUpdateBatch`), Kilo favorite migration (invalid legacy data is kept for a retry, as upstream specifies).                                                                             |
| Electron fixes | Decision cards scroll in short windows (approval and question cards); choice rows wrap in narrow composers; partial-read disclosure stays visible at every header width.                                                                                                                                                                               |

## Deliberate differences from a straight merge

- **UI font tokens.** Upstream moved UI text to the settings-driven `text-ui*` tokens and fails
  `uiFontSize.test.ts` above 23 fixed sizes. Fork-only compositions were migrated with the same
  mapping upstream used on its own files (`text-xs`→`text-ui`, `[11px]`→`ui-sm`, `[10px]`→`ui-xs`,
  `[13px]`→`ui-lg`). Lynx adapters keep their own CSS, so the Lynx side of the +1px default
  (13px) still needs the visual calibration pass.
- **`no-restricted-globals` scope.** Upstream code uses `window`/`document` directly in about
  700 places. Rewriting all of them would fork 106 upstream files and make every sync conflict
  on them, so the rule is now enforced where it protects Lynx. The 20 files the Lynx graph
  reaches were moved behind `~/platform` (79 sites; `env.lynx.ts` gained the matching stubs).
  Electron-only modules are listed in `.oxlintrc.json`, and a module leaves that list when it
  becomes Lynx-reachable.
- **Root `@types/react`.** Lynx pins React 18 types. The root devDependency makes bun hoist the
  React 19 copy as the fallback, so `next` (marketing) sees one React. A tsconfig `paths` pin
  was tried and rejected because Vite, Vitest and Next resolve `paths` at runtime.

## Retired until ported

Components Lab stories whose production components changed upstream are skipped with a reason
in `ComponentsLabStoryRenderer.test.ts`: automation edit dialog (now inline editing), thread
error banner (removed), model picker (now tabbed), Add Action saving, context meter, command
palette (restyled), right-dock tab strip (redesigned), Space project picker (new props) and the
PDF toolbar zoom menu. Each one is restored with that feature's Lynx port.

## Verification (before the merge commit)

- `bun typecheck`: 7/7 packages pass. The ad-hoc Lynx program typecheck adds no merge errors
  against the pre-merge baseline. After the root React 19 hoist it shows 13 more type-only
  errors from React 19's JSX types in dependencies; Lynx has no typecheck task, and the bundle
  build and tests are unaffected.
- `bun lint`: 5 errors, all pre-existing JSX-in-`.ts` parse errors in Lynx tests. The pre-merge
  tree has these 5 plus 2 more.
- Web vitest 4316 passed / 13 skipped; contracts 172, shared 955, desktop 1349, scripts 311
  (four failed under full-suite load: three were 5 s timeouts that pass in isolation, and
  `cua-benchmark` archives `HEAD`, which predates the merge commit).
- Lynx: `rspeedy build --environment lynx` succeeds. rstest has 40 failures, all in the
  41-failure pre-merge baseline (known `.rstest-temp` chunk loading and evidence scripts).

## End-to-end findings after the merge commit

Every static gate and suite was green, and the comparison harness still found four defects that
would have shipped:

1. **Protocol revision.** Upstream moved the WebSocket protocol to revision 2 (name-only PR commit
   authors), and the Lynx desktop and web hosts hard-coded revision 1. Both now read
   `WS_PROTOCOL_*` from contracts. The `.mjs` scripts keep a copy pinned by a test.
2. **First-run surfaces.** Upstream's Safari-access intro and project-import announcement opened
   over the compared screen. The harness answers them the way a user would.
3. **Exclusive database lock.** The server keeps `state.sqlite` under `locking_mode = EXCLUSIVE`,
   so certification now reads entities through `orchestration.getSnapshot`.
4. **Toolchain drift.** Regenerating `bun.lock` moved the Lynx build to rspack 2.1.10 and newer
   lynx-ui/debug-metadata plugins. Native Lynxtron then loaded a blank page (the main-thread
   script never ran). A template bisection isolated the fault: the pre-merge template rendered
   in the merged host, and the merged main thread failed. Versions were restored, and
   `projectAppearance` now feature-detects `Intl`, which PrimJS lacks.

`compare:desktop` certifies the fixture thread on both renderers with background launches:
Claude stayed frontmost for the whole run.

## Known gaps

- Lynx `--color-red-500` is Tailwind v3 `#ef4444`, but Electron renders v4 `#fb2c36`. This
  predates the merge; fix it in the visual calibration pass together with the other v3 values
  in `lynx-overrides.css`.
- `ComposerPendingApprovalPanel` in upstream inlines its approval actions, including the new
  Computer/Device scopes. Lynx still reads `ComposerPendingApprovalPanel.logic.ts`. Move
  upstream's scope-aware actions into the logic module when porting Computer use.
- `server.removeKeybinding` is implemented in `apps/server/src/keybindings.ts`; the main
  checkout's uncommitted work has an overlapping change.

## Port queue (one commit per feature)

1. Tabbed model picker and the ⌘P palette restyle (restore the model-picker and palette stories).
2. Transcript selection toolbar (Add to Chat / Side / New chat).
3. Project name, emoji and icon editing (`projectAppearance`, project palette).
4. Oh My Pi and Devin providers in Lynx (icons, provider tools); review-count sidebar badge.
5. Settings regrouping and the Computer section (Electron-only for now).
6. Inline automation editing and the automations list redesign; Kanban card PR lookup.
7. Right dock tab redesign, rail sidebar layout, Cmd+Option+S side chat, project favicons.
