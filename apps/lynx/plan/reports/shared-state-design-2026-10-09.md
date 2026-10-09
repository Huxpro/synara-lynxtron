# Shared state layer on Lynx — design investigation and Step 1 record

Date: 2026-10-09. Branch `huxcc/m1-transport` (Step 1 committed as `4d355f285`, lifecycle fixes as
`ff3653628`). Companion to `plan/shared-state-architecture.md` (v1.2). Every claim below carries a
file path; `UNVERIFIED` marks what still needs a spike.

## 0. Decision

Lynx runs upstream's state/session source (`NativeApi` facade, store + selectors, session sync,
feature stores, query option factories) over a Lynx-side compatibility layer. The transport keeps the
host relay: a `WsTransport`-shaped compat class (`apps/lynx/src/adapters/wsTransport.lynx.ts`) over
`NativeModules.bridge`, resolved in place of upstream `wsTransport.ts`. Direct WebSocket from the
background thread stays a later, isolated swap behind the same replacement (its blockers: Effect RPC
client on PrimJS, `url.pathname =` mutation on the Lynx URL polyfill, no `LynxWebSocketModule` in the
Lynx-for-Web worker; all UNVERIFIED since the P2-V6 probe on Lynxtron 0.0.7).

## 1. Why the second implementation exists

| Reason (source)                                                                                                                                                                                                                                                                                                                                                                            | Still holds?                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-V2 (`plan/03-decisions.md:108-117`): Effect socket adapter failed at load with `TextEncoder is not defined`.                                                                                                                                                                                                                                                                            | Historical. `src/runtime-polyfills.ts` loads `text-encoding-polyfill.ts`.                                                                                                                                                                                                                                                                                                                                                                               |
| P2-V6 (`03-decisions.md:156-167`, `04-lynx-patterns.md` P-14): full Effect RPC client on device → `e[i] is not a function`; production lazy chunk via `file:`; bundle 501 KB → 1.68 MB. Decision: 150-line text facade on the Effect JSON wire.                                                                                                                                            | Partly historical, UNVERIFIED. Probe was Lynxtron 0.0.7/old Effect; now 0.0.28, Lynx SDK 4.3, Rspeedy 0.18, `assetPrefix` = `file://…/dist/desktop/`; `effect/Schema` already runs on both threads. Spike: `effect/unstable/rpc` + `unstable/socket` + `ManagedRuntime` on PrimJS. Not needed for the relay path.                                                                                                                                       |
| D4 (`03-decisions.md:93-101`): direct `LynxWebSocketModule` works; relay also fine (~0.4 ms).                                                                                                                                                                                                                                                                                              | Both true for Native.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Commit `373f2d0b7` "Move Native RPC sockets into Lynxtron host": one persistent feature socket in the host, state + stream relay, offline recovery without reconnect churn. Runtime-compat doc rows: wrapper CLOSED before close listeners (`CLOSE_WAIT` FDs), Origin gate needs `synara://app`, URL polyfill ignores `url.pathname = …` (`docs/lynxtron-runtime-compatibility.md:57-58`). | Holds for a direct transport (`wsTransport.ts:148-150,165` does `url.pathname = path`). The host socket survives a LynxView reload; a renderer socket would not.                                                                                                                                                                                                                                                                                        |
| `50fa5584a`: host injects `runtimeWsUrl`; bundle embeds no endpoint. Harness `verifyNativeBackendConnections` (`scripts/dev-electron-lynxtron.mjs:1776-1803`) asserts via `lsof` that owned Lynxtron PIDs reach only the certified backend.                                                                                                                                                | Holds; the relay keeps the "host owns all transports" invariant.                                                                                                                                                                                                                                                                                                                                                                                        |
| Lynx-for-Web relay (`src/main/web/web-host.ts`): the background worker has no `LynxWebSocketModule`.                                                                                                                                                                                                                                                                                       | Holds; a direct transport needs a second socket port.                                                                                                                                                                                                                                                                                                                                                                                                   |
| P6-C1 (`03-decisions.md:203-228`): eager `storeSelectors` / full `composerDraftStore` graph on the main thread → `Decode error: Context construct failed`, > 10 MiB dev bundle.                                                                                                                                                                                                            | Threading rule holds (state layer reached via `'background only'` functions + eager dynamic import, P-16). The "store cannot enter Lynx" part is stale: `store.ts` is bundled and statically imported by `app/router.tsx`, `components/sidebar/Sidebar.lynx.tsx`, `components/composer/LandingComposer.lynx.tsx`, `app/SettingsAdvancedPanel.lynx.tsx`. The zero-BigInt loader (`scripts/zero-bigint-literal-loader.mjs`) fixed one decode-error class. |
| P2-V1 (`app/router.tsx:1-10`): `@tanstack/react-router` component layer crashes; the memory-history engine works.                                                                                                                                                                                                                                                                          | Holds: router hooks must be shimmed.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| P2-V5: markdown parsed in a background effect, not in render → `app/queries.ts` `parseMarkdown`.                                                                                                                                                                                                                                                                                           | Holds; Lynx adapter forever.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| FC-039 (`docs/lynxtron-runtime-compatibility.md:145`): background → foreground query commit can stall → 500 ms thread poll (`router.tsx:3003`), 5 s sidebar/threads polls (`router.tsx:2811`, `Sidebar.lynx.tsx:512,533`).                                                                                                                                                                 | Holds as a risk for Steps 3–4.                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Reuse-audit caveat

Before Step 1 the audit listed `wsTransport.ts`/`wsNativeApi.ts` as SHARED although the bundle
contained neither: `scripts/reuse-audit.mjs` counts every `ImportDeclaration` (including
`import type`) and, before Step 1, redirected only the `~/nativeApi` specifier while
`lib/gitReactQuery.ts:10`, `platform/dialogs.ts:11`, `appSettings.ts:40` import `../nativeApi`
relatively. Step 1 mirrors the bundle's resource replacements in the audit resolver; the type-only
inflation is left as is (fixing it lowers per-screen rates). The committed reports had also been
oxfmt'd after generation, so both audits' exact-text `--check` were red on the clean tree;
`scripts/format-generated.mjs` now formats generated reports on write and compares formatted text on
check.

## 2. Transport / NativeApi closure on Lynx (state after Step 1)

| Dependency of `wsTransport.ts` / `wsNativeApi.ts`                                                                               | Status                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `effect`, `effect/unstable/rpc`, `effect/unstable/socket` (`wsTransport.ts:39-41`)                                              | Not on Lynx: upstream `wsTransport.ts` is replaced by the compat (bundle: no `x-synara-client-build`, `ManagedRuntime`, `RpcSerialization`).                                                                                                                                                                                                                                                                                        |
| `./platform/socket` (relative)                                                                                                  | Only reached by the replaced file. A direct transport would need `~/platform/socket` with `layerWebSocketConstructorFromPort` over `platform/net.socket.ts`.                                                                                                                                                                                                                                                                        |
| `./branding` (`import.meta.env.APP_VERSION/DEV`)                                                                                | Only reached by the replaced file; `lynx.config.ts` defines `process.env.*` only.                                                                                                                                                                                                                                                                                                                                                   |
| `./wsTransportEvents` → `~/platform/env`, `~/platform/events`                                                                   | Runs: Lynx `platform/env.lynx.ts` (`isBrowser()` true) + new `platform/events.ts` (in-memory window bus) + `Event`/`CustomEvent` stand-ins in `primjs-polyfills.ts`, so `emitWsTransportState` publishes and `addWsTransportStateListener` works.                                                                                                                                                                                   |
| `~/components/ui/confirmDialogFallback`, `contextMenuFallback` (DOM)                                                            | Replaced by `adapters/{confirmDialogFallback,contextMenuFallback}.lynx.ts` (background-only delegation to `platform/dialogs.ts`, `platform/contextMenu.ts`).                                                                                                                                                                                                                                                                        |
| `./lib/externalUrl` (pure), `./lib/wsHttpUrl` (guarded by `isBrowser`/`getDesktopBridge`)                                       | Run as is. `wsHttpUrl` returns the raw path on Lynx; attachment URLs on Lynx use `platform/runtimeEndpointSource.ts` elsewhere.                                                                                                                                                                                                                                                                                                     |
| `window.desktopBridge` ×30 (`wsNativeApi.ts:419-828`), `fetch`/`atob`/`Blob`/`document.createElement("a")` (`:177,217,426-434`) | Bundled but unreachable: `adapters/nativeApi.lynx.ts` spreads `createWsNativeApi()` and overrides `dialogs`, `shell.openExternal/showInFolder`, `contextMenu`, `server.transcribeVoice` (host RPC), `server.*Auth*` (reject: renderer has no HTTP origin), `browser.*` (placeholder per D3/D13). `adapters/nativeApi.lynx.test.ts` sweeps every namespace with throwing `window`/`document`/`navigator`/`location`/`fetch` proxies. |
| `AbortController`, `crypto.randomUUID`                                                                                          | Not used by the compat (abort scope is promise-based); `randomUUID` only in the replaced browser fallback. UNVERIFIED on PrimJS, irrelevant now.                                                                                                                                                                                                                                                                                    |
| `import.meta.hot` (`wsNativeApi.ts:910`)                                                                                        | Compiles to `undefined` under Rspack; build passes.                                                                                                                                                                                                                                                                                                                                                                                 |

Both import styles resolve to the Lynx files: `resolve.alias` (`~/…$` keys) plus
`lynxResourceReplacements` in `lynx.config.ts`, applied through `tools.rspack` →
`rspack.NormalModuleReplacementPlugin` rewriting `createData.resource/request/userRequest` after
resolution. Covered: `nativeApi.ts`, `wsTransport.ts`, `platform/events.ts`, the two ui fallbacks.
`scripts/sync-tsconfig-paths.mjs` mirrors aliases only; relative imports typecheck against the web
file (shape-compatible).

## 3. Session sync without touching upstream

### 3.1 What `EventRouter` is (this branch, `apps/web/src/routes/__root.tsx`, 1593 lines)

| Declaration                                                                                                                                                | Lines     | Used by `EventRouter`                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `SHELL_SNAPSHOT_BOOTSTRAP_FALLBACK_DELAY_MS`, `THREAD_DETAIL_CATCHUP_INTERVAL_MS`, `PENDING_SHELL_EVENT_BUFFER_LIMIT`, `PENDING_THREAD_EVENT_BUFFER_LIMIT` | 119-122   | yes                                                                                              |
| `reconcilePromotedDraftsFromShellThreads`, `reconcilePromotedDraftFromThreadDetail`                                                                        | 139-154   | yes (draft promotion)                                                                            |
| `Route` (`createRootRouteWithContext`), `RootRouteView`                                                                                                    | 155-300   | no (shell; renders DOM `<div>`, `ToastProvider`, `DesktopWindowControls`, `import.meta.env.DEV`) |
| `coalesceOrchestrationUiEvents`                                                                                                                            | 753-789   | yes                                                                                              |
| `appendBounded`                                                                                                                                            | 790-812   | yes                                                                                              |
| `shouldFlushDomainEventImmediately`                                                                                                                        | 813-837   | yes                                                                                              |
| `isThreadDetailEventForThread`                                                                                                                             | 838-863   | yes                                                                                              |
| `shouldPollThreadDetailCatchup`                                                                                                                            | 864-870   | yes                                                                                              |
| `EventRouter`                                                                                                                                              | 871-1545  | —                                                                                                |
| `DesktopProjectBootstrap`                                                                                                                                  | 1547-1591 | sibling; also worth mounting (repair path)                                                       |
| `selectAllThreads = createAllThreadsSelector()`                                                                                                            | 1593      | yes (module-level, after use)                                                                    |

Imports `EventRouter` needs (line = import statement in `__root.tsx`):

| Import                                                                                                                                                                                                                                                                                                                           | Resolves on Lynx today?                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@synara/contracts` (:1-11), `@synara/shared/terminalThreads` (:12)                                                                                                                                                                                                                                                              | yes                                                                                          |
| `useNavigate`, `useParams`, `useRouterState` from `@tanstack/react-router` (:13-20); `useDiffRouteSearch` (:90) → `useSearch` (`hooks/useDiffRouteSearch.ts:6,37`)                                                                                                                                                               | **no** (P2-V1 crash) → shim, see 3.3                                                         |
| `useMemo`, `useEffect`, `useLayoutEffect`, `useRef` from `react` (:21)                                                                                                                                                                                                                                                           | yes (`react$` → `src/react-compat-shim.ts`; `useLayoutEffect` is async on ReactLynx)         |
| `useQueryClient` (:22)                                                                                                                                                                                                                                                                                                           | yes (`App.tsx:274` `QueryClientProvider`)                                                    |
| `Throttler` from `@tanstack/react-pacer` (:23)                                                                                                                                                                                                                                                                                   | yes (`store.ts` already uses `Debouncer`)                                                    |
| `toastManager` from `../components/ui/toast` (:37)                                                                                                                                                                                                                                                                               | **no** `toast.lynx` exists → shim, see 3.3                                                   |
| `resolveAndPersistPreferredEditor` (:39) → `hooks/useLocalStorage`                                                                                                                                                                                                                                                               | yes (storage port)                                                                           |
| `serverConfigQueryOptions`, `serverQueryKeys`, `serverSettingsQueryOptions` (:45-49)                                                                                                                                                                                                                                             | yes (bundled since Step 1; call `ensureNativeApi()` which now returns the facade)            |
| `ensureNativeApi`, `readNativeApi` (:50, relative)                                                                                                                                                                                                                                                                               | yes (resource replacement → `adapters/nativeApi.lynx.ts`)                                    |
| `finalizePromotedDraftThreads`, `markPromotedDraftThreads`, `useComposerDraftStore` (:51-55, relative)                                                                                                                                                                                                                           | **shape gap**, see 3.4                                                                       |
| `useStore` (:56), `createAllThreadsSelector` (:57)                                                                                                                                                                                                                                                                               | yes                                                                                          |
| `selectThreadTerminalState`, `useTerminalStateStore` (:58); `terminalActivityFromEvent` (:59)                                                                                                                                                                                                                                    | yes (hydrated in `App.tsx`)                                                                  |
| `onServerWelcome`, `onServerConfigUpdated`, `onServerProviderStatusesUpdated`, `onServerSettingsUpdated` from `../wsNativeApi` (:60-65)                                                                                                                                                                                          | yes (bundled, backed by compat push streams)                                                 |
| `providerQueryKeys` (:70), `projectQueryKeys`/`invalidateProjectFileQueriesForCwds` (:71), `collectActiveTerminalThreadIds` (:72), `dockTerminalThreadId` (:74), `invalidateGitQueries*` (:88), `providerModelDiscoveryInvalidationFingerprint` (:94), `providerDiscoveryQueryKeys` (:95), `./-rootEventInvalidation` (:107-114) | yes (pure/query-key modules)                                                                 |
| `useProjectRunStore` (:73), `useSplitViewStore`/`selectSplitView`/`resolveSplitViewThreadIds` (:93)                                                                                                                                                                                                                              | compile yes (plain zustand); not bundled yet (no importer). UNVERIFIED on device: first use. |
| `useWorkspaceStore`, `workspaceThreadId` (:76)                                                                                                                                                                                                                                                                                   | yes (hydrated in `App.tsx`)                                                                  |
| `resolveThreadDetailSubscriptionLeaseIds`, `useRetainedThreadDetailIds` (:77-80, `threadDetailSubscriptionRetention.ts:222,243`, `useSyncExternalStore` from `react`)                                                                                                                                                            | yes (zustand already uses it)                                                                |
| `getThreadFromState`, `getThreadsFromState` (:81)                                                                                                                                                                                                                                                                                | yes                                                                                          |

Render-body safety: lines 872-915 run on both threads (store selectors, `useQueryClient`, router
hooks, `useRetainedThreadDetailIds`, `resolveThreadDetailSubscriptionLeaseIds`); no `toSorted`
there. The `.toSorted` calls (975, 987, 1217) are inside the effect (background), which P-34 allows.

### 3.2 The PATCHED mechanism today

`plan/reuse-audit.config.json` `patchedSources: []`; the only PATCHED module is `lib/icons.tsx`
(classification rule), generated by `scripts/generate-lynx-icons.mjs` → `icons.lynx.tsx` (D6) and
aliased. PATCHED = deterministic generated artifact + alias + audit declaration, not a build-time
transform. Compiling `__root.tsx` whole is not realistic (`RootRouteView` shell above).

### 3.3 Generator approach and required shims

Generator `scripts/generate-event-router.mjs` (TypeScript AST, as the audit already uses `typescript`):
extract `function EventRouter` and `DesktopProjectBootstrap` plus the file-local declarations they
close over (119-122, 139-154, 753-870, 1593), rewrite relative imports to `@synara-web/…`, drop the
unused imports, emit `apps/lynx/src/generated/eventRouter.generated.tsx`, `--check` fails on drift,
declare `apps/web/src/routes/__root.tsx` in `patchedSources`. Replacement rules for the generated
file's imports:

| Upstream import                                                                      | Lynx replacement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/react-router` (`useNavigate`, `useRouterState`, `useParams`, `useSearch`) | `adapters/reactRouter.lynx.ts` over the memory history in `app/router.tsx` (`history` :237, `useRoute` :354, navigation is `history.push(...)` e.g. :625,2936). Call sites: `useNavigate()` → `navigate({ to: "/$threadId", params: { threadId }, replace: true })` (:1382-1386) → `history.replace(\`/thread/${threadId}\`)`; `useRouterState({ select: s => s.location.pathname })` (:887) → current route pathname (note Lynx paths are `/thread/:id`, upstream `/$threadId`); `useParams({ strict: false, select: p => p.threadId ? ThreadId.makeUnsafe(p.threadId) : null })`(:888-891) → thread id from`parseRoute`; `useSearch` (`useDiffRouteSearch`) → `splitViewId` from the Lynx route state (`null` until split views exist on Lynx). |
| `~/components/ui/toast` (`toastManager.add/update/close`)                            | `components/ui/toast.lynx.tsx`: minimal `toastManager` { `add(options) → id`, `update(id, options)`, `close(id)` } rendered by a host near `app/TaskCompletionToastHost.lynx.tsx`. `EventRouter` call sites: :1402 (keybindings issue warning with `actionProps.onClick`), :1419 (open-file error). `GitProgressToastPreviewDev`/`ProviderUpdateNotifications` use more but are not extracted.                                                                                                                                                                                                                                                                                                                                                    |
| `../composerDraftStore`                                                              | see 3.4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `../nativeApi`, `../wsNativeApi`, `../store`, …                                      | already replaced/bundled                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### 3.4 Composer draft store shape gap

`EventRouter` reads `useComposerDraftStore.getState().draftThreadsByThreadId` (:1076-1078) and calls
`markPromotedDraftThreads`/`finalizePromotedDraftThreads` (`composerDraftStore.ts:147,157`) through
`reconcilePromotedDrafts*` (:139-154). The Lynx facade `adapters/composerDraftStore.lynx.ts`
(`LynxComposerDraftStoreState` :61) keeps `draftsByThreadId: Record<string, LynxComposerDraft>` and
has no `draftThreadsByThreadId` and no promotion helpers (the full Web store cannot enter the Lynx
main thread: `03-decisions.md:217-228`). Options: (a) add `draftThreadsByThreadId` (empty map) and
no-op `markPromotedDraftThreads`/`finalizePromotedDraftThreads` to the facade and resource-replace
`composerDraftStore.ts` → facade (`lynxResourceReplacements`); draft threads on Lynx are keyed by
`landingDraftIdentity.logic.ts`, so promotion is a later step; (b) have the generator rewrite the two
helpers to Lynx equivalents. (a) is smaller and keeps the generated file verbatim.

### 3.5 Mount and coexistence

Mount `<EventRouter />` (and `<DesktopProjectBootstrap />`) inside `App.tsx` under
`QueryClientProvider` (:274) next to `<SliceRouter>` (:293), guarded by `hydrationState === "ready"`
like the other background consumers. It writes to the same `useStore` the polling path already
syncs into (`queries.ts` `fetchSidebarSnapshot`/`fetchThreadTranscriptRows` call
`syncServerShellSnapshot`/`syncServerThreadDetail`); `snapshotSequence` guards make double
application idempotent. Polling (`router.tsx:2811,3003`, `Sidebar.lynx.tsx:512,533`) stays until
Steps 3–4 read from the store. The facade's `subscribeShell`/`subscribeThread` open scoped streams
`orchestration.subscribeShell`/`orchestration.subscribeThread` — the legacy relay also holds
`orchestration.subscribeShell` (`data/synaraClient.lynx.ts` `ensureOrchestrationShellEventStream`,
used by `router.tsx:2817,3010` and `SidebarSearchPaletteHost.lynx.tsx`), and the server admits one
stream per key per socket (`apps/server/src/wsStreamAdmission.ts`, `STREAM_DUPLICATE_SUBSCRIPTION`,
non-retryable). Step 2 must therefore route `subscribeOrchestrationShellEvents` through
`api.orchestration.onShellEvent` (one subscriber) the way `subscribeServerSettings` was moved in
Step 1, or mirror the host broadcast as done for terminal events.

### 3.6 Risks

- Duplicate shell stream (above) if the legacy subscriber is left in place.
- Welcome bootstrap navigation (:1358-1389) navigates to `/$threadId` on `/`; Lynx has its own
  restore logic (`chatRouteRestore`, `router.tsx`); gate it or map paths.
- `useLayoutEffect` reconcile (:1536-1542) is async on ReactLynx; subscriptions still converge.
- Thread catch-up interval and shell bootstrap fallback timers run per renderer; a LynxView reload
  discards them (the host cancels the old generation's streams).
- `DesktopProjectBootstrap` calls `api.orchestration.repairState()` when projects are missing;
  harmless on the fixture but observe on real data.
- FC-039 (query commit stalls) is unaffected until polling is removed.

## 4. Read-path mapping (consumer file counts, non-test)

| Lynx export                                                                                                                                                                                                                                                                                                                                       | Upstream equivalent                                                                                                      | Consumers  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `synaraClient.dispatchSynaraCommand`                                                                                                                                                                                                                                                                                                              | `api.orchestration.dispatchCommand` (compat unwraps `{command}`)                                                         | 16         |
| `fetchServerConfig` / `fetchServerSettings` / `subscribeServerSettings`                                                                                                                                                                                                                                                                           | **moved in Step 1** → `ensureNativeApi().server.getConfig/getSettings`, `onServerSettingsUpdated`                        | 11 / 6 / 1 |
| `updateServerSettings`                                                                                                                                                                                                                                                                                                                            | `api.server.updateSettings`                                                                                              | 4          |
| `fetchSynaraSidebarShellSnapshot` / `fetchSynaraShellSnapshot` / `fetchSynaraThreadDetailSnapshot`                                                                                                                                                                                                                                                | `store.syncServerShellSnapshot` via `EventRouter`; `getThreadFromState`                                                  | 7 / 1 / 2  |
| `fetchGit*`, `stage/unstageGitFiles`, `runGitStackedAction`, `checkoutGitBranch`, `pullGitBranch`, `fetchWorkingTreeDiff`, `fetchGitBranches`                                                                                                                                                                                                     | `lib/gitReactQuery` `git*QueryOptions`/`*MutationOptions`                                                                | 17         |
| `fetchProviderModels/Skills/Plugins/ComposerCapabilities`, `fetchSkillsCatalog`                                                                                                                                                                                                                                                                   | `lib/providerDiscoveryReactQuery`                                                                                        | 8          |
| `searchProjectEntries`, `listProjectDirectories`, `readProjectFile*`, `createLocalFilePreviewGrant`, `browseFilesystem`                                                                                                                                                                                                                           | `lib/projectReactQuery`, `api.filesystem.browse`                                                                         | 7          |
| `fetchSynaraPullRequest*` / `queries.fetchPullRequest*`                                                                                                                                                                                                                                                                                           | `lib/pullRequestReactQuery`, `pullRequestQueryOptions.ts`, `pullRequestMutationOptions.ts`                               | 7          |
| `fetchAutomations`, `create/update/delete/runNow` (both files)                                                                                                                                                                                                                                                                                    | `api.automation.*` (`routes/-automations.shared.tsx` is route-bound)                                                     | 2          |
| `fetchProfileStats/TokenStats`, `fetchAllProviderUsage`, `fetchLocalServers`, `fetchProjectDevServers`, `run/stop*`, `fetchManagedWorktrees`, `openPathInEditor`, `updateProvider`, `refreshProviderStatuses`, `transcribeVoice`, `*ExternalMcp*`, `upsert/removeKeybinding`, `importSynaraThread`, `repairSynaraState`, `fetchFreshServerConfig` | `serverReactQuery` options / `api.server.*`, `api.projects.*`, `api.shell.openInEditor`, `api.orchestration.repairState` | 1–4 each   |
| `queries.fetchSidebarSnapshot` (+ `invalidateSidebarSnapshotProjectionCache`)                                                                                                                                                                                                                                                                     | `createSidebarDisplayThreadsSelector`/`createThreadShellsSelector` on `useStore`                                         | 10         |
| `fetchThreads` (5 s poll) / `fetchThreadHeaderSummary` / `fetchThreadTranscriptRows` (500 ms poll)                                                                                                                                                                                                                                                | `selectAllThreads`, `getThreadFromState` + `deriveMessagesTimelineRows`                                                  | 1 / 4 / 2  |
| `fetchExplorer*`, `fetchEditorIconUrl`, `fetchThreadRecap*`/`prepare/generate`                                                                                                                                                                                                                                                                    | `projectReadFileQueryOptions`, `projectListDirectoriesQueryOptions`, `lib/threadRecap`                                   | 1 each     |
| `queries.queryClient`                                                                                                                                                                                                                                                                                                                             | web `QueryClient` config                                                                                                 | 27         |
| Lynx-only, keep: `highlightExplorerCode` (host Shiki), markdown trees in transcript rows (`queries.ts` `parseMarkdown`, P2-V5), `resolveNativeAssistantDeliveryMode`, `fetchExplorerPdfMetadata`/`inspectProjectPdf`, `useSynaraTransportState` (until it reads `addWsTransportStateListener`)                                                    | none                                                                                                                     | —          |

## 5. Step plan (baseline green after each; Step 1 done)

| #   | Step                                                                                                                                              | Deletes                                 | Verify                                                        | Ratchet                                     | Risk                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| 1   | Compat transport + real facade + 3 server functions (**done**, §6)                                                                                | 3 relay bodies                          | settings cells, J4 cross-client                               | `synaraClient` exports −3                   | duplicate server leases (handled)               |
| 2   | `EventRouter` generator + router/toast shims + draft-store facade gap; mount in `App.tsx`; move `subscribeOrchestrationShellEvents` to the facade | — (coexists with polling)               | threads/thread cells, J1 (reload), J3–J6, zero console errors | `__root.tsx` UNMAPPED → PATCHED             | double shell subscription, bootstrap navigation |
| 3   | Sidebar reads store selectors; drop `fetchSidebarSnapshot`/`fetchThreads` polls                                                                   | `fetchSidebarSnapshot`, caches, 2 polls | threads cells, J3                                             | `useQuery` 78→~72, `refetchInterval` 15→~11 | sort/attention parity                           |
| 4   | Thread page from store (`getThreadFromState` + `deriveMessagesTimelineRows`), markdown memo keyed by message id                                   | 500 ms poll, `transcriptRowsByThreadId` | thread cells + increments, J4–J6                              | `router.tsx` lines                          | FC-039 commit stalls, streaming fidelity        |
| 5   | Per-screen swap to upstream option factories (Settings → Environment/Git → Kanban/PR → Automations/Plugin Library); 4 worktrees                   | corresponding `synaraClient` exports    | that screen's cells                                           | importers 39 → 0                            | `dispatchCommand` wrapper                       |
| 6   | Delete `synaraClient.lynx.ts` (keep host syntax highlighting in a Lynx module); `useSynaraTransportState` → `addWsTransportStateListener`         | file                                    | full matrix                                                   | `queries.ts` ≤ 300 lines                    | —                                               |
| 7   | Optional: direct WebSocket transport behind the same replacement; delete host relay                                                               | ~900 host lines                         | full matrix + `connection-preflight.mjs`                      | —                                           | reconnect semantics move to renderer            |

Steps 1–2 serial; 3 and 4 disjoint; 5 parallel by screen. Lynx-only forever: `src/main/**`,
`platform/*` impls, markdown AST adapter, host syntax highlighting, `router.tsx` route table + memory
history, `Transcript` `<list>`, composer textarea/IME, terminal/browser/PDF placeholders, static
theme projection, `runtimeEndpointSource`.

### Enforcement

- `oxlint --rules` lists `eslint/no-restricted-imports`. Web L2 override (`store*.ts`, `*Store.ts`,
  `wsTransport.ts`, `wsNativeApi.ts`, `wsTransportEvents.ts`, `nativeApi.ts`,
  `threadDetailSubscriptionRetention.ts`, `lib/*ReactQuery*.ts`, `lib/pullRequest*Options.ts`):
  `paths: [react-dom, @tanstack/react-router]`, `patterns: [~/components/ui/*, */components/ui/*,
*/toast]` → currently flags 2 (`wsNativeApi.ts:48-49`, the replaced DOM fallbacks; keep as the
  documented exception). Lynx override (`apps/lynx/src/**`): `patterns: [**/data/synaraClient*]` →
  flags 39 files; shrink an allowlist per step. The existing `no-restricted-globals` override for
  `wsNativeApi.ts` (`.oxfmtrc`/`.oxlintrc.json:46`) stays because upstream cannot change.
- Ratchet (`scripts/reuse-audit.mjs` `lynxParallelImplementation`, AST-based, fails `--check` on any
  increase; baseline in `plan/reuse-audit.config.json`): `synaraClientImporters` 39,
  `useQueryCallSites` 78, `refetchIntervalSites` 15, `routerTsxLines` 3733.

## 6. Step 1 as built

Files: `adapters/wsTransport.lynx.ts` (compat), `adapters/nativeApi.lynx.ts` (facade + overrides),
`adapters/{confirmDialogFallback,contextMenuFallback}.lynx.ts`, `platform/events.ts`,
`primjs-polyfills.ts` (`Event`/`CustomEvent`), `data/nativeRpcBridge.ts` (bridge helpers, moved out of
`synaraClient`), `data/rpcTransport.logic.ts` (`request(…, {timeoutMs})`, `openStream` → `{settled,
cancel}` with Effect RPC `Interrupt`), `main/nativeEventStreams.logic.ts` (protocol constants),
`main/scopedStreamRegistry.logic.ts` (host-agnostic ownership), `main/desktop/nativeRpcHost.ts` +
`main.ts`, `main/web/web-host.ts` + `main/web/webRelayScopedStream.logic.ts`, `lynx.config.ts`
(aliases + `lynxResourceReplacements` + `NormalModuleReplacementPlugin`), `scripts/reuse-audit.mjs`

- `scripts/format-generated.mjs` + `scripts/style-audit.mjs`, tests
  (`adapters/wsTransport.lynx.test.ts`, `adapters/nativeApi.lynx.test.ts`,
  `adapters/fakeNativeHost.testUtils.ts`, `platform/events.test.ts`,
  `main/scopedStreamRegistry.logic.test.ts`, `main/web/webRelayScopedStream.logic.test.ts`,
  `data/rpcTransport.logic.test.ts`).

Bridge protocol (both hosts):

| Method / event                   | Payload                               | Semantics                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `synaraRpc`                      | `{tag, payload, timeoutMs?}`          | plain request; `timeoutMs` `null` = no host watchdog, number = that deadline, absent = host default 60 s. Legacy `synaraClient` calls also carry `baseUrl`; facade calls do not (log tell-tale).                                                                                                                                                                                                 |
| `synaraRpcStreamReset`           | `{}` → `{generation, transportState}` | renderer-generation handshake, once per compat instance in `ensureHostLinks`; host cancels every earlier-generation scoped stream; reply seeds the transport state.                                                                                                                                                                                                                              |
| `synaraRpcStream`                | `{streamId, tag, payload}`            | request-scoped stream; `streamId` = `g<generation>:<key>#<seq>`; the host registers the entry on receipt (before connecting), refuses stale generations (`StaleRendererGenerationError`), items are published as global event `synara:rpc-stream-item` `{streamId, item}`, the reply settles when the stream ends or is cancelled. Without `streamId` the legacy buffered/relay semantics apply. |
| `synaraRpcStreamCancel`          | `{streamId}` → `{cancelled}`          | settles locally then sends Effect `Interrupt`; stale generations ignored.                                                                                                                                                                                                                                                                                                                        |
| `synara:transport-state` (event) | `RpcTransportState`                   | host socket state; mapped to `WsTransportState` (`connected`→`open`, `connecting/reconnecting`→`connecting`, `offline`→`closed`, `idle`→`connecting` until first connect).                                                                                                                                                                                                                       |
| `synara:terminal-event` (event)  | `TerminalEvent`                       | legacy relay broadcast; the compat mirrors it for the `terminal.event` channel instead of opening a second `terminal.events` stream (one lease per socket).                                                                                                                                                                                                                                      |

Renderer semantics: channel streams per upstream (`server.subscribeLifecycle` shared by
welcome/maintenance, config, providers, settings, devServers, automation, domain); shell/thread
subscriptions as cancellable scoped streams; git stacked actions as one-shot scoped streams in the
same registry; restart with backoff 500 ms → 5 s preserved across automatic restarts, reset on item,
explicit unsubscribe or resubscribe; request abort scope with upstream validation and
`WsTransportRequestInterruptedError` (`WS_REQUEST_TIMEOUT`/`WS_REQUEST_ABORTED`), numeric deadlines
forwarded to the host.

Transitional: terminal-event mirroring (until `ThreadTerminal`/`TaskCompletionToastHost` use
`api.terminal.onEvent`); `useSynaraTransportState` polling `synaraClient` relay state;
`subscribeOrchestrationShellEvents` on the legacy relay; `getCompatibility()` returns null and
compatibility issues never fire (host negotiates).

Open follow-ups: host-side interruption of plain requests on abort/timeout (renderer rejects, host
request runs to its own watchdog); structured error relay (`code`, `retryable`) so non-retryable
stream failures are not retried; legacy relay duplicate churn (`orchestration.subscribeShell`,
`terminal.subscribeEvents`) predates this work and disappears with Steps 2–4; `audit:style:check`
is red on the clean tree (stale `p5-r4-core-class-manifest.json`; regenerating also rewrites
`src/generated/core-utilities.css` and needs `generate-color-mix-tokens.mjs` + a baseline update);
`app/queries.lynx.test.ts` and five fidelity source-contract tests fail on the clean tree.

Evidence (2026-10-09 runs on `ff3653628`): cells 6/6 + 7/7, J1 native 6/6 (reload step), J3–J6
both renderers, J4 `electronTonative: "live"`; host log: facade `server.getConfig`/`getSettings`
without `baseUrl`, scoped streams `g1/g2/g3` across reloads, scoped-stream duplicate rejections 0.

## 7. Step 2 as built (branch `huxcc/m2-session-sync`)

Generator: `scripts/generate-event-router.mjs` → `src/generated/eventRouter.generated.tsx` (`EventRouter`
plus the 16 file-local declarations it closes over, verbatim; relative imports rewritten to `~/…`).
Scope resolution uses the TypeScript checker (`noResolve`, ES2023 + DOM libs), not names or line
numbers. It fails without writing when the root is missing, an identifier resolves to nothing, or a
relative import leaves `apps/web/src`. `--check` runs in `typecheck` and `audit:reuse:check`;
`__root.tsx` is declared in `patchedSources`. `DesktopProjectBootstrap` is not extracted (it calls
`repairState()`; mount it only with a reason).

| Upstream import          | Lynx resolution                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/react-router` | alias → `adapters/reactRouter.lynx.ts` (`useRouterState`, `useParams`, `useSearch`, `useNavigate` over the memory history, bound by `app/SessionSync.lynx.tsx`); TypeScript keeps the package types |
| `~/components/ui/toast`  | alias → `components/ui/toast.lynx.ts` (in-memory sink: `add`/`update`/`close`, `console.info`, subscribable; no surface yet)                                                                        |
| `~/composerDraftStore`   | alias → `adapters/composerDraftStore.lynx.ts` (`draftThreadsByThreadId` always empty; promotion helpers are no-ops: Lynx has no client-side draft threads)                                          |
| `@tanstack/react-pacer`  | alias → the copy `apps/web` depends on                                                                                                                                                              |

Aliases only, no resource replacement, for toast and the draft store: mirroring a replacement in the
audit removes the type-import inflation of §1 for those subgraphs (measured: −3 to −9 points per
screen), which is a separate decision.

Mount: `App.tsx` renders `<SessionSync />` once storage is hydrated. The generated module is reached
through a `'background only'` eager dynamic import (P-16), so it is absent from the main-thread graph.

Writers of the shared store during coexistence: `EventRouter` is the only writer of server state.

- Thread detail: the polling path (`queries.ts`) normalizes its snapshot with the pure projection
  (`app/threadDetailProjection.logic.ts`) and does not commit. A polled snapshot committed inside
  `EventRouter`'s 100 ms flush window makes the queued streaming deltas append a second time.
- Shell: `fetchSidebarSnapshot` projects with `projectShellSnapshot` (`app/sessionShell.lynx.ts`) and
  does not commit. Its snapshot is bounded (the 80 most recently updated threads): committed as if
  complete it removed older threads and their detail behind `EventRouter`'s sequence bookkeeping, and
  a poll resolving late rolled back newer streamed shell state.
- Direct store readers wait for the engine: `router.tsx` reads projects through
  `useSessionShellProjects()` and gates the Studio restore controller and recent-view pruning on
  `threadsHydrated`; `LandingComposer` normalizes the snapshot it has just fetched instead of reading
  the store back (a project it creates must be visible in the next read); `SettingsAdvancedPanel`
  already gates on `threadsHydrated`.
- Remaining writers, deliberate: `SettingsAdvancedPanel` repair → `syncServerReadModel` (same call as
  upstream's `AdvancedSettingsPanel.tsx`, user-initiated, full read model); `markThreadUnread` and
  `renameProjectLocally` (client-local state, not server state).
- `subscribeOrchestrationShellEvents` only listens on the facade (`onShellEvent`); `EventRouter`
  opens the single shell stream. The host's fixed `orchestration.subscribeShell` channel is unused.

Generator guards (it stops, writing nothing): missing root; identifier that resolves to nothing;
relative import leaving `apps/web/src`; import attributes on a kept import; a bare side-effect import
not listed in `EVENT_ROUTER_IGNORED_SIDE_EFFECT_IMPORTS` (empty); module-level code outside the
extraction that uses, or any excluded code that assigns to, an extracted binding.

### Upstream defects the engine carries

| Defect                                                                                                                                                                           | upstream/main `6f54f53c6`                                                                                               | Lynx today                                                                                                                                                                                                                        | Blocks                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A replacement thread snapshot does not drop deltas it already contains from `pendingDomainEvents`; the 100 ms flush appends them again (`Hello worldld`).                        | Not fixed: neither snapshot path (`onThreadEvent` snapshot, `reconcileThreadProjection`) touches `pendingDomainEvents`. | **Patched in the generator** (§9): `drop-queued-thread-events-covered-by-snapshot`. The former `it.fails` is three passing tests.                                                                                                 | Nothing. Delete the patch when the generator reports upstream handles the queue. |
| `reconcileThreadSubscriptions` and the continuation after `subscribeShell` do not check `disposed`; a reconcile resuming after unmount can open a thread lease with no listener. | Not fixed: no `disposed` check after the removal await or before the additions.                                         | Unreachable: `SessionSync` mounts once per renderer lifetime (`storageReady` only goes false → true) and never swaps the engine; pinned by `src/app/SessionSync.lynx.test.ts`. A LynxView reload is a new host stream generation. | Any change that unmounts or re-keys `SessionSync`.                               |

### Open checks for Steps 3–4

- Bootstrap navigation: `EventRouter`'s welcome handler can `replace("/")` → `/thread/<id>` while
  Lynx's cold-start restore controller also replaces `/`. No host payload or timing that makes them
  collide has been shown; check with a server started with a bootstrap thread.
- Terminal pruning: `removeOrphanedTerminalStates` now runs on each shell snapshot. Verify persisted
  dock (`dockTerminalThreadId`) and workspace scopes survive, including against an incomplete first
  shell snapshot (the fallback query path).
- upstream/main's `EventRouter` uses `window.setTimeout`/`window.setInterval`; the generator will
  extract it as is, so the Lynx runtime needs a `window` timer surface before that sync.

`tsconfig.app.json` sets `verbatimModuleSyntax: false`: upstream is not written against that flag
(`editorPreferences.ts` imports the type `NativeApi` without `type`), and this program now
type-checks upstream state-layer source. The bundler does not read this tsconfig.

## 8. Step 3 as built (branch `huxcc/m3-sidebar-store`)

The sidebar surfaces (Sidebar, search palette host, Composer mentions, Kanban ×2, PR page, Automations,
Settings Advanced/Archived/Integrations/Worktrees) and the route shell read the shared store.

| Piece                                                                  | File                                 |
| ---------------------------------------------------------------------- | ------------------------------------ |
| Pure projection + memoized selectors over the upstream selectors       | `app/sidebarSnapshot.logic.ts`       |
| Hooks `useSidebarSnapshot`, `useRouteThreadSummaries`; on-demand reads | `app/sidebarSnapshot.lynx.ts`        |
| "Never hydrated" → error with Retry                                    | `app/sessionShellBootstrap.logic.ts` |

Deleted: `fetchSidebarSnapshot`, `fetchThreads`, `projectActiveThreadSummaries`, the snapshot and search
caches, `invalidateSidebarSnapshotProjectionCache`, seven `refetchInterval` polls, two
`subscribeOrchestrationShellEvents` → invalidate effects, the `["sidebar-snapshot"]`/`["threads"]`
invalidations. Ratchet baseline: `useQueryCallSites` 66, `refetchIntervalSites` 8, `routerTsxLines` 3705,
`synaraClientImporters` 39.

Rules this step settled:

- **Selector key.** `threadShellById` and `messageIdsByThreadId` are replaced by every streamed message
  batch (`storeProjection.ts` `writeThreadState`; the shell carries `updatedAt`). The selector reduces
  them to what the sidebar exposes (worktree rows, archived rows, message counts) and keys the
  projection on those reductions, kept by value. A text-only delta costs one comparison pass and
  re-renders no consumer.
- **Working guard.** `ThreadSummary.live` in the sidebar snapshot is upstream's
  `isThreadActivelyWorking` (`SidebarThreadSort.logic.ts`: live tail work, or a running session with a
  live turn), not `hasLiveTailWork` alone: streaming does not rewrite the sidebar summary and the
  server publishes no shell update for streamed text, so `hasLiveTailWork` can stay false for a whole
  turn. Archive/Delete are gated on `live`.
- **Destructive actions read the server.** Worktree removal is forced and the server does not re-check
  conversation links, so `readFreshSidebarSnapshot()` issues `orchestration.getShellSnapshot` through the
  facade and projects it on the store state without committing. A hydrated store can lag the stream.
- **First paint and failure.** `data` is `undefined` until `threadsHydrated` and the local inputs are
  read. Upstream's engine swallows bootstrap failures and exposes no status, so the Lynx-side watch
  reports an error when the transport closes, or after 10 s without hydration; it never speaks after
  the first hydration. `refetch` (the consumers' existing Retry) performs one
  `orchestration.getShellSnapshot` and commits it with the store's `syncServerShellSnapshot` only if the
  store is still not hydrated. That is one more deliberate writer next to those in §7: user-initiated,
  and unreachable once session sync has delivered anything.
- **Not in the store.** Dismissed status keys (storage; a failed read degrades to "none dismissed"
  instead of holding the surfaces in loading) and the sidebar search snapshot
  (`orchestration.getSidebarSearchSnapshot`, fetched after hydration and on each palette open).

Behaviour that follows the store instead of the old poll: no 80-thread cap; spaces in `sortOrder`
order; route threads resolve an unknown session provider to `codex` and show the local project alias;
actions no longer wait for a refetch after a command.

Still request-backed, for Step 4: `fetchThreadHeaderSummary` (thread page) calls
`orchestration.getSidebarShellSnapshot`; `LandingComposer` reads the bounded snapshot for its bootstrap.

## 9. Step 4 as built (branch `huxcc/m3b-thread-reads-store`)

**The blocker.** A thread event that passes the sequence fence goes through `applyFencedThreadEvent` →
`queueDomainEvent` into `pendingDomainEvents`; `domainEventFlushThrottler` (100 ms, trailing) hands the
batch to the store. Only the first streaming delta of an assistant message flushes at once. A thread
snapshot is applied synchronously by `syncServerThreadDetailHotPath` in two places: the `onThreadEvent`
snapshot branch (first subscribe, resubscribe without a usable cursor, `refreshThreadSnapshot`) and
`reconcileThreadProjection` (`getThreadDetailSnapshot`; the catch-up interval runs it while a turn is
live, and several event paths call it). Both move the fence (`threadSnapshotSequenceById`) and drop
`pendingThreadEventsById`; neither looks at `pendingDomainEvents`. The fence stops redelivery of an
event, not the flush of one already queued. `mergeReadModelMessagesWithLiveHotPath` takes the
snapshot's text when it is at least as long as the local text, then the flush appends the queued delta
to it.

Why dropping is safe: the server commits the hot projection (streamed text chunks included) and the
`projection.hot` cursor in the transaction that appends the event, and reads the detail and the cursor
in one transaction (`getThreadDetailSnapshotById`), so every thread event with
`sequence <= snapshotSequence` is in the snapshot. The patch keeps later events queued.

Reachable on Lynx without any reconnect: the catch-up read runs during every streamed turn, and a
delta is queued most of the time. Until now it was invisible because nothing rendered messages from
the store.

**Where it is fixed.** `scripts/event-router-patches.mjs`, applied by the generator to the source text
before extraction. It inserts, before each of the two `syncServerThreadDetailHotPath(X.thread,
X.snapshotSequence)` statements, a filter of `pendingDomainEvents` by thread and sequence. Guards (the
generator stops and writes nothing): not exactly two such calls in `EventRouter`; a call that is not
`(X.thread, X.snapshotSequence)` or not a statement of its own in a block; `pendingDomainEvents` not a
`let` array declared once, or nothing pushing to it; only one of the two paths already handling the
queue. If both paths reference `pendingDomainEvents` or `flushPendingDomainEvents` before the apply,
upstream has fixed it: nothing is patched and the generator says to delete the patch. A read-boundary
filter was rejected: the duplicate is in the store's text by then and cannot be told from content.

**Read path.** `app/threadPageStore.lynx.ts` (`useThreadPageData`) reads `createThreadSelector(id)`,
`createProjectSelector`, `threadDetailSyncById[id]` and `threadsHydrated`, as `ChatView.tsx` does, and
decides loading / failed with upstream's `resolveThreadDetailHydration`. `threadPageProjection.logic.ts`
holds the wiring of upstream's derivations into transcript rows (moved out of `queries.ts`, with a
per-thread markdown tree cache) and the header summary from the store's `Thread`. The result goes
through `replaceEqualDeep`, so unchanged rows stay reference-equal as they did under the query cache.

| State                              | Before (query)                             | Now (store)                                                              |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Thread never opened                | 2 requests (detail + shell), then content  | stream lease → snapshot, then content; "Loading conversation…" meanwhile |
| Thread opened earlier this session | cached rows at once, refetch               | retained detail at once (upstream retention, 15 min idle, 32 threads)    |
| Streaming                          | shell event → 50 ms → refetch whole thread | deltas at the engine's cadence (first at once, then every 100 ms)        |
| Server unreachable, nothing loaded | request error → "offline"                  | transport closed → "offline"                                             |
| Connection drops with content      | refetch error (not shown on the page)      | content stays; the transport resumes the stream from its cursor          |
| Detail stream failed               | —                                          | `threadDetailSyncById === "failed"` → "Unable to load this conversation" |
| Unknown thread id, shell hydrated  | empty page                                 | empty page                                                               |

Retention: the hook calls upstream's `retainThreadDetailSubscription` for the routed thread (upstream's
sidebar does this for the active thread). Without it `releaseOrphanedThreadDetail` frees the detail as
soon as the route leaves and reopening a thread shows the loading state first.

Still request-backed thread detail (`queries.ts`, projected, never committed): `EmbeddedSidechatPane`,
`Sidebar.lynx.tsx` and `useNativeKanbanCardActions` thread actions, `TaskCompletionToastHost`,
`EnvironmentPanel` recap.
