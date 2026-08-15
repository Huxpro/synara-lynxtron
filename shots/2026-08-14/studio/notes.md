# Lynx Studio route

## Newly discovered scope

- Web authority route: `/studio`.
- Lynx before: the route parsed successfully but fell through to the ordinary
  Home landing and could only create a normal chat.
- Lynx after: `/studio` has a dedicated restore-or-create controller. It
  restores a remembered active Studio thread, falls back to the latest active
  Studio thread using the configured sidebar sort order, or opens a composer
  fixed to the hidden Studio container.
- A hidden Studio section redirects to `/` before restore or creation begins.

## Product behavior

- Studio project creation uses canonical `project.create` with:
  - `kind: studio`
  - the server-provided `studioWorkspaceRoot`
  - `createWorkspaceRootIfMissing: true`
- The Studio composer does not render the ordinary project picker.
- Its first successful send continues through the existing canonical
  `thread.create` path.
- The outer provider-health bootstrap and the inner composer share the same
  `containerKind` query key. An intermediate implementation used the ordinary
  chat bootstrap outside the Studio composer and incorrectly created both
  `Home` and `Studio`; a clean-snapshot rerun caught and closed that defect.

## Runtime evidence

- Lynx-for-Web route:
  `http://localhost:8080/web-host?route=/studio&run=2`.
- Isolated server: `ws://127.0.0.1:58090`.
- Isolated state:
  `.synara-fidelity-studio-2/dev/state.sqlite`.
- Viewport: `1280x820`, DPR 1.
- Stable relay diagnostics:
  - `rendererReadyRoute: /studio`
  - `socketState: 1`
  - `pendingRequests: 0`
  - `lastTransportError: null`
  - `lastRpcError: null`
- Observed canonical RPCs include:
  - `server.getConfig`
  - `server.refreshProviders`
  - `orchestration.getSidebarShellSnapshot`
  - `orchestration.dispatchCommand`
  - `provider.listModels`
- Clean-snapshot database projection contained exactly one project:
  `kind=studio`, title `Studio`, workspace
  `/Users/bytedance/Documents/Synara/Studio`. It contained no Home project and
  no thread before first send.
- Rendered Studio state contained the Studio surface, empty-state composer,
  runtime/model controls, and no ordinary project-picker actions.
- Browser URL remained the initial query URL; the memory router did not rewrite
  browser history while resolving Studio.

## Restore evidence boundary

- Focused resolver tests cover remembered Studio, rejection of remembered
  non-Studio threads, latest active Studio fallback, archived exclusion, and
  the new-composer fallback.
- A canonical RPC-created Studio thread caused `/studio` to resolve into the
  `ThreadPage` path.
- That synthetic persisted empty thread remained on the thread loading state,
  because it does not reproduce Web's local draft lifecycle. It is retained as
  a fixture limitation, not claimed as an end-to-end restored conversation
  pass.

## Harness classification

- The first live run failed WebSocket upgrade because the isolated server
  trusted the dev-runner-derived origin `http://localhost:8891`, while
  Lynx-for-Web ran at `http://localhost:8080`.
- The mismatch was proven independently:
  - `Origin: http://localhost:8080` returned HTTP 403.
  - `Origin: http://localhost:8891` returned HTTP 101.
- Restarting only the owned isolated server with
  `--dev-url http://localhost:8080/` fixed the harness. This is not counted as
  product loss.
- The agent-browser screenshot command reported the requested `/tmp` path but
  stored the PNG under its daemon temp directory. The image was `1280x820`,
  but the path mismatch is retained as capture-harness noise.
- Native exact-client certification remains blocked by the user-owned
  Lynxtron client on `localhost:8901`; no Native pass is claimed.

## Loss ledger

- `lynx-studio-route-falls-through-home`: P1 product parity,
  contribution `1.00 -> 0.00`.
- `lynx-studio-bootstrap-creates-home-container`: P1 product correctness,
  contribution `1.00 -> 0.00`.
- `studio-web-origin-mismatch`: harness loss,
  contribution `0.00` product loss.
- `studio-persisted-empty-thread-fixture`: verification limitation,
  contribution `0.00` product loss.
- `lynx-web-pointer-to-bindtap`: historical ReactLynx/Web Core dynamic-event
  P1 coverage, contribution `1.00 -> 0.00` globally. Studio folder/dialog
  controls still require route-specific current-head interaction coverage.
- `native-studio-devtool-fixed-port`: harness blocker,
  contribution remains `0.00` product loss.

## Paired visual continuation

### Comparable harness

- Reused the isolated state created for the project-scoped new-thread matrix:
  `.synara-fidelity-new-thread-visual/dev/state.sqlite`.
- Shared server: `ws://127.0.0.1:59140`.
- Web authority trusted origin: `http://localhost:9141`.
- Lynx-for-Web trusted origin: `http://localhost:8080`.
- The server was restarted only to switch trusted origin; both renderers used
  the same persisted snapshot.
- Web `/studio` created/reused its draft through the real
  `RestoreOrCreateChatRoute` flow and settled at draft route
  `c4408d06-b53b-4899-9a8c-18fdfb651844`.

### Baseline parity

- Both renderers show:
  - `New Chat`;
  - `What should we work on?`;
  - `Full access`;
  - `GPT-5.5`;
  - the Studio sidebar surface.
- Web wide heading:
  `x=607.81`, `y=407.25`, `320.36x34.5`.
- Lynx wide heading:
  `x=607.5`, `y=426`, `321x35`.
- The `18.75px` vertical offset is retained as a visible composition residual,
  not promoted to P0/P1 because the screen remains fully usable and its
  semantic hierarchy matches.

### Product loss

- `lynx-studio-folder-picker-missing`: P1 interaction parity,
  contribution `1.00 -> 0.00`.
- Before:
  - Web rendered `Use a folder` at `x=408`, `y=560.75`, `97.44x28`.
  - Lynx hid the entire landing tray whenever
    `containerKind === 'studio'`.
- Root cause:
  - Lynx already loaded the local folder catalog and already owned the shared
    project/folder picker, but the Studio branch returned `null` instead of
    rendering it.
- Fix:
  - Reuse the shared picker with Studio copy:
    `Use a folder`, `Choose a folder`, `Don't use a folder`, and
    `Search folders`.
  - Keep Studio folder state separate from ordinary project selection.
  - A picked folder changes only the composer workspace and the eventual
    thread `worktreePath`.
  - The hidden Studio project remains the `thread.create.projectId`; no
    ordinary `project.create` is dispatched for a Studio folder choice.
  - Resetting returns to the Studio root.
- After:
  - Lynx renders `Use a folder` at
    `x=408`, `y=560`, `97.44x28`, matching Web's control width and horizontal
    position.
  - Compact `390x844` uses the compact root, no mounted sidebar, a
    `366x133` composer, and the folder control remains visible.

### Interaction and harness boundary

- `agent-browser` can access the Studio textarea but Lynx Web Core still does
  not expose the `bindtap` folder trigger/menu in its accessibility tree.
- A rendered custom-element `.click()` was used only to attempt visual-state
  setup. The menu could not be observed through the Web Core shadow boundary,
  so no pointer/menu interaction pass is claimed.
- The folder selection contract is covered by pure tests and source wiring,
  while real Native folder dialog behavior remains unverified.
- This older cell remains route-specific missing interaction coverage, not a
  reopened product loss. The later global dynamic-event closure does not prove
  the Native folder dialog or retroactively convert this sample into a click
  pass.
- The initial Web Studio capture occurred before route hydration and was
  discarded.
- Web console contains only Vite/React development messages.
- Lynx console contains only the known upstream deprecated initialization
  warning.

### Verification

- `bun run test -- src/components/composer/landingStudioFolder.logic.test.ts src/components/composer/landingComposerFidelity.test.ts src/components/composer/landingThreadCreation.logic.test.ts`
  - 3 files, 8 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- Native remains unverified. User-owned PID `77846` on port `8901` was not
  stopped or reused.
- Owned ports `59140`, `9141`, `8080`, and `5971` were released.
- Retained screenshot count under `shots/` is 33, below the 100-image limit.

### Evidence

- `shots/2026-08-14/studio/visual-matrix/web-wide-light.png`
- `shots/2026-08-14/studio/visual-matrix/web-compact-light.png`
- `shots/2026-08-14/studio/visual-matrix/web-compact-dark.png`
- `shots/2026-08-14/studio/visual-matrix/lynx-wide-light-before.png`
- `shots/2026-08-14/studio/visual-matrix/lynx-wide-light-after.png`
- `shots/2026-08-14/studio/visual-matrix/lynx-compact-dark-after.png`
