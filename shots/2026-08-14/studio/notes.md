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
- `lynx-web-pointer-to-bindtap`: upstream Web Core P1 blocker,
  contribution remains `1.00`.
- `native-studio-devtool-fixed-port`: harness blocker,
  contribution remains `0.00` product loss.
