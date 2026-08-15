# Native Workspace current-head verification

## Authority and discovered loss

The existing synchronized Web authority and Lynx-for-Web Workspace evidence is
under `shots/2026-08-14/workspace/`. It already covers wide/compact layouts,
real terminal transport, split presets, ordering, and the settings surface, but
explicitly leaves exact-owned Native unverified.

This continuation found a P1 Native reachability loss:

- `workspaceVisible=open` and `workspaceSettings=open` were parsed into init
  data;
- `synara://workspace` itself still mapped to `/`;
- a standard Native cold start therefore showed the ordinary landing instead
  of Workspace.

The shell now maps:

- `synara://workspace` -> `/workspace`;
- `synara://workspace/<id>` -> `/workspace/<id>`.

Focused tests also lock the combined route plus Workspace init-data contract.

`native-workspace-deep-link-reachability`: P1 contribution
`1.00 -> 0.00`.

## Exact-owned identity

- Fresh canonical state: `.synara-fidelity-workspace-native`
- Isolated server/Web: `127.0.0.1:58090` / `[::1]:8891`
- Temporary diagnostic host: `@lynx-js/lynxtron@0.0.9-dev`
- Native root/app PIDs: `18467` / `18474`
- PID-derived DevTool client: `localhost:8901`, session `1`
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`
- Startup:
  `synara://workspace?workspaceVisible=open&workspaceSettings=open`
- Viewport/theme: `1280x820`, light
- Output/staged bundle SHA-256:
  `99838ab25d7b11e67e67c98dc643e4de163b6f48d88aa6afbfc69c158c92fe7a`

The standard cold-start route mounted `WorkspacePage`, restored the shared
default `Workspace 1`, opened its settings dialog, and executed a real
`terminalOpen`:

- thread: `workspace:59fdf173-2329-4577-9d37-a101d3bdf953`;
- terminal: `default`;
- cwd: `/Users/bytedance`;
- endpoint: `ws://127.0.0.1:58090`;
- status: `running`.

## Geometry and interactions

Initial single-pane geometry:

- page/header: `(256,0,1024x820)` / `(256,0,1024x46)`;
- terminal grid/pane: `(256,46,1024x774)`;
- output scroller: `(256,82,1024x693)`;
- command row: `(256,775,1024x45)`;
- command input control/native input:
  `(270,782,943x32)` / `(281,789,921x18)`;
- settings dialog: `(430,262,420x296)`.

The settings dialog exposed all six shared presets. A real rendered-control
touch selected `Two Columns`:

- selected button changed to the secondary state;
- shared Workspace KV persisted `layoutPresetId:"two-columns"`;
- the host opened real second terminal `workspace-2` against the same isolated
  endpoint;
- two Native terminal panes mounted at `(256,46,512x774)` and
  `(769,46,512x774)`;
- closing the dialog left the two-column grid and both panes mounted.

The exact-client warning/error console stayed empty.

## Boundaries

Desktop Lynx DevTool exposes pointer/touch CDP but no supported Native keyboard
text-injection method. This run therefore does not claim a terminal marker
write through the Native command input. The input is rendered, enabled, and
the real PTY open/preset lifecycle is certified; Native typing/confirm remains
missing interaction coverage.

Web uses xterm while Native uses the host-backed snapshot terminal plus command
row. That remains an intentional platform delta, not product loss.

## Verification and cleanup

- Focused shell/Workspace/terminal tests: `3` files, `21/21` passed.
- Native/Desktop production build: passed.
- Existing build warnings only: unsupported encoded CSS and optional
  `bufferutil` / `utf-8-validate`.
- Output/staged hashes: identical.
- Exact-owned ports `58090`, `8891`, and `8901`: released.
- Runtime, user data, server state, and probe files: removed.
- Browser lifecycle exit gate: `sessions: []`, zero owned processes.
- Screenshot count remains `100`; no screenshot was added.

No additional P0/P1/P2 product loss was found. Remaining Native Workspace scope
includes command typing/confirm, terminal close/reopen confirmation, rename,
new workspace, ordering, deletion cleanup, dark, compact, and `1440x900`.

## Native lifecycle continuation

A second fresh exact-owned run extended coverage through the complete temporary
workspace lifecycle:

1. `New workspace` at `(128,104)` created and activated `Workspace 2`.
2. `Move Workspace 2 up` at `(192,199.5)` reordered the sidebar to
   `Workspace 2`, `Workspace 1`.
3. The shared KV persisted the same order with stable IDs and timestamps.
4. `Delete workspace` at `(1214.5,23.5)` removed the active temporary page.
5. The host sent `terminalClose` for Workspace 2's `default` terminal with
   `deleteHistory:true` against `ws://127.0.0.1:58090`.
6. The UI and KV returned to exactly one active `Workspace 1`.

The temporary terminal had no command history, so cleanup correctly required
`terminalClose` but no preceding `exit` write. Exact-client warning/error
console stayed empty.

`native-workspace-create-reorder-delete`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

This closes Native creation, ordering, deletion, persistence, active fallback,
and PTY cleanup for the single-pane case. Rename, command typing/confirm,
close/reopen confirmation, multi-pane deletion, theme/size axes, and restart
persistence remain open.

## Native terminal close/reopen continuation

A third fresh exact-owned run exercised the default terminal lifecycle through
rendered controls:

1. the Workspace cold start opened `default` against
   `ws://127.0.0.1:58090`;
2. real `Close` at `(1248,64)` sent `terminalClose` with
   `deleteHistory:true`;
3. `ThreadTerminal` unmounted and the page rendered
   `This workspace has no open terminals`;
4. real `New terminal` at `(768.5,471.5)` remounted the terminal;
5. the host sent a new `terminalOpen` for the same workspace/default identity;
6. the rebuilt surface rendered `Terminal ready.` and a `ready` status.

The host call sequence was exactly:

`terminalOpen -> terminalClose(deleteHistory:true) -> terminalOpen`

All calls used the isolated runtime endpoint. Exact-client warning/error
console stayed empty.

`native-workspace-terminal-close-reopen`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

Close/reopen without history is now covered. Confirmation-enabled close, a
terminal with command history, Native command typing, and restart persistence
remain open.
