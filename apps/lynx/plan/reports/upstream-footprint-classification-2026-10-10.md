# Upstream footprint by cause, 2026-10-10 (round two, phase D)

Base: `upstream/main` 6f54f53c6. Measured with `node apps/lynx/scripts/upstream-footprint.mjs`.

| Metric                             | Before | After |
| ---------------------------------- | -----: | ----: |
| Upstream files the fork modifies   |    184 |   105 |
| Changed lines in those files       |  5,883 | 3,681 |
| Fork files in upstream-owned paths |    395 |   328 |

## How the 184 were classified

Three scripted passes, then a read of each diff:

1. Signals per file from the diff against upstream: `~/platform` imports, `data-*` attributes,
   added exports, imports of fork modules, test or config file.
2. Restore every modified `apps/web/src` file in the working tree and run both typechecks. The
   errors name the files Lynx or a fork module still needs something from (30 files); the other 95
   restore with no type error.
3. The Lynx value-import graph before and after each restore (`src/app/index.tsx`, resolved with
   `tsconfig.app.json` and the resource replacements). 40 of the 125 are in it, and those were
   read for what changes at run time on Lynx. No restore added an upstream module to the graph.

| Cause                                                                    | Before | Restored | Remaining |
| ------------------------------------------------------------------------ | -----: | -------: | --------: |
| Spelling, formatting or dead fork edits                                  |     14 |       14 |         0 |
| Browser globals spelled through fork seams (`~/platform`, bare timers)   |     32 |       29 |         3 |
| `data-*` test hooks for the comparison harness                           |      1 |        1 |         0 |
| Fork-made Electron changes (tokens, wrapping, error states, networkMode) |     16 |       14 |         2 |
| Logic moved out of the upstream file into a fork module                  |     24 |       21 |         3 |
| Exports, widened types or small helpers added for Lynx                   |     26 |        0 |        26 |
| Components Lab (a fork page inside the Web app)                          |     11 |        0 |        11 |
| Engine compatibility (PrimJS regex and `Intl`)                           |      2 |        0 |         2 |
| Web facade and dependency for fork RPCs                                  |      2 |        0 |         2 |
| Fork features in `apps/server`                                           |     21 |        0 |        21 |
| Fork features in `packages/contracts` and `packages/shared`              |     22 |        0 |        22 |
| Comparison-harness switches in `apps/desktop`                            |     13 |        0 |        13 |
| **Total**                                                                |    184 |       79 |       105 |

A file with two causes is counted under the one that keeps it from being restored. `toast.tsx`
is under Components Lab; it also carries the remaining `data-*` hook and a platform seam.

## What was restored

Every file below is byte-identical to `upstream/main` (`git diff upstream/main -- <file>` is empty).

**Spelling, formatting, dead edits (14).** `workLog.ts`, `components/Sidebar.logic.test.ts`,
`components/SidebarSearchPalette.tsx`, `components/AntigravityIcon.tsx`, `components/Icons.tsx`,
`components/composerFooterLayout.ts` and its test, `components/chat/FileDiffView.tsx`,
`components/chat/chatTypography.ts`, `components/chat/useComposerVoiceController.test.ts`,
`components/settings/ModelsSettingsPanel.test.ts`, `lib/chatReferences.ts`,
`rightDockStore.logic.test.ts`, `wsNativeApi.test.ts`.

**Browser globals through fork seams (29).** Bare timers for `window.setTimeout`:
`chat/ProviderModelPicker.tsx`, `chat/environment/EnvironmentEditableChecklistRow.tsx`,
`EnvironmentProjectInstructionsSection.tsx`, `useThreadNotesAutosave.ts`,
`kanban/useKanbanBoard.ts`, `terminal/terminalFontSettle.ts`, `terminal/terminalRuntimeTypes.ts`,
`useGitProgressToastPreview.ts`, `hooks/useThreadRecap.ts`, `routes/_chat.$threadId.tsx`, and five
browser tests (`MessagesTimeline.messageEnter`, `EnvironmentNotesSection`,
`EnvironmentPinnedSection`, `ui/menuSubmenu`, `useRouteSpaceSync`: read their CI lane with this
in mind). `~/platform` imports: `components/Sidebar.uiState.ts`, `feedback.ts`, `keybindings.ts`
and its test, `lib/projectReactQuery.ts`, `components/ui/sidebar.tsx`,
`terminal/terminalRuntime.ts`, `terminal/terminalRuntimeAppearance.ts`, `hooks/useMediaQuery.ts`,
`hooks/useTheme.ts`, `hooks/useSidebarProjectRunController.ts` and its test,
`components/AppSnapWelcomeDialog.tsx`, `components/ChatMarkdown.tsx`.

**Test hooks (1).** `components/Sidebar.tsx`.

**Fork-made Electron changes (14).** `ui/autocomplete.tsx`, `ui/badge.tsx`, `ui/button.tsx`,
`ui/combobox.tsx`, `ui/select.tsx`, `ui/switch.tsx`, `ui/toggle.tsx`,
`chat/composerPickerStyles.ts`, `ThreadPinToggleButton.tsx`, `BrowserPanel.tsx`,
`chat/ComposerChoiceRow.tsx`, `chat/ComposerPendingApprovalPanel.tsx`,
`chat/UserInputQuestionForm.tsx`, `lib/gitReactQuery.ts`.

**Logic moved out (21).** `SpaceIcon.tsx`, `RestoreOrCreateChatRoute.tsx`,
`composerInlineChip.ts`, `composerDraftActions.ts`, `pinnedMessages.ts`, `persistedRecord.ts`,
`session-logic.ts`, `chat/FileAttachmentChip.tsx`, `chat/FileEntryIcon.tsx`,
`chat/rightDockPaneMeta.tsx`, `chat/ComposerColumnFrame.tsx`, `chat/ChatEmptyStateHero.tsx`,
`chat/PickerTriggerButton.tsx`, `settings/SettingsPanelPrimitives.tsx`, `ui/time-picker.tsx`,
`hooks/useSidebarThreadActions.ts`, `lib/pin.tsx`, `lib/codeFence.ts`, `lib/pdf/pdfZoom.ts`,
`lib/subagentPresentation.ts`, `lib/usagePace.ts`.

## What remains, and why

| Group                                 | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Why it stays                                                                                                                                                                                                                                                                                                                                                                                | Estimate                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Exports and helpers Lynx imports (26) | `ChatView.logic.ts` (+test), `GitActionsControl.logic.ts`, `SidebarSearchPalette.logic.ts` (+test), `chat/MessagesTimeline.logic.ts`, `chat/messageTrail.logic.ts` (+test), `pullRequest/pullRequestDetail.logic.ts`, `file-icons.ts` (+test), `lib/appTypography.ts`, `lib/composerPastedText.ts` (+test), `lib/diffRendering.ts`, `lib/projectShortcutTargets.ts`, `lib/providerDiscovery.ts` (+test), `lib/relativeTime.ts`, `lib/threadSettle.ts` (+test), `notifications/taskCompletion.logic.ts`, `providerModelOptions.ts`, `providerUpdates.ts`, `recentViews.logic.ts`, `theme/theme.logic.ts` | Each adds a function, a parameter or a wider type that Lynx calls. Move the addition to a Lynx module (most are self-contained functions appended to the file), or generate it where it needs a non-exported upstream declaration.                                                                                                                                                          | 2–3 days; the appended functions first (about half)             |
| Seams and splits left (5)             | `appSettings.ts`, `storePersistence.ts`, `terminalStateStore.ts`, `chat/PanelStateMessage.tsx`, `index.css`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `appSettings.ts` reads `globalThis.localStorage`, which the injection does not bind (unbound it would repeat the server-settings migration on every Lynx start). The two stores also add Lynx-only exports. `PanelStateMessage.tsx` renders through an elements adapter Lynx uses. `index.css` has its token block split into the fork's `tokens.css`, which Lynx and the style audit read. | 1–2 days; a token generator for `index.css` is the largest part |
| File preview (3)                      | `components/WorkspaceFilePreview.tsx`, `chat/DockFilePane.tsx`, `chat/WorkspaceFilePreviewHeader.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | The first two carry the fork's read-error state with Retry that workflow J3 checks on Electron (restoring them made J3 fail there; they were put back). The header takes a Components Lab prop and a breadcrumb helper moved to `@synara/shared`.                                                                                                                                           | 1 day, with a decision on the Retry state                       |
| Engine compatibility (2)              | `lib/automationForm.ts`, `lib/projectAppearance.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Module-scope `new Intl.DateTimeFormat` and a `\p{…}` regex literal: PrimJS has no `Intl` on the main thread and rejects the literal at parse time. Needs `Intl` in the injected environment and a Lynx replacement for the emoji helper.                                                                                                                                                    | 0.5–1 day                                                       |
| Components Lab (11)                   | `routes/__root.tsx`, `routeTree.gen.ts`, `appNavigation.ts` (+test), `vite.config.ts`, `tsconfig.json`, `ui/toast.tsx`, `chat/workspaceExplorer.tsx`, `ReviewFileTreePanel.tsx`, `chat/PickerPanelShell.tsx`, `TerminalSearch.tsx`                                                                                                                                                                                                                                                                                                                                                                      | The specimen page is a route of the Web app and imports fixtures these files export. Restoring them means giving the page its own entry outside `apps/web`.                                                                                                                                                                                                                                 | 2–3 days                                                        |
| Facade and dependency (2)             | `wsNativeApi.ts`, `apps/web/package.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Two facade methods for the fork RPCs below; the `diff` dependency of the fork's additions to `lib/diffRendering.ts`.                                                                                                                                                                                                                                                                        | With the RPCs                                                   |
| Server features (21)                  | sidebar and search snapshots (`ProjectionSnapshotQuery*`, `wsRpc.ts`), local PDF first-page size (`http.ts`, `localImageRoute.test.ts`, `package.json`), `git.statusLocal` (`GitCore*`, `GitStatusBroadcaster*`), deleted-thread guards, Codex binary resolution, provider stream fixes, the fixture retention switch                                                                                                                                                                                                                                                                                   | Fork RPCs and server fixes Lynx or the harness uses. Each needs to move behind a fork-owned server extension point or be dropped where Lynx can use an upstream RPC.                                                                                                                                                                                                                        | 1–2 weeks; not attempted                                        |
| Contracts and shared (22)             | `packages/contracts` (`orchestration.ts`, `rpc.ts`, `ws.ts`, `ipc.ts`, `project.ts`, …), `packages/shared` (`browserSession.ts`, `conversationEdit.ts`, `localServers.ts`, `pinnedMessages.ts`, `providerUsage.ts`, `terminalThreads.ts`, `package.json`, …)                                                                                                                                                                                                                                                                                                                                            | Schemas for the RPCs above and helpers appended to upstream shared modules. `pinnedMessages.ts`, `localServers.ts` and `terminalThreads.ts` can go once Lynx reads the upstream functions (the Web copies are restored).                                                                                                                                                                    | 2–3 days for the shared helpers; contracts follow the server    |
| Desktop harness switches (13)         | `apps/desktop/src/main.ts`, `appSnapManager*`, `desktopUserDataProfile*`, `desktopWsBridge*`, `mediaPermissions*`, `syncShellEnvironment*`, `scripts/electron-launcher.mjs`, `native/appsnap/WindowCapture.swift`                                                                                                                                                                                                                                                                                                                                                                                       | Parallel instance, skipped setup, auth token and AppSnap capture options the comparison launcher sets on Electron, and the Components Lab menu entry.                                                                                                                                                                                                                                       | 3–5 days; needs a launcher that does not patch Electron         |

The orchestration containers (`ChatView.tsx`, `Sidebar.tsx`) carry no fork diff any more.

## Fork files in upstream-owned paths (328)

| Where                                       | Count | Note                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moved to `apps/lynx/src/logic` this phase   |    37 | 19 `packages/shared` modules only Lynx imported, with their tests.                                                                                                                                                                                                                                                                                                                                                  |
| Deleted this phase                          |    30 | Compositions and element twins nothing rendered, unused `~/platform` modules, fork tests of removed edits.                                                                                                                                                                                                                                                                                                          |
| Compositions and logic only Lynx imports    |  ~110 | `apps/web/src/components/**/*Composition*.tsx`, `*.logic.ts`, `Sidebar*` sections. Their Web element twins (~55) exist only so the Web typecheck resolves them. Move the compositions under `apps/lynx`, then delete the twins and their Web tests. Needs a path fallback for `~/…` and `@synara-web/…` so importers do not change, and Lynx source-text tests that read these files by path must follow. 2–3 days. |
| Components Lab (Web page and fixtures)      |   ~35 | Stays until the page has its own entry.                                                                                                                                                                                                                                                                                                                                                                             |
| Shared by a still-modified upstream file    |   ~60 | For example `tokens.css`, `appSettingsStorageProjection.logic.ts`, `@synara/shared/sidebarSearch`. They follow the upstream file that imports them.                                                                                                                                                                                                                                                                 |
| Server, desktop, contracts, workflow, icons |   ~15 | With their features; `.github/workflows/lynx-fork.yml` stays.                                                                                                                                                                                                                                                                                                                                                       |
| Fork tests of the above                     |   ~70 | Move or go with their subjects.                                                                                                                                                                                                                                                                                                                                                                                     |

## Guards added

| Guard                                                                           | Stops when                                                                                                                                               |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/upstream-parallel-copies.mjs --check` (typecheck, `audit:reuse:check`) | Upstream changes, renames or removes a declaration the fork keeps a copy of for Lynx (25 upstream files; manifest `plan/upstream-parallel-copies.json`). |
| `src/platform/browserEnvironmentBranchGuards.lynx.test.ts`                      | A Lynx module starts calling an upstream export whose `typeof window` branch Lynx does not implement.                                                    |
| `scripts/comparison-electron-selectors.test.mjs` (repo root)                    | Upstream renames the sidebar markup the harness locates rows by.                                                                                         |
