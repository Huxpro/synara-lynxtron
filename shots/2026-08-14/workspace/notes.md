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
