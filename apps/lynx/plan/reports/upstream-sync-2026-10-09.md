# Upstream sync, 2026-10-09: `upstream/main` 6f54f53c6 into the Lynxtron port

Branch `huxcc/shared-state-arch`. Merge commit `d72066d8c` (`git merge --no-ff upstream/main`),
followed by `07f99aa34` (comparison harness) and `c3fbd4f18` (fork web tests). Nothing is pushed.

## What merged

567 upstream commits, `529ad049c..6f54f53c6`: 1726 files, +250,036 / -40,550. The parts that
matter to the port:

| Upstream change                                                                      | Effect on the fork                                                                                |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| App shell: icon rail, sidebar surfaces per destination, open-thread tabs             | Electron-only. Native keeps the previous shell; every comparison cell now differs (port queue 1). |
| Provider accounts and instances (`driver`, `instanceId`, per-account model options)  | Contracts and shared logic arrive; Lynx uses each provider's default instance only.               |
| Groups/Hubs replace Studio; project kind `group`                                     | Lynx treats `group` projects as not listed.                                                       |
| GitHub inbox replaces `pullRequests.list`; WS protocol revision 3                    | Lynx reads pull requests through `githubInbox.list`; host negotiates from the contract constants. |
| Kanban v2 (Attention board, `awaitingYou`, `hiddenCount`)                            | Lynx keeps the status board.                                                                      |
| Terminal groups and splits removed                                                   | Removed from Lynx too (flat tabs).                                                                |
| `server.editKeybindings` replaces the fork's `server.removeKeybinding`               | Lynx removes a command's bindings with a `reset` edit.                                            |
| Default theme pack is Synara (was Codex)                                             | Arrived on Lynx through the shared theme seed.                                                    |
| Tasks, project agents, keep-awake, turn dispatch settlement, stream overflow retries | Transport members exist on Lynx; no Lynx UI for tasks or project agents.                          |

## Policy applied

1. Upstream wins in upstream-owned files. A fork hook was re-applied only where Lynx still needs
   it, in its smallest form. Where upstream restructured a file the fork had split, upstream's
   structure is kept.
2. `AGENTS.md` is upstream's text with the fork's Lynx and model sections appended; `CLAUDE.md`
   is upstream's. The commands it names exist and pass: `fmt:check`, `windows-runtime:check`,
   `migrations:check`, `brand:check`, `server-sync-fs:check` (inside `lint`).
3. CI uses upstream's workflow unchanged (`.github/workflows/ci.yml` has no fork diff; its
   contract test forbids `continue-on-error`). The six web unit failures of #28 no longer occur:
   the web suite passes. #10 (Lynx Rstest baseline) is unchanged.
4. Upstream features Lynx does not have are not ported; they are absent on Lynx and listed in the
   port queue.
5. `bun.lock` was resolved from the fork's lock. `bun install --frozen-lockfile` passes and the
   Lynx toolchain is unchanged (ReactLynx 0.126.2, rspeedy 0.18, Lynxtron 0.0.28, pinned rspack).

Fork hooks dropped because upstream's file was taken whole: the Lynx-facing hooks in
`wsTransport.ts` (replaced on Lynx anyway), `ChatView.tsx`, `PluginLibrary.tsx` (provider
discovery error state), `Sidebar.logic.ts`, `MessageTrail.tsx`, `ProviderHealthBanner.tsx`,
`chatHeaderControls.tsx`, the pull-request state glyph and timeline files, `modelFavorites.ts`,
`starredModels.ts`, `rightDockStore.logic.ts`, `editorViewState.ts`, `EditorWorkspaceView.tsx`,
`DockExplorerPane.tsx`, `SingleChatSurface.tsx`, the voice and terminal controllers, and
`ui/{checkbox,input,input-group,textarea}.tsx`. The Components Lab conditional in
`__root.tsx` is gone too (see the review findings): only the menu navigation remains there.

## Fork footprint

270 upstream-owned files carry a fork diff; 311 did before the merge. The merge itself left 276
(38 returned to upstream's content, 3 new: `threadVisitedPersistence.ts`,
`useCommittedPathname.test.ts`, `server-sync-fs-budget.json`). After it, `ci.yml`,
`ProviderCommandReactor.test.ts`, `OpenCodeAdapter.ts` and `outboundHttp.ts` returned to
upstream's content and `git/Layers/GitCore.ts` gained a three-line diff. The browser-test
fixes then returned `nativeApi.ts`, `env.ts` and `lib/chatProjects.test.ts` (273 to 270).

| Area                 | Files |
| -------------------- | ----: |
| `apps/web`           |   205 |
| `apps/server`        |    21 |
| `packages/shared`    |    13 |
| `apps/desktop`       |    13 |
| `packages/contracts` |     9 |
| Root                 |     9 |

The full list with a reason per file is in the appendix. Reasons for `apps/web` rows are derived
from the content of each diff by rule (which seam the added lines use), not reviewed one by one.

Known duplication left in place: `packages/shared/src/rightDock.ts` mirrors upstream's
`apps/web/src/rightDockStore.logic.ts`. Lynx imports the shared copy (12 files) because it also
holds the dock constants and types; the upstream delta was merged into it by hand.

## Generator, transport and shims

| Piece                                    | What this merge needed                                                                                                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| EventRouter generator                    | No change. Regenerated from the new `__root.tsx` (24 declarations); `--check` passes.                                                                                                                                                                              |
| Router shim (`reactRouter.lynx.ts`)      | `useRouter` (one stable identity) and `isLoading: false`, for upstream's new `useCommittedPathname`.                                                                                                                                                               |
| Compat transport (`wsTransport.lynx.ts`) | Turn dispatch settlement after a lost socket, stream overflow retries (8, upstream's schedule), `onShellStreamFailure`, project-agent event streams, task and keep-awake channels. Tested. Not implemented: the server-busy heartbeat and recoverable Git actions. |
| NativeApi facade                         | No override change. New namespaces (`githubInbox`, `projectAgent`, `todo`) pass the "no browser globals" sweep.                                                                                                                                                    |
| Resource replacements and aliases        | One alias added: `~/lib/icons` → `adapters/webIcons.lynx.ts` (upstream inlined its icon set).                                                                                                                                                                      |
| `sidebarSnapshot.logic.ts`               | No change.                                                                                                                                                                                                                                                         |
| Utility CSS generator                    | Reads `--text-*` from upstream's `@theme` so `text-ui`, `text-ui-sm`, `text-chat-meta` and the rest are generated; a `color-mix()` over the runtime `--account-accent` variable is registered as unsupported.                                                      |
| Lynx tsconfig                            | `noUncheckedIndexedAccess` enabled to match the web program (upstream's `appSettings.ts` relies on it); 28 sites fixed.                                                                                                                                            |

Stubs and reductions on Lynx: handoff targets and the model picker use each provider's default
instance; starred models are read from the local preset list; `group` projects are skipped in the
sidebar; the dock terminal has no groups or splits (removed upstream).

## Verification

| Check                                                              | Result                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conflict markers                                                   | none                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `bun install --frozen-lockfile`                                    | pass                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `bun run brand:check`, `windows-runtime:check`, `migrations:check` | pass                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `bun typecheck`                                                    | 8 of 8 packages pass                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `bun lint`                                                         | 0 errors (1234 warnings), sync-fs budget passes                                                                                                                                                                                                                                                                                                                                                                                             |
| `bun fmt --check`                                                  | pass                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Lynx build (`bun run build` in `apps/lynx`)                        | pass                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Lynx Rstest                                                        | 364 files, 1398 tests: 1375 pass, 23 fail in 26 files. The failing set is identical to the set before the merge (issue #10).                                                                                                                                                                                                                                                                                                                |
| Lynx script tests                                                  | 139 tests: 136 pass, 3 fail (retained screenshot evidence absent from this checkout; same before the merge)                                                                                                                                                                                                                                                                                                                                 |
| `audit:reuse:check`                                                | pass. Ratchet unchanged: `synaraClientImporters` 39, `useQuery` 66, `refetchInterval` 8, `router.tsx` 3701 lines                                                                                                                                                                                                                                                                                                                            |
| `audit:style:check`                                                | pass after re-recording the baseline (see below)                                                                                                                                                                                                                                                                                                                                                                                            |
| `lynx:css-report --check`                                          | pass (29 findings, all in baseline)                                                                                                                                                                                                                                                                                                                                                                                                         |
| Web unit suite                                                     | 527 files (4 skipped), 5322 tests: 5297 pass, 7 fail before `c3fbd4f18`; the 7 were fork source-pin tests, fixed or removed in that commit and re-run green                                                                                                                                                                                                                                                                                 |
| contracts / shared / desktop                                       | 195 / 1151 / 1406 tests pass                                                                                                                                                                                                                                                                                                                                                                                                                |
| scripts                                                            | 330 tests: 326 pass; 3 of the 4 failures pass when run alone, 1 times out at 5 s copying the app bundle (machine under load)                                                                                                                                                                                                                                                                                                                |
| Server suite                                                       | Not completed. With the suite's own single-worker setting and a load average of 16 to 31 on this machine, two files took 25 minutes (`CheckpointReactor`: 17 of 85 failed, `GitCore`: 5 of 129 failed), so the run was stopped. Those failures were timeouts, a timing assertion, and assertions on git output that this machine colours; neither file has a fork diff. The seven test files next to merged server changes pass: 726 tests. |

Reuse gate percentages fell because upstream's module graph grew, not because Lynx shares less:

| Screen                  | Before |  After |
| ----------------------- | -----: | -----: |
| Threads                 | 58.64% | 54.47% |
| Threads shell + Sidebar | 68.01% |  61.4% |
| Thread                  | 40.54% | 36.28% |
| Settings                | 53.48% | 50.61% |
| Kanban                  | 54.26% | 51.11% |
| Pull Requests           | 60.73% | 37.36% |

Style ratchet: the committed utility CSS had not been regenerated against the merged sources, so
`text-ui*` (1,049 uses upstream introduced) had no rule on Lynx. After the generator fix coverage
is 98.05% (98.07% before the merge). The baseline was re-recorded: uncovered weight 258 → 392,
unsupported weight 929 → 1291, both from utilities in upstream UI that Lynx does not render.

## Comparison harness

One launch, dark, 1280×820, both renderers certified, Native rendered the fixture transcript.
Launcher stopped with SIGINT, "Cleanup verified".

Workflows:

| Workflow                                           | Electron   | Native     | Class                              |
| -------------------------------------------------- | ---------- | ---------- | ---------------------------------- |
| J1 new thread, send, model picker, `@` mention     | pass       | pass       |                                    |
| J1 Stop a streaming turn                           | fail       | fail       | (d) server: same on both renderers |
| J3 Explorer, preview, Diff, reload, Retry          | pass (6/6) | pass (6/6) |                                    |
| J4 Settings, appearance, persistence, cross-client | pass (6/6) | pass (6/6) |                                    |
| J5 Automations                                     | pass (4/4) | pass (4/4) |                                    |
| J6 Kanban, task turn, reconnect, PR empty state    | pass (5/5) | pass (5/5) |                                    |

J1 Stop: both renderers dispatch `thread.turn.interrupt`; the server logs
`turn/interrupt requested` and `turn/interrupt acknowledged` about 30 ms apart, and the turn then
settles about 14 s later at `provider.runtime_reconciliation.started` (Native 13.9 s, Electron
14.1 s after Stop). It is the Codex provider path on the server, present before this merge.

Cells and increments (all reach both renderers and measure; none pass):

| Cell                                                               | Result                                                  | Class                                                                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| landing, thread, settings, kanban, pr, automations                 | 3 of 7 to 29 controls within 2 px                       | (b) upstream's app shell is not ported: a 52 px rail, sidebar surfaces and thread tabs shift or replace every control but the three titlebar ones |
| landing-diff-dock, add-panel-menu, settings-appearance, model-menu | 3 of 9 to 42 controls                                   | (b) same shell offset                                                                                                                             |
| automation-dialog, automation-model-menu                           | 0/6, popup offset identical to the run before the merge | (d) pre-existing                                                                                                                                  |
| kanban-new-task                                                    | 5/6                                                     | (d) pre-existing                                                                                                                                  |

Probes that were stale and are fixed (class (a)): protocol revision, the feature tour sheet,
rail navigation, Settings without "Back to app", Kanban under Tasks, "Code review", the dock
launcher, shadow-root file previews, automation rows, Kanban cards, the Appearance marker,
"Toggle right sidebar", "Chat behavior". No defect introduced by the merge (class (c)) showed up
in a workflow. One was found outside the harness and fixed: the missing `text-ui*` rules above.

## Independent review and follow-up fixes

A read-only review of the merge confirmed seven issues. All are fixed in separate commits after
the merge; each was checked against the code first, and none turned out to be wrong.

|    # | Finding                                                                                                                                                                                                                  | Fix                                                                                                                                                                                                                                                             | Commit      |
| ---: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
|    1 | The fork's first-event watchdog in `ProviderCommandReactor.ts` read the post-persistence event stream, so an ingestion delay looked like provider silence, and its stop was not tied to the inspected turn or generation | Removed, with its tests. The file is upstream's except a four-line deleted-thread guard from 6fe249adf, which no test in the upstream test file covers                                                                                                          | `d363e35a8` |
|    2 | Lynx created the shared stores before the storage mirror was hydrated; the first shell snapshot then persisted blank project names, appearance, expansion and order over the saved ones                                  | `app/persistedStoreHydration.lynx.ts`: after `hydrateStorage()` and before SessionSync, reload the project preferences through `storePersistence.readPersistedState` and rehydrate every eagerly created zustand persist store. A test reproduces the overwrite | `208d7b10f` |
|    3 | A starred preset saved for a non-default provider account was selectable on Lynx and ran in the default account                                                                                                          | `selectableStarredModels` leaves such presets out of the picker; storage is untouched                                                                                                                                                                           | `b24091d48` |
|    4 | `git.statusLocal` passed `{ refreshRemote: false }` but upstream's `statusDetails` ignored it and still scheduled a fetch                                                                                                | `git/Layers/GitCore.ts` passes the option through (three lines). A test counts real `git fetch` invocations                                                                                                                                                     | `a22eb574b` |
|    5 | The compat transport ran Git actions as one-shot streams: no recovery after a lost socket, and a failure after `action_finished` was reported as an error                                                                | Upstream's negotiated loop: `recoverable` only when the server advertises `git.action-recovery`, reattach by action id with `resume`, never re-run; a received final result is returned                                                                         | `6e7267d2a` |
| 6, 7 | The Components Lab conditional in `__root.tsx` unmounted the session-sync engine and notification services on Electron, making upstream's unguarded continuations reachable and stranding the provider-update toast      | The conditional is removed. The hook is the menu navigation only (one component, one JSX line, one import); the Lab renders under the same services as every route                                                                                              | `ef548b487` |
|    8 | Fork diffs with no remaining purpose                                                                                                                                                                                     | Dropped: OpenCodeAdapter's `time.created`, unused Keybinding imports in contracts, outboundHttp import order, and the sidebar icon button ink in `index.css` (no Lynx code reads that rule, so parity does not need the fork value)                             | `fff3705e4` |

Persisted stores audited for finding 2:

| Store                                                                                               | Start on Lynx before the fix                                  | Now                                          |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| `store.ts` project preferences (`storePersistence`)                                                 | blank, then overwritten                                       | reloaded at the boundary                     |
| `recentViewsStore`, `rightDockStore`, `splitViewStore`, `latestProjectStore`, `workspacePathsStore` | defaults; next write replaced the saved state                 | rehydrated at the boundary                   |
| `terminalStateStore`, `pinnedThreadsStore`, `pinnedProjectsStore`, `projectInstructionsStore`       | rehydrated later by App, the sidebar or the Environment panel | also rehydrated at the boundary (idempotent) |
| `composerDraftStore`                                                                                | Lynx adapter with its own hydration                           | unchanged                                    |
| `spacesUiStore`                                                                                     | session storage, empty at launch by definition                | unchanged                                    |
| `threadVisitedPersistence`, `Sidebar.uiState`, `appSettings`                                        | read on first use, after hydration                            | unchanged                                    |

Not covered: when storage hydration fails and the user retries from Settings, the stores are not
reloaded, because by then they hold live state that a reload would replace.

Verification after these fixes: `bun typecheck`, `bun lint`, `bun fmt --check`, `brand:check`,
the CI contract tests (14 pass), Lynx typecheck, build, `audit:reuse:check` and
`audit:style:check` pass. Lynx Rstest: 366 files, 1405 tests, the same 23 failures in 26 files.
`ProviderCommandReactor.test.ts` passes on upstream's content. One harness session, dark
1280×820: J3 to J6 pass on both renderers, J1 passes on both except Stop, which is unchanged
(Native 15.5 s, Electron 14.8 s after Stop; issue #35). Components Lab was opened and left once
on Electron by route; the app returned to its thread with the sidebar intact. The harness log
records only the Native host's subscriptions, so the absence of a duplicate Electron shell
subscription was not observed directly; it follows from the engine no longer unmounting.

## Browser lanes on PR #34

Upstream's six browser lanes failed on the fork (41 ChatView tests; the three `components`
shards failed or ran into the 20-minute limit). The same lanes pass on upstream. Each cause was
found by restoring fork-diffed files to upstream's content and re-running a failing test.

| Cause                                                                                                                                                                                                                                                    | Tests it broke                                                                                                                                                                                        | What was done                                                                                                                                                        | Commit      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `nativeApi.ts` no longer read `window.nativeApi`; the fork had replaced it with a `setNativeApiForTest` override. Upstream's browser tests install their API fixtures on `window.nativeApi`, so the fixtures were ignored and the real WebSocket API ran | 40 ChatView tests (all of chat-projects and chat-workflows), and in `components`: GeneratedMarkdownImage, WorkspaceSearchPalette, WorkspaceFilePreview relocation, plus the hangs behind the timeouts | `nativeApi.ts`, `env.ts` and `lib/chatProjects.test.ts` restored to upstream. Lynx substitutes its own `nativeApi` adapter and did not depend on the override        | `d6b23566b` |
| `ChatMarkdown.tsx` deferred streamed text with a 100 ms debounce instead of `useDeferredValue`. Under a steady stream the debounce keeps resetting, so the text and its height arrive late                                                               | chat-follow: "restores streaming follow after send in the full ChatView"                                                                                                                              | `useDeferredValue` restored. Lynx renders its own ChatMarkdown                                                                                                       | `4e12f30d4` |
| `ui/toast.tsx` made the toast root and surface `pointer-events-none`                                                                                                                                                                                     | toast: "hides toasts behind the front one so wider ones do not peek out"                                                                                                                              | Upstream's class names restored; the fork's source-reading test `toast.pointer-events.test.ts` removed                                                               | `021a63206` |
| `useLocalStorage.ts` compared `StorageEvent.storageArea` with the `webStorage` wrapper by identity, which never matches `localStorage`. Writes from another window were ignored in the product, not only in the test                                     | FeatureTourDialog: "closes an automatic tour when another window acknowledges this installation"                                                                                                      | Seam kept (Lynx loads this hook) and re-seated: the storage port answers `isWebStorageArea`, which on web compares with the real `localStorage` and on Lynx is false | `e33653b26` |
| Fork-only test `MessageRowComposition.browser.tsx` assumed the pointer was not over the row; in upstream's shard order an earlier file leaves it there                                                                                                   | the test itself                                                                                                                                                                                       | The test parks the pointer first. No product change                                                                                                                  | `fe90125cf` |

Results on this machine (macOS, headless Chromium 1234), one lane per process as in CI:

| Lane           | Before          | After                 |
| -------------- | --------------- | --------------------- |
| chat-follow    | 1 failed        | 28 passed             |
| chat-projects  | 15 failed       | 47 passed             |
| chat-workflows | 25 failed       | 128 passed            |
| components 1/3 | timed out on CI | 342 passed, 1 failed  |
| components 2/3 | timed out on CI | 321 passed, 1 skipped |
| components 3/3 | 16 failed       | 335 passed            |

Still failing: `src/hooks/useCommittedPathname.browser.tsx` "renders a shell subscriber once per
navigation with matching pathname and params". It fails with every upstream-owned source file
restored to upstream's content, so no source diff causes it. The fork's lockfile resolves
`@tanstack/react-router` 1.170.40 and `router-core` 1.171.33 where upstream locks 1.167.3,
because `apps/lynx/package.json` asks for `^1.170.18`; the newer router renders the shell twice
per navigation. Lynx resolves `@tanstack/react-router` to its own shim at build time, so it
probably does not need the newer range. Aligning it needs a lockfile regenerated with bun 1.4.2
and is not done here. The same drift is why `useCommittedPathname.test.ts` is skipped, and it is
wider than the router: 97 packages present in both lockfiles resolve to a different version
(among them `@tanstack/react-query` 5.104.0 against 5.90.21, `shiki` 4.4.3 against 4.0.2/3.23.0,
`motion-dom`, `sharp`, `diff`).

Not changed: `useId` is still replaced by a counter-based `useUniqueId` in `Icons.tsx`,
`AntigravityIcon.tsx` and `ThemePackEditorCompositionElements.tsx`, so those element ids differ
from upstream's. No browser test depends on them.

## Port queue

Ordered by what a user of the Native app notices first. Size: S under a day, M a few days, L a
week or more.

|   # | Feature                                                                                                                                                                                                                                                                                                                                                                                                                  | Upstream files                                                                                                                      | Size   |
| --: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------ |
|   1 | App shell: icon rail, sidebar surfaces, usage buttons on the rail, Home — **ported** (rail, panel column, usage rings, Automations panel; the Spaces panel, rail shortcuts and Customize are stubs)                                                                                                                                                                                                                      | `components/Sidebar.tsx`, `AppRailMoreMenu.tsx`, `SidebarPrimarySurfaceNavigation.tsx`, `AppShellTopStrip.tsx`                      | L      |
|   2 | Open-thread tabs in the header — **ported** (no drag reorder, tab context menu or tab shortcuts yet)                                                                                                                                                                                                                                                                                                                     | `openThreadTabsStore.ts`, `components/chat/OpenThreadTabStrip.tsx`                                                                  | M      |
|   3 | Provider accounts: per-account model picker, handoff targets, starred presets, updates — **picker layout ported** (every provider's tab, Add providers, dialog provider menu; several accounts per provider are not; the in-thread handoff is: a started thread's picker lists the other providers' models and sending hands the thread off in place, workflow J7)                                                       | `components/settings/ProvidersSettingsPanel.tsx`, `ProviderAccountMark.tsx`, `chat/ProviderModelPicker.tsx`, `lib/threadHandoff.ts` | L      |
|   4 | Code review: GitHub inbox with issues, filters, side chat — **ported** (list column with Sort/Filter/More, search, kind tabs, chips, Pinned/All sections, issue rows, inline pull request and issue detail on upstream's query options; the Ask side chat dock and Send to agent are shown as unavailable; the detail keeps the previous tabbed layout instead of upstream's info column, stack popover and auto-fix CI) |
|   5 | Kanban v2: Attention board, awaiting-you column, hidden count                                                                                                                                                                                                                                                                                                                                                            | `components/kanban/KanbanOverview.tsx`, `KanbanColumn.tsx`, `useKanbanBoard.ts`                                                     | M      |
|   6 | Tasks surface and its List/Kanban switch                                                                                                                                                                                                                                                                                                                                                                                 | `components/tasks/*`                                                                                                                | M      |
|   7 | Hubs and group projects                                                                                                                                                                                                                                                                                                                                                                                                  | `routes/_chat.hubs.index.tsx`, `components/SidebarGroupsSurface.tsx`, `chat/group/*`                                                | L      |
|   8 | Inbox                                                                                                                                                                                                                                                                                                                                                                                                                    | `components/inbox/InboxView.tsx`                                                                                                    | M      |
|   9 | Keybinding editor per shortcut                                                                                                                                                                                                                                                                                                                                                                                           | `keybindingEditor.ts`, `settings/KeyboardShortcutsSettingsPanel.tsx`, `ShortcutRecorderDialog.tsx`                                  | M      |
|  10 | Appearance: theme pack editor with translucency — **ported** (Theme section, mode picker cards, pack preview, color/font rows, Window material and translucency rows, Contrast; pack edits repaint the app through the root theme variables; window translucency is stored but not rendered by Lynxtron; the code theme select, App icon and Chat width are not rendered)                                                |
|  11 | Thread search on the server (`searchThreads`) in place of the fork's search snapshot                                                                                                                                                                                                                                                                                                                                     | `components/SidebarSearchPalette.tsx`                                                                                               | S      |
|  12 | Project agents and the project panel                                                                                                                                                                                                                                                                                                                                                                                     | `chat/project/ProjectPanel.tsx`, `useProjectAgent.ts`                                                                               | L      |
|  13 | Server-busy indicator and recoverable Git actions                                                                                                                                                                                                                                                                                                                                                                        | `serverBusyState.ts`, `wsTransport.ts`                                                                                              | S      |
|  14 | New thread statuses: Preparing worktree, In Background, Reminder                                                                                                                                                                                                                                                                                                                                                         | `components/Sidebar.logic.ts`                                                                                                       | S      |
|  15 | Editable file preview in the Explorer pane                                                                                                                                                                                                                                                                                                                                                                               | `chat/DockExplorerPane.tsx`, `hooks/useWorkspaceFileEditorSession.ts`                                                               | M      |
|  16 | iOS Simulator and computer panes in the dock launcher — dock header **ported** (content tabs, Maximize panel, add menu, grouped Diff toolbar; Previous/Next change step by file, change markers and tab drag are not)                                                                                                                                                                                                    | `components/chat/RightDock.tsx`                                                                                                     | M      |
|  17 | Feature tour, project import announcement, Help menu, Models & writing tab                                                                                                                                                                                                                                                                                                                                               | `components/FeatureTourDialog.tsx`, `projectImport/*`                                                                               | S each |

Cleanup that came into view: the fork's split `Sidebar*.logic.ts` files and `providerUpdates.ts`
now duplicate upstream logic and could become re-exports; `components/ui/shortcut-kbd.tsx` was
deleted upstream and survives only for the fork's Compositions; `@tanstack/react-router` is at
1.170 in the fork's lock while upstream pins 1.167.3, which is why
`useCommittedPathname.test.ts` is skipped.

## Layer report

`node apps/lynx/scripts/upstream-merge-layer-report.mjs 529ad049c upstream/main`, for
`apps/web/src`: 895 files, 123,852 changed lines.

| Layer                                             | Files |  Lines | Share |
| ------------------------------------------------- | ----: | -----: | ----: |
| Shared with Lynx (arrives with the merge)         |   139 | 13,994 | 11.3% |
| State/session with a parallel Lynx implementation |     7 |  6,904 |  5.6% |
| Reachable from Lynx through its own counterpart   |   395 | 42,766 | 34.5% |
| Platform-exclusive on Lynx                        |    12 |  1,728 |  1.4% |
| Not reachable from Lynx                           |    55 |  7,695 |  6.2% |
| Tests                                             |   287 | 50,765 | 41.0% |

## Compared with the previous sync

Arrived on Lynx with no hand work, through the shared state layer: every new store event and
reducer (the generated EventRouter needed no generator change), the new facade namespaces, the
protocol revision (the host reads the contract constants), the Settings navigation labels and
order, the Synara default theme, the unread-state persistence once it went through
`~/platform`, and the pull-request group labels.

Still hand work: the transport's new members (about 190 lines plus tests, restated from
upstream because the class is replaced, not shared), the router shim, the dock terminal rewrite
after upstream removed groups and splits, pull requests moving to the inbox RPC, and the
provider-instance type changes that reached Lynx's own pickers and handoff code. The view layer
is where the gap grew: upstream redesigned the shell, and none of it is shared.

## Appendix: upstream-owned files with a fork diff

| File                                                                                 | Diff vs upstream | Reason                                                                                                 |
| ------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `.gitignore`                                                                         | +8 / -0          | ignores for Lynx build and comparison output                                                           |
| `.oxfmtrc.json`                                                                      | +3 / -0          | format ignores for Lynx generated files                                                                |
| `.oxlintrc.json`                                                                     | +236 / -2        | no-restricted-globals rule and its exempt lists                                                        |
| `AGENTS.md`                                                                          | +16 / -0         | fork section appended to upstream text                                                                 |
| `TODO.md`                                                                            | +366 / -2        | fork notes                                                                                             |
| `apps/desktop/native/appsnap/WindowCapture.swift`                                    | +7 / -1          | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/scripts/electron-launcher.mjs`                                         | +37 / -13        | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/appSnapManager.test.ts`                                            | +79 / -0         | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/appSnapManager.ts`                                                 | +25 / -0         | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/desktopUserDataProfile.test.ts`                                    | +9 / -0          | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/desktopUserDataProfile.ts`                                         | +7 / -0          | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/desktopWsBridge.test.ts`                                           | +15 / -1         | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/desktopWsBridge.ts`                                                | +7 / -0          | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/main.ts`                                                           | +80 / -36        | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/mediaPermissions.test.ts`                                          | +7 / -0          | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/mediaPermissions.ts`                                               | +4 / -0          | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/syncShellEnvironment.test.ts`                                      | +7 / -1          | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/desktop/src/syncShellEnvironment.ts`                                           | +4 / -0          | comparison harness switches (parallel instance, skipped setup, auth token) and AppSnap capture options |
| `apps/server/package.json`                                                           | +2 / -0          | pdfjs and canvas for the PDF first-page size                                                           |
| `apps/server/src/git/Layers/CodexTextGeneration.ts`                                  | +2 / -1          | resolves the ChatGPT-bundled Codex binary                                                              |
| `apps/server/src/git/Layers/GitStatusBroadcaster.test.ts`                            | +39 / -1         | status details without a remote refresh                                                                |
| `apps/server/src/git/Layers/GitCore.ts`                                              | +3 / -1          | `statusDetails` honors `refreshRemote: false` for `git.statusLocal`                                    |
| `apps/server/src/git/Layers/GitStatusBroadcaster.ts`                                 | +9 / -1          | status details without a remote refresh                                                                |
| `apps/server/src/git/Services/GitCore.ts`                                            | +4 / -1          | status details without a remote refresh                                                                |
| `apps/server/src/http.ts`                                                            | +57 / -0         | local PDF first-page size route                                                                        |
| `apps/server/src/localImageRoute.test.ts`                                            | +64 / -3         | local PDF first-page size route                                                                        |
| `apps/server/src/orchestration/Layers/ProjectionSnapshotQuery.test.ts`               | +97 / -0         | sidebar shell and search snapshot queries Lynx bootstraps from                                         |
| `apps/server/src/orchestration/Layers/ProjectionSnapshotQuery.ts`                    | +161 / -0        | sidebar shell and search snapshot queries Lynx bootstraps from                                         |
| `apps/server/src/orchestration/Layers/ProviderCommandReactor.ts`                     | +4 / -0          | deleted-thread guard before the session write (6fe249adf)                                              |
| `apps/server/src/orchestration/Services/ProjectionSnapshotQuery.ts`                  | +16 / -0         | sidebar shell and search snapshot queries Lynx bootstraps from                                         |
| `apps/server/src/orchestration/startupTurnReconciliation.test.ts`                    | +15 / -0         | skip deleted threads at startup reconciliation                                                         |
| `apps/server/src/orchestration/startupTurnReconciliation.ts`                         | +10 / -5         | skip deleted threads at startup reconciliation                                                         |
| `apps/server/src/orchestration/testing/fakeProjectionSnapshotQuery.ts`               | +2 / -0          | sidebar shell and search snapshot queries Lynx bootstraps from                                         |
| `apps/server/src/provider/Layers/CodexAdapter.test.ts`                               | +80 / -1         | synchronous Codex enqueue and trimmed Codex notices                                                    |
| `apps/server/src/provider/Layers/ProviderService.test.ts`                            | +105 / -0        | runtime event stream survives an unprocessable event; failed turn mapping                              |
| `apps/server/src/provider/Layers/ProviderService.ts`                                 | +6 / -2          | runtime event stream survives an unprocessable event; failed turn mapping                              |
| `apps/server/src/threadRetention.test.ts`                                            | +9 / -0          | switch that keeps the comparison fixture from being pruned                                             |
| `apps/server/src/threadRetention.ts`                                                 | +6 / -0          | switch that keeps the comparison fixture from being pruned                                             |
| `apps/server/src/wsRpc.ts`                                                           | +26 / -0         | RPC handlers for the sidebar snapshots and local PDF inspection                                        |
| `apps/web/package.json`                                                              | +1 / -0          | `diff` dependency for the shared diff logic                                                            |
| `apps/web/src/appNavigation.test.ts`                                                 | +12 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/appNavigation.ts`                                                      | +11 / -2         | ~/platform seam                                                                                        |
| `apps/web/src/appSettings.ts`                                                        | +39 / -51        | ~/platform seam; Composition/Elements seam; shared .logic / @synara/shared extraction                  |
| `apps/web/src/appSnap.logic.ts`                                                      | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/betaFeatures.ts`                                                       | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/branding.ts`                                                           | +3 / -3          | ~/platform seam                                                                                        |
| `apps/web/src/browserStateStore.ts`                                                  | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/components/AntigravityIcon.tsx`                                        | +3 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/AppSnapWelcomeDialog.tsx`                                   | +8 / -11         | ~/platform seam; shared .logic / @synara/shared extraction                                             |
| `apps/web/src/components/BrowserPanel.tsx`                                           | +36 / -34        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/ChatMarkdown.tsx`                                           | +7 / -30         | ~/platform seam; inline file-path helper shared with Lynx                                              |
| `apps/web/src/components/ChatView.logic.test.ts`                                     | +62 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/components/ChatView.logic.ts`                                          | +27 / -88        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/DiffPanel.tsx`                                              | +7 / -6          | ~/platform seam                                                                                        |
| `apps/web/src/components/DiffWorkerPoolProvider.tsx`                                 | +3 / -3          | ~/platform seam                                                                                        |
| `apps/web/src/components/FeedbackDialog.tsx`                                         | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/GitActionsControl.logic.ts`                                 | +13 / -0         | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/Icons.tsx`                                                  | +5 / -6          | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/KeybindingsToast.browser.tsx`                               | +2 / -1          | test follows a fork seam; ~/platform seam                                                              |
| `apps/web/src/components/PullRequestThreadDialog.tsx`                                | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/RenameDialog.tsx`                                           | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/RestoreOrCreateChatRoute.tsx`                               | +37 / -140       | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/ReviewFileTreePanel.tsx`                                    | +45 / -31        | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/ShortcutsDialog.tsx`                                        | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/Sidebar.logic.test.ts`                                      | +2 / -1          | test follows a fork seam                                                                               |
| `apps/web/src/components/Sidebar.tsx`                                                | +6 / -0          | harness/data id                                                                                        |
| `apps/web/src/components/Sidebar.uiState.ts`                                         | +19 / -18        | ~/platform seam; shared .logic / @synara/shared extraction                                             |
| `apps/web/src/components/SidebarSearchPalette.logic.test.ts`                         | +21 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/components/SidebarSearchPalette.logic.ts`                              | +18 / -13        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/SidebarSearchPalette.tsx`                                   | +17 / -4         | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/SpaceIcon.tsx`                                              | +3 / -34         | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/TerminalScrollToBottom.tsx`                                 | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/TerminalSearch.tsx`                                         | +17 / -9         | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/ThreadPinToggleButton.tsx`                                  | +3 / -3          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/ThreadWorktreeHandoffDialog.tsx`                            | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/WorkspaceFilePreview.tsx`                                   | +15 / -12        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/chat/ChatEmptyStateHero.tsx`                                | +16 / -9         | Composition/Elements seam                                                                              |
| `apps/web/src/components/chat/ChatTranscriptPane.browser.tsx`                        | +3 / -2          | test follows a fork seam; ~/platform seam                                                              |
| `apps/web/src/components/chat/ComposerChoiceRow.tsx`                                 | +3 / -3          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/ComposerColumnFrame.tsx`                               | +3 / -5          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/ComposerPendingApprovalPanel.tsx`                      | +9 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/DockFilePane.tsx`                                      | +2 / -0          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/FileAttachmentChip.tsx`                                | +1 / -68         | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/chat/FileDiffView.tsx`                                      | +1 / -1          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/FileEntryIcon.tsx`                                     | +6 / -38         | logic moved to a shared or .logic module, re-exported here                                             |
| `apps/web/src/components/chat/MessagesTimeline.logic.ts`                             | +28 / -2         | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/chat/MessagesTimeline.messageEnter.browser.tsx`             | +1 / -1          | test follows a fork seam                                                                               |
| `apps/web/src/components/chat/PanelStateMessage.tsx`                                 | +13 / -13        | Composition/Elements seam                                                                              |
| `apps/web/src/components/chat/PickerPanelShell.tsx`                                  | +81 / -59        | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/chat/PickerTriggerButton.tsx`                               | +56 / -53        | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/chat/ProposedPlanActions.tsx`                               | +8 / -7          | ~/platform seam                                                                                        |
| `apps/web/src/components/chat/ProviderModelPicker.tsx`                               | +4 / -4          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/TraitsPicker.browser.tsx`                              | +3 / -2          | test follows a fork seam; ~/platform seam                                                              |
| `apps/web/src/components/chat/UserInputQuestionForm.tsx`                             | +9 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/WorkspaceFilePreviewHeader.tsx`                        | +18 / -32        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/chat/chatTypography.ts`                                     | +1 / -1          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/composerPickerStyles.ts`                               | +7 / -1          | token shared with Lynx                                                                                 |
| `apps/web/src/components/chat/environment/EnvironmentEditableChecklistRow.tsx`       | +3 / -3          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/environment/EnvironmentNotesSection.browser.tsx`       | +1 / -1          | test follows a fork seam                                                                               |
| `apps/web/src/components/chat/environment/EnvironmentPinnedSection.browser.tsx`      | +1 / -1          | test follows a fork seam                                                                               |
| `apps/web/src/components/chat/environment/EnvironmentProjectInstructionsSection.tsx` | +5 / -5          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/environment/useThreadNotesAutosave.ts`                 | +4 / -4          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/chat/explorerListNavigation.ts`                             | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/components/chat/messageTrail.logic.test.ts`                            | +35 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/components/chat/messageTrail.logic.ts`                                 | +56 / -3         | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/chat/rightDockPaneMeta.tsx`                                 | +9 / -54         | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/chat/useCodeSelectionAction.ts`                             | +13 / -10        | ~/platform seam                                                                                        |
| `apps/web/src/components/chat/useComposerVoiceController.test.ts`                    | +16 / -1         | test follows a fork seam                                                                               |
| `apps/web/src/components/chat/workspaceExplorer.tsx`                                 | +1 / -1          | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/composerFooterLayout.test.ts`                               | +12 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/components/composerFooterLayout.ts`                                    | +4 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/composerInlineChip.ts`                                      | +7 / -41         | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/kanban/KanbanNewTaskDialog.tsx`                             | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/kanban/useKanbanBoard.ts`                                   | +2 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/kanban/useKanbanTaskComposerEditor.ts`                      | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/profile/ShareDialog.tsx`                                    | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/profile/shareCardExport.ts`                                 | +5 / -3          | ~/platform seam                                                                                        |
| `apps/web/src/components/pullRequest/PullRequestsUnavailableState.tsx`               | +7 / -8          | ~/platform seam                                                                                        |
| `apps/web/src/components/pullRequest/pullRequestDetail.logic.ts`                     | +51 / -1         | exports added for Lynx reuse                                                                           |
| `apps/web/src/components/settings/AdvancedSettingsPanel.tsx`                         | +5 / -3          | ~/platform seam                                                                                        |
| `apps/web/src/components/settings/AppSnapShortcutControl.tsx`                        | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/components/settings/ModelsSettingsPanel.test.ts`                       | +1 / -4          | test follows a fork seam; shared .logic / @synara/shared extraction                                    |
| `apps/web/src/components/settings/SettingsPanelPrimitives.tsx`                       | +4 / -92         | logic moved to a shared or .logic module, re-exported here                                             |
| `apps/web/src/components/terminal/terminalFontSettle.ts`                             | +3 / -3          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/terminal/terminalPerformance.ts`                            | +3 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/components/terminal/terminalRuntime.ts`                                | +40 / -37        | ~/platform seam; shared .logic / @synara/shared extraction                                             |
| `apps/web/src/components/terminal/terminalRuntimeAppearance.ts`                      | +14 / -12        | ~/platform seam; shared .logic / @synara/shared extraction                                             |
| `apps/web/src/components/terminal/terminalRuntimeTypes.ts`                           | +3 / -3          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/ui/DisclosureChevron.tsx`                                   | +1 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/components/ui/DisclosureRegion.tsx`                                    | +1 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/components/ui/autocomplete.tsx`                                        | +2 / -2          | token shared with Lynx                                                                                 |
| `apps/web/src/components/ui/badge.tsx`                                               | +1 / -1          | token shared with Lynx                                                                                 |
| `apps/web/src/components/ui/button.tsx`                                              | +1 / -1          | token shared with Lynx                                                                                 |
| `apps/web/src/components/ui/collapsible.tsx`                                         | +1 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/components/ui/combobox.tsx`                                            | +3 / -3          | token shared with Lynx                                                                                 |
| `apps/web/src/components/ui/menuSubmenu.browser.tsx`                                 | +1 / -1          | test follows a fork seam                                                                               |
| `apps/web/src/components/ui/select.tsx`                                              | +2 / -2          | token shared with Lynx                                                                                 |
| `apps/web/src/components/ui/sidebar.tsx`                                             | +16 / -17        | ~/platform seam; shared .logic / @synara/shared extraction                                             |
| `apps/web/src/components/ui/switch.tsx`                                              | +2 / -2          | token shared with Lynx                                                                                 |
| `apps/web/src/components/ui/time-picker.tsx`                                         | +6 / -18         | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/components/ui/toast.tsx`                                               | +38 / -13        | ~/platform seam; ToastSurface export and fixture for the Components Lab                                |
| `apps/web/src/components/ui/toggle.tsx`                                              | +1 / -1          | token shared with Lynx                                                                                 |
| `apps/web/src/components/useGitProgressToastPreview.ts`                              | +2 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/components/useRouteSpaceSync.browser.tsx`                              | +1 / -1          | test follows a fork seam                                                                               |
| `apps/web/src/components/useSpacesController.ts`                                     | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/composerDraftActions.ts`                                               | +9 / -13         | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/composerDraftStore.ts`                                                 | +6 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/confirmedCustomBinaryPathStore.ts`                                     | +6 / -4          | ~/platform seam                                                                                        |
| `apps/web/src/deviceStateStore.ts`                                                   | +4 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/featureFlags.ts`                                                       | +9 / -6          | ~/platform seam                                                                                        |
| `apps/web/src/feedback.ts`                                                           | +17 / -33        | ~/platform seam; shared .logic / @synara/shared extraction                                             |
| `apps/web/src/file-icons.test.ts`                                                    | +16 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/file-icons.ts`                                                         | +80 / -0         | exports added for Lynx reuse                                                                           |
| `apps/web/src/hooks/useAppDensity.ts`                                                | +3 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useAppTypography.ts`                                             | +11 / -38        | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useBrowserPanelDesktopBridge.ts`                                 | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useCommittedPathname.test.ts`                                    | +14 / -10        | test follows a fork seam                                                                               |
| `apps/web/src/hooks/useCopyToClipboard.ts`                                           | +3 / -74         | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useDesktopCustomTitleBar.ts`                                     | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useDesktopTopBarGutter.ts`                                       | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useEditorLaunchers.ts`                                           | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useLocalStorage.ts`                                              | +18 / -27        | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useMediaQuery.ts`                                                | +13 / -19        | ~/platform seam; shared .logic / @synara/shared extraction                                             |
| `apps/web/src/hooks/useOpenFavoriteEditorShortcut.ts`                                | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useRecentViewSwitcher.ts`                                        | +5 / -4          | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useSidebarProjectRunController.test.ts`                          | +8 / -4          | test follows a fork seam                                                                               |
| `apps/web/src/hooks/useSidebarProjectRunController.ts`                               | +8 / -7          | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/hooks/useSidebarThreadActions.ts`                                      | +14 / -25        | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/hooks/useSmoothStreamedText.ts`                                        | +4 / -3          | ~/platform seam                                                                                        |
| `apps/web/src/hooks/useTheme.ts`                                                     | +27 / -15        | ~/platform seam; shared .logic / @synara/shared extraction                                             |
| `apps/web/src/hooks/useThreadRecap.ts`                                               | +2 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/hooks/useThrottledStreamingValue.ts`                                   | +6 / -5          | ~/platform seam                                                                                        |
| `apps/web/src/index.css`                                                             | +12 / -189       | token shared with Lynx                                                                                 |
| `apps/web/src/kanbanUiStore.ts`                                                      | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/keybindings.test.ts`                                                   | +30 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/keybindings.ts`                                                        | +15 / -13        | ~/platform seam                                                                                        |
| `apps/web/src/latestProjectStore.ts`                                                 | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/lib/appTypography.ts`                                                  | +45 / -1         | exports added for Lynx reuse                                                                           |
| `apps/web/src/lib/automationForm.ts`                                                 | +12 / -13        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/lib/browserDownload.ts`                                                | +3 / -13         | ~/platform seam                                                                                        |
| `apps/web/src/lib/chatReferences.ts`                                                 | +2 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/lib/codeFence.ts`                                                      | +9 / -65         | logic moved to a shared or .logic module, re-exported here                                             |
| `apps/web/src/lib/composerDropPaths.ts`                                              | +3 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/lib/composerPastedText.test.ts`                                        | +9 / -0          | test follows a fork seam                                                                               |
| `apps/web/src/lib/composerPastedText.ts`                                             | +5 / -0          | exports added for Lynx reuse                                                                           |
| `apps/web/src/lib/desktopClipboard.ts`                                               | +3 / -9          | ~/platform seam                                                                                        |
| `apps/web/src/lib/desktopZoom.ts`                                                    | +5 / -9          | ~/platform seam                                                                                        |
| `apps/web/src/lib/diffRendering.ts`                                                  | +91 / -6         | exports added for Lynx reuse                                                                           |
| `apps/web/src/lib/domLayout.ts`                                                      | +3 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/lib/fileReferenceContextMenu.ts`                                       | +2 / -4          | ~/platform seam                                                                                        |
| `apps/web/src/lib/gitReactQuery.ts`                                                  | +4 / -0          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/lib/linkChips.ts`                                                      | +3 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/lib/nativeMenuIcons.ts`                                                | +8 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/lib/nativeSurfaceOcclusion.ts`                                         | +4 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/lib/openUsageReactQuery.ts`                                            | +4 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/lib/pdf/pdfZoom.ts`                                                    | +3 / -100        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/lib/pdf/usePdfPageRender.ts`                                           | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/lib/pin.tsx`                                                           | +1 / -4          | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/lib/projectAppearance.ts`                                              | +34 / -4         | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/lib/projectReactQuery.ts`                                              | +11 / -4         | ~/platform seam                                                                                        |
| `apps/web/src/lib/projectShortcutTargets.ts`                                         | +11 / -5         | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/lib/providerDiscovery.test.ts`                                         | +17 / -1         | test follows a fork seam                                                                               |
| `apps/web/src/lib/providerDiscovery.ts`                                              | +9 / -9          | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/lib/relativeTime.ts`                                                   | +2 / -2          | exports added for Lynx reuse                                                                           |
| `apps/web/src/lib/storage.ts`                                                        | +5 / -46         | ~/platform seam                                                                                        |
| `apps/web/src/lib/subagentPresentation.ts`                                           | +8 / -129        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/lib/terminalFocus.ts`                                                  | +3 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/lib/threadRecap.ts`                                                    | +4 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/lib/threadSettle.test.ts`                                              | +35 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/lib/threadSettle.ts`                                                   | +40 / -0         | exports added for Lynx reuse                                                                           |
| `apps/web/src/lib/usagePace.ts`                                                      | +6 / -107        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/lib/utils.ts`                                                          | +5 / -3          | ~/platform seam                                                                                        |
| `apps/web/src/lib/voiceRecorder.ts`                                                  | +6 / -5          | ~/platform seam                                                                                        |
| `apps/web/src/lib/wsHttpUrl.ts`                                                      | +7 / -4          | ~/platform seam                                                                                        |
| `apps/web/src/notifications/taskCompletion.logic.ts`                                 | +18 / -7         | exports added for Lynx reuse                                                                           |
| `apps/web/src/persistedRecord.ts`                                                    | +3 / -38         | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/pinnedMessages.ts`                                                     | +4 / -51         | logic moved to a shared or .logic module, re-exported here                                             |
| `apps/web/src/pinnedProjectsStore.ts`                                                | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/pinnedThreadsStore.ts`                                                 | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/projectInstructionsStore.ts`                                           | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/providerModelOptions.ts`                                               | +15 / -0         | exports added for Lynx reuse                                                                           |
| `apps/web/src/providerUpdates.ts`                                                    | +179 / -0        | exports added for Lynx reuse                                                                           |
| `apps/web/src/recentViews.logic.ts`                                                  | +12 / -3         | exports added for Lynx reuse                                                                           |
| `apps/web/src/recentViewsStore.ts`                                                   | +2 / -4          | ~/platform seam                                                                                        |
| `apps/web/src/rightDockStore.logic.test.ts`                                          | +21 / -0         | test follows a fork seam                                                                               |
| `apps/web/src/rightDockStore.ts`                                                     | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/routeTree.gen.ts`                                                      | +21 / -0         | generated: Components Lab route                                                                        |
| `apps/web/src/routes/__root.tsx`                                                     | +19 / -0         | Components Lab menu navigation only; the patched source of the generated EventRouter                   |
| `apps/web/src/routes/_chat.$threadId.tsx`                                            | +6 / -6          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/session-logic.ts`                                                      | +10 / -35        | shared .logic / @synara/shared extraction                                                              |
| `apps/web/src/spacesUiStore.ts`                                                      | +6 / -4          | ~/platform seam                                                                                        |
| `apps/web/src/splitViewStore.ts`                                                     | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/store.ts`                                                              | +4 / -2          | ~/platform seam                                                                                        |
| `apps/web/src/storePersistence.ts`                                                   | +65 / -4         | ~/platform seam                                                                                        |
| `apps/web/src/terminalStateStore.ts`                                                 | +14 / -1         | ~/platform seam                                                                                        |
| `apps/web/src/theme/theme.logic.ts`                                                  | +155 / -2        | exports added for Lynx reuse                                                                           |
| `apps/web/src/threadVisitedPersistence.ts`                                           | +6 / -4          | ~/platform seam                                                                                        |
| `apps/web/src/workLog.ts`                                                            | +2 / -2          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/workflowRunUiStore.ts`                                                 | +2 / -1          | ~/platform seam                                                                                        |
| `apps/web/src/wsNativeApi.test.ts`                                                   | +1 / -1          | test follows a fork seam                                                                               |
| `apps/web/src/wsNativeApi.ts`                                                        | +2 / -0          | small seam: class constants or values shared with Lynx                                                 |
| `apps/web/src/wsTransportEvents.ts`                                                  | +16 / -18        | ~/platform seam                                                                                        |
| `apps/web/tsconfig.json`                                                             | +1 / -1          | includes the Lynx dev-surface plugin                                                                   |
| `apps/web/vite.config.ts`                                                            | +6 / -0          | Lynx dev-surface plugin                                                                                |
| `bun.lock`                                                                           | +1923 / -223     | Lynx toolchain packages                                                                                |
| `package.json`                                                                       | +18 / -4         | Lynx scripts and workspace entries                                                                     |
| `packages/contracts/package.json`                                                    | +4 / -0          | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/contracts/src/browserAutomationCssSelector.ts`                             | +4 / -3          | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/contracts/src/index.ts`                                                    | +1 / -0          | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/contracts/src/ipc.ts`                                                      | +11 / -0         | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/contracts/src/orchestration.ts`                                            | +69 / -6         | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/contracts/src/project.ts`                                                  | +13 / -0         | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/contracts/src/rpc.ts`                                                      | +38 / -0         | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/contracts/src/ws.test.ts`                                                  | +26 / -0         | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/contracts/src/ws.ts`                                                       | +16 / -1         | schema and RPC additions Lynx uses (sidebar snapshots, PDF inspection, project fields)                 |
| `packages/shared/package.json`                                                       | +140 / -0        | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/browserAnnotations.ts`                                          | +2 / -1          | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/browserSession.ts`                                              | +93 / -0         | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/conversationEdit.test.ts`                                       | +22 / -49        | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/conversationEdit.ts`                                            | +42 / -1         | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/localPreviewFiles.ts`                                           | +6 / -8          | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/localServers.test.ts`                                           | +22 / -0         | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/localServers.ts`                                                | +17 / -1         | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/pinnedMessages.test.ts`                                         | +11 / -0         | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/pinnedMessages.ts`                                              | +30 / -0         | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/providerUsage.ts`                                               | +14 / -0         | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/terminalThreads.test.ts`                                        | +9 / -0          | runtime logic shared by both renderers; subpath exports                                                |
| `packages/shared/src/terminalThreads.ts`                                             | +2 / -0          | runtime logic shared by both renderers; subpath exports                                                |
| `scripts/check-brand-identity.ts`                                                    | +13 / -2         | larger git buffer; Lynx bundle id exemption                                                            |
| `scripts/server-sync-fs-budget.json`                                                 | +6 / -0          | budget entry for the Codex binary probe                                                                |
