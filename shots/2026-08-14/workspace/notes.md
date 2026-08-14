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
- **P2 coverage remains:** workspace layout presets, split panes, drag reorder,
  and the Web settings sheet are not yet implemented in Lynx.
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
  contribution remains `0.25`.
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
