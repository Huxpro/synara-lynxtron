# Native Cmd+R Reload

## Root cause

The View menu used Electron roles:

- `{ role: 'reload' }`;
- `{ role: 'forceReload' }`.

Lynxtron renders those role labels but has no webContents reload target.
`LynxWindow` exposes `loadFile`, `loadURL`, and `loadBundle`, so the role was a
visible no-op.

## Fix

- Replace the no-op roles with explicit menu items:
  - Reload: `CmdOrCtrl+R`;
  - Force Reload: `CmdOrCtrl+Shift+R`.
- Both invoke the same `reloadLynxWindow` bundle-load path.
- Mirror the complete memory-history `href` to the host so query-driven
  Editor/Explorer state survives reload.
- Reset route delivery before loading and redeliver the mirrored route when
  the renderer becomes ready.
- Reuse the existing window and server process; no new app instance is
  created.
- Record `renderer reload requested route=...` in the desktop host log.

## Exact Native result

- bundle SHA-256:
  `821b965111e60d8f16eeeede0ac93ccf0b1207659560c1a431e142b3c371b1fd`;
- exact-owned Native PID: `87471`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- real foreground `Cmd+R` produced a new host-log entry:
  `renderer reload requested route=/`;
- PID remained `87471`;
- the existing `58090` connection remained `ESTABLISHED`;
- `SliceRoot` remounted successfully;
- fresh post-reload warning/error console was empty.

The first PID-targeted and unfocused keyboard probes were rejected as input
harness failures. The retained result activated only the exact-owned Synara
process and sent the real global accelerator.

## Verification

- Focused tests: `3 files / 19 tests`.
- Native/Desktop production build: passed with existing registered warnings.
- No screenshot was retained; repository screenshot count remained `100`.
- Entry/failure/exit browser gates returned `sessions: []` and zero
  agent-browser-owned processes.
- The user-preview server and final Lynxtron app remain running for hands-on
  use.
