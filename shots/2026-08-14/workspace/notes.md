# Lynx terminal workspace

## Newly discovered scope

- Web authority routes: `/workspace` and `/workspace/$workspaceId`.
- Trigger: Settings → General → Sidebar sections → Workspace. The setting was
  already available in Lynx, but Lynx did not show the Workspace segment,
  parse either route, or render a workspace page.
- Before: a valid Workspace route silently fell through to the ordinary chat
  landing.
- After: Lynx restores the shared persisted workspace identity, renders the
  Workspace sidebar surface, creates additional workspace pages, and opens a
  real host-backed terminal rooted at the server home directory.

## Product behavior

- Workspace identity, title, ordering, deletion, and synthetic terminal scope
  reuse the shared `workspaceStore` and `workspaceThreadId`.
- The Lynx storage gate now explicitly rehydrates `useWorkspaceStore` after
  the host KV mirror is populated. Without this, the persist middleware had
  already rehydrated from an empty mirror and always showed `Workspace 1`
  instead of the Web/Lynx shared persisted page.
- Direct `/workspace` restores the first persisted workspace.
- Unknown/stale workspace IDs fall back to the first known page.
- A hidden Workspace section redirects direct links to `/` before mounting
  the terminal.
- The page supports rename, delete, terminal close/reopen, snapshot refresh,
  and canonical command submission through the existing terminal RPC port.

## Harness identity

- Shared isolated state:
  `.synara-fidelity-workspace/dev/state.sqlite`.
- Shared server: `ws://127.0.0.1:58090`.
- Viewport: `1280x820`, DPR 1, light.
- Workspace identity in both origins:
  - id: `workspace-fidelity`
  - title: `Fidelity Workspace`
  - layout preset: `single`
- Web and Lynx-for-Web were captured sequentially because the server admits
  only its configured trusted browser origin:
  - Lynx-for-Web: `http://localhost:8080`, server trusted `8080`.
  - Web authority: `http://localhost:8891`, same state directory and server
    port, then server trusted `8891`.
- The first Web dev attempt selected server port `6931`; it was stopped before
  capture. No evidence from that mismatched process was retained.

## Geometry and style evidence

- Both clients:
  - sidebar: `256x820`
  - main workspace: `1024x820`, origin `(256, 0)`
  - header: `1024x46`
  - terminal region: `1024x774`, origin `(256, 46)`
  - workspace surface: `rgb(255, 255, 255)`
- Web authority xterm viewport: `1000x704` after its 12px inner padding.
- Lynx snapshot output scroller: `1024x693`; its 44px command row remains
  visible below the output.
- Retained frames:
  - `lynx-for-web-light-1280x820.png`

## Runtime evidence

- Lynx relay reached `rendererReadyRoute:
  /workspace/workspace-fidelity`, `socketState: 1`, and zero pending requests.
- Observed RPCs included `server.getConfig` and `terminal.open`.
- Canonical terminal evidence used
  `threadId=workspace:workspace-fidelity`,
  `terminalId=default`, matching Web's shared single-pane workspace identity.
- `terminal.write` executed marker `SYNARA_WORKSPACE_1786666252`; the next
  canonical snapshot and the rendered Lynx output both contained the marker.
- A final-code rerun on `workspace:workspace-final/default` executed and
  observed `SYNARA_WORKSPACE_DEFAULT_1786666925`.
- Browser URL remained the initial query URL; memory navigation did not mutate
  the browser URL.

## Classification

- **P1 product missing coverage closed:** the optional Workspace surface was
  configurable but completely absent in Lynx.
- **P1 reliability defect closed:** shared Workspace pages did not rehydrate
  after the Lynx host storage mirror loaded.
- **Intentional platform delta:** Web uses interactive xterm; this Lynx slice
  uses the existing snapshot terminal plus command row. The PTY and lifecycle
  are real, but native terminal emulation is not claimed.
- **P2 coverage remains:** the Web settings-sheet treatment is not implemented
  in Lynx.
- **Harness loss:** the Web screenshot exporter produced a pure-white
  `1280x820` PNG (one color, zero standard deviation) while `#root` was fully
  rendered. That PNG was rejected and deleted. Web `textContent`, geometry,
  computed styles, storage, and console probes are retained as comparison
  evidence, but no Web authority screenshot pass is claimed.
- **Unrelated harness/server noise:** an empty isolated snapshot makes
  `pullRequests.list` report `Missing key at ["state"]` from sidebar polling.
  Workspace terminal RPCs and rendering remained healthy; this is not counted
  as Workspace product loss.
- **Native boundary:** the user-owned Lynxtron client remains on
  `localhost:8901`. No exact-owned Native certification is claimed.

## Loss ledger

- `lynx-workspace-route-missing`: P1 product parity,
  contribution `1.00 -> 0.00`.
- `lynx-workspace-persist-rehydrate`: P1 product reliability,
  contribution `1.00 -> 0.00`.
- `lynx-workspace-xterm-emulation`: intentional platform delta,
  contribution remains `0.25`.
- `lynx-workspace-multipane-presets`: P2 missing coverage,
  contribution `0.25 -> 0.00`.
- `workspace-web-server-port-6931`: harness mismatch,
  contribution `0.00` product loss.
- `workspace-empty-snapshot-pull-requests`: unrelated harness/server noise,
  contribution `0.00` Workspace product loss.
- `native-workspace-devtool-fixed-port`: harness blocker,
  contribution `0.00` product loss.

## Paired matrix continuation

### Fresh harness

- The old `.synara-fidelity-workspace` state had already been removed, so this
  run did not pretend to reuse it.
- New isolated state:
  `.synara-fidelity-workspace-matrix/dev/state.sqlite`.
- Shared server: `ws://127.0.0.1:59160`.
- Web authority: `http://localhost:9161`.
- Lynx-for-Web: `http://localhost:8080`.
- Workspace visibility was enabled through each renderer's real Settings
  control. No SQLite or local-storage fixture was written directly.
- Both renderers created/restored their shared default workspace identity:
  `Workspace 1`.

### Web authority capture recovered

- The previous pure-white Web exporter frame was a harness failure.
- A fresh named `agent-browser` session now retained valid Web authority
  screenshots:
  - wide `1280x820`, DPR 1, light;
  - compact `390x844`, DPR 1, light and dark.
- Web wide:
  - sidebar `256x820`;
  - title `x=276`, `y=13`, `83.73x20`;
  - xterm `x=268`, `y=94`, `1000x704`;
  - real split-right, split-down, new-tab, and settings controls.
- Web compact:
  - xterm `x=12`, `y=94`, `366x736`;
  - sidebar closed.
- This closes the previous Web screenshot harness gap. It does not by itself
  certify Lynx product parity.

### Product loss

- `lynx-terminal-active-endpoint-dropped`: P1 transport reliability,
  contribution `1.00 -> 0.00`.
- Before:
  - ordinary Lynx RPC used the active isolated endpoint `59160`;
  - terminal bridge calls omitted `baseUrl`;
  - the Web host fell back to its build/default endpoint `58090`;
  - Workspace showed `WebSocket open failed for /ws/bootstrap`, disabled the
    command input, and repeatedly retried.
- Root cause:
  - `platformTerminal.open/write/close` sent only the terminal payload.
  - Unlike `synaraRpc`, terminal bridge methods had no active endpoint.
- Fix:
  - Resolve `runtimeGetSynaraWsUrl` before terminal open/write/close.
  - Pass the same active endpoint to every terminal bridge operation.
  - Preserve fallback behavior when the host cannot report an endpoint.
- After:
  - relay `activeBaseUrl=ws://127.0.0.1:59160`;
  - `connectionAttempts=1`;
  - `lastTransportError=null`;
  - `lastRpcError=null`;
  - observed RPCs include `terminal.open`, `terminal.write`, and the follow-up
    `terminal.open` snapshot refresh;
  - rendered input is enabled;
  - the real command
    `printf 'WORKSPACE_ENDPOINT_1786689883\n'` was sent through the product
    textbox and appears in the retained terminal snapshot.

### Current paired classification

- Shared shell geometry remains aligned:
  - wide sidebar `256x820`;
  - main `1024x820`;
  - header `1024x46`.
- **Intentional platform delta remains:** Web uses xterm and exposes split/tab
  controls; Lynx uses the host-backed snapshot terminal plus command row.
- **P2 missing coverage remains:** Lynx workspace split panes, layout presets,
  drag reorder, and the Web settings sheet.
- Compact Lynx:
  - root `SliceRoot--viewport-compact`;
  - no mounted sidebar;
  - page `390x844`;
  - terminal `390x798` below the `46px` header.
- The empty isolated snapshot still produces unrelated
  `pullRequests.list Missing key at ["state"]` noise during sidebar polling.
  It is excluded from Workspace product scoring.

### Harness losses

- An attempted `server.updateSettings({showWorkspaceSection:true})` was safely
  ignored because Workspace visibility is a client setting, not a server
  settings field. The redirected frame was discarded; the real rendered
  Settings switch was used instead.
- The first Lynx switch setup clicked a zero-sized wrapper rather than the
  rendered switch. The hidden-route frame was discarded. The second setup
  clicked the exact `32x20` switch; its thumb moved from off `x=1037` to on
  `x=1049`.
- Direct bootstrap probing proved `59160 /ws/bootstrap` healthy and `58090`
  unavailable, separating endpoint drift from a server-route failure.
- Lynx console contains only the known upstream deprecated initialization
  warning after the fix.

### Verification

- `bun run test -- src/app/ThreadTerminal.lynx.test.ts src/app/WorkspacePage.lynx.test.ts src/main/web/webRelayEndpoint.logic.test.ts`
  - 3 files, 10 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- Native remains unverified. User-owned PID `77846` on port `8901` was not
  stopped or reused.
- Owned ports `59160`, `9161`, `8080`, and `5971` were released.
- Retained screenshot count under `shots/` is 39, below the 100-image limit.

### Evidence

- `shots/2026-08-14/workspace/visual-matrix/web-wide-light.png`
- `shots/2026-08-14/workspace/visual-matrix/web-compact-light.png`
- `shots/2026-08-14/workspace/visual-matrix/web-compact-dark.png`
- `shots/2026-08-14/workspace/visual-matrix/lynx-wide-light-after.png`
- `shots/2026-08-14/workspace/visual-matrix/lynx-compact-light-after.png`
- `shots/2026-08-14/workspace/visual-matrix/lynx-compact-dark-after.png`

## Split-layout continuation

### Product coverage closed

- Lynx now consumes the same persisted Workspace layout preset IDs as Web:
  Single, Two Columns, Two Rows, Top + Bottom, Left + Stack, and Quad.
- Each preset maps to stable synthetic terminal IDs:
  `default`, `workspace-2`, `workspace-3`, and `workspace-4`.
- Every visible pane is a real host-backed `ThreadTerminal`; no static pane
  fixture is rendered.
- Workspace deletion now closes and clears every terminal belonging to the
  active preset before removing the page.
- The layout control persists through the shared Workspace store.

### Paired Two Columns state

- Isolated server: `ws://127.0.0.1:59220`.
- Web authority:
  - two xterm panes;
  - each `487.5x704`;
  - pane origins `x=268` and `x=780.5`.
- Lynx:
  - grid `1024x774` below the shared `46px` header;
  - two real terminal panes;
  - each `511.5x774`;
  - pane origins `x=256` and `x=768.5`;
  - two observed `terminal.open` RPCs;
  - `connectionAttempts=1`;
  - no transport or RPC error.
- The width/inner-padding difference is the accepted xterm-versus-snapshot
  renderer delta, not a missing split-pane implementation.

### Harness noise

- A two-marker command attempt used a stale textbox ref after the first
  terminal refresh. The subsequent unscoped Enter navigated the browser
  session to `about:blank`.
- That run was discarded as automation/harness misuse. It is not reported as a
  product crash.
- Stable terminal identity is instead covered by exact preset-to-ID tests,
  distinct rendered pane geometry, two `terminal.open` RPCs, and multi-terminal
  cleanup tests.

### Verification

- `bun run test -- src/app/workspaceLayout.logic.test.ts src/app/workspaceDeletion.logic.test.ts src/app/WorkspacePage.lynx.test.ts src/app/ThreadTerminal.lynx.test.ts`
  - 4 files, 15 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- Native remains unverified. User-owned PID `77846` on port `8901` was not
  stopped or reused.
- Owned ports `59220`, `9201`, `8080`, and `5971` were released.
- Retained screenshot count under `shots/` is 46.

### Evidence

- `shots/2026-08-14/workspace/split-layout/web-two-columns-wide-light.png`
- `shots/2026-08-14/workspace/split-layout/web-two-columns-geometry.json`
- `shots/2026-08-14/workspace/split-layout/lynx-two-columns-wide-light.png`
- `shots/2026-08-14/workspace/split-layout/lynx-two-columns-runtime.json`

## Workspace ordering continuation

### Product coverage closed

- Web uses drag reorder; Lynx now exposes deterministic Move up / Move down
  controls backed by the same persisted `reorderWorkspace` operation.
- Controls are boundary-disabled for the first and last workspace.
- This is an intentional interaction delta: native buttons replace drag and
  drop while preserving ordering semantics and accessibility.

### Runtime evidence

- Isolated server: `ws://127.0.0.1:59240`.
- Three workspaces were created through the rendered New workspace action:
  `Workspace 1`, `Workspace 2`, `Workspace 3`.
- The rendered `Move Workspace 3 up` action changed the order to:
  `Workspace 1`, `Workspace 3`, `Workspace 2`.
- Reload preserved that exact order, proving shared-store persistence rather
  than transient DOM reordering.
- The first/last boundary controls rendered disabled.

### Verification

- `bun run test -- src/app/WorkspacePage.lynx.test.ts src/app/workspaceLayout.logic.test.ts`
  - 2 files, 10 tests passed.
- `bun run test -- src/workspaceStore.test.ts` in `apps/web`
  - 1 file, 6 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx production bundle and Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` and Lynx CSS warnings
    only.
- Native remains unverified. User-owned PID `77846` on port `8901` was not
  stopped or reused.
- Owned ports `59240`, `8080`, and `5971` were released.
- Retained screenshot count under `shots/` is 47.

### Evidence

- `shots/2026-08-15/workspace-order/lynx-order-after.png`
- `shots/2026-08-15/workspace-order/order-after.json`
- `shots/2026-08-15/workspace-order/order-reloaded.json`

## Workspace settings surface continuation

### Product coverage closed

- Web keeps layout presets in a dedicated right-side `Workspace settings`
  sheet rather than compressing every preset into the 46px workspace header.
- Previous Lynx exposed the same real preset mutations as six tiny horizontal
  header buttons. Functionality existed, but the settings surface, explanatory
  copy, pane counts, selected state, and compact treatment were missing.
- Lynx now exposes one `Workspace settings` header action and a real Dialog
  surface backed by the existing `setWorkspaceLayoutPreset` mutation.
- The dialog includes:
  - workspace-specific description;
  - `Layout preset` section and immediate-apply copy;
  - all six canonical `WORKSPACE_LAYOUT_PRESETS`;
  - one/two/three/four-pane counts;
  - selected preset presentation.
- The old header preset strip was removed; Terminal and Delete workspace remain
  primary header actions.

### Runtime evidence

- Reused `.synara-fidelity-workspace-order` and the real persisted
  `Workspace 1` page.
- Deterministic verification used
  `workspaceVisible=open&workspaceSettings=open`; this bypasses only the
  optional sidebar visibility gate and does not create workspace/store data.
- Wide:
  - dialog `420x311` at `(430,254.5)`;
  - `Single · 1 pane` selected;
  - all six presets rendered;
  - the real workspace terminal remained `running`.
- Compact:
  - root `390x844`;
  - dialog `366x329` at `(12,257.5)`, fully within the viewport;
  - all six presets remained visible.
- The compact runtime used the persisted light Appearance setting despite a
  dark query hint. Geometry/content are retained; no dark-theme visual claim is
  made for that frame.
- Relay settled at zero pending requests. The existing empty-snapshot
  `pullRequests.list Missing key at ["state"]` sidebar-polling noise remained
  unrelated to Workspace settings.

### Verification

- `bun run test -- src/app/WorkspacePage.lynx.test.ts src/app/workspaceLayout.logic.test.ts src/main/desktop/shellRuntime.test.ts`
  - 3 files, 24 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx and Desktop production bundles built and staged.
- Exact-owned Native remains blocked by the user-owned DevTool client.

### Evidence

- `/tmp/synara-workspace-settings2-lynx.png`
- `/tmp/synara-workspace-settings2-lynx.json`
- `/tmp/synara-workspace-settings2-lynx-compact.png`
- `/tmp/synara-workspace-settings2-lynx-compact.json`

### Loss ledger

- `lynx-workspace-settings-surface`: P2 missing coverage,
  contribution `0.25 -> 0.00`.
- `workspace-settings-first-state-missing`: harness state insufficiency,
  contribution `0.00` product loss.
