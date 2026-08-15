# Native Update current-head verification

## Classification and authority

`/update` is a Lynxtron-only application-update surface. The Web client has no
equivalent route, so the missing Web cell is an intentional platform delta,
not a parity failure. This loop closes current-head exact-owned Native coverage
for automatic update checking and manual retry.

The update result is environment-dependent. During the retained run, the real
GitHub release endpoint returned HTTP `200` with:

- tag: `v0.7.2`;
- name: `Synara v0.7.2`;
- published: `2026-08-14T23:34:32Z`;
- draft: `false`.

## Exact-owned identity

- Isolated server: `127.0.0.1:58090`
- Isolated Web process owned by the same dev runner: `[::1]:8891`
- Temporary diagnostic host: `@lynx-js/lynxtron@0.0.9-dev`
- Native launch root/app PIDs: `43535` / `43540`
- PID-derived DevTool client: `localhost:8901`, session `1`
- Session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`
- Startup route: `synara://update`
- Viewport/theme: `1280x820`, light
- Validated staged bundle SHA-256:
  `9a4c9e86517a985423e80d4d8bade37d807ed460251dc2096251f0510fb655da`

The final production rebuild generated SHA-256
`d2acf9801749b6b6d63503aa530293f6f205c2273b104de7eb9565756a8d11eb`
for both `output/bundle/lynx/main.lynx.bundle` and
`dist/desktop/main.lynx.bundle`. No source changed between the validated run
and rebuild; the two final artifacts are byte-identical to each other.

## Product evidence

The automatic product-path `updaterCheck` settled to a complete result:

- Installed: `v0.5.5-lynx.0`
- Latest release: `v0.7.2`
- Status: `A newer release is available.`
- Check action restored to `Check for updates`
- Secondary action: `Open download page`

Geometry:

- route page: `(256,0,1024x820)`;
- centered card: `(488,200,560x420)`;
- update mark: `(743,235,50x50)`;
- title: `(670,323,197x30)`;
- description: `(551,361,435x26)`;
- version panel: `(523,411,490x90)`;
- Installed/Latest rows: `460x36`;
- status: `(702,519,133x12)`;
- actions: `(623,553,290x32)`;
- Check/Open buttons: `132x32` and `149x32`.

Resolved light tokens included:

- card `rgb(255,255,255)`;
- mark/button `rgb(13,13,13)`;
- title `25px/700 rgb(13,13,13)`;
- description `11px rgba(13,13,13,0.596078)`;
- version labels `10px rgba(13,13,13,0.596078)`;
- version values `10px/600 rgb(13,13,13)`;
- version panel `rgba(13,13,13,0.0392157)`.

A real rendered-control touch on `Check for updates` issued a second
`updaterCheck`, returned to the same complete result, and restored the enabled
button label. The exact-client warning/error console stayed empty.

`Open download page` was deliberately not activated because it calls
`shell.openExternal` and would create an external browser side effect. Its
rendered control and label are covered here; actual external navigation remains
unverified.

## Harness boundaries

- Desktop LynxView does not implement `Accessibility.getFullAXTree`; this is a
  harness API mismatch, not product loss.
- One zsh PID-list probe did not split newline-delimited PIDs. A Bash-array
  retry resolved the same already-running owned process without changing
  product state.
- No screenshot was added because the local repository remains at the
  100-image cap. Geometry, styles, DOM, host calls, console, process identity,
  and external release authority provide the retained evidence for this cell.

## Verification and loss

- Focused Update suites: `2` files, `5/5` tests passed.
- Native/Desktop production build: passed.
- Existing build warnings only: unsupported encoded CSS properties and
  optional `bufferutil` / `utf-8-validate`.
- Output/staged bundle hash equality: passed.
- Exact-owned ports `58090`, `8891`, and `8901`: released.
- Temporary runtime, user state, and server state: removed.
- Browser lifecycle exit gate: `sessions: []`, zero owned processes.
- Screenshot count: `100`.

`native-update-available-retry-light-1280`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

No new P0/P1/P2 product loss was found. Remaining Update scope includes dark,
`1440x900`, network-error retry, and external-download handoff.
