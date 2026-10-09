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

## Dark 1440 continuation

The Native-only Update matrix now includes a valid dark `1440x900` cell.

Preflight initially used the obsolete flat window-state shape. Lynxtron
rejected it, rewrote the default `1280x820` bounds, and rendered dark at the
wrong size. That cell was invalidated as harness mismatch before product
classification.

The retry used the current persisted schema:

`{"version":1,"bounds":{"x":80,"y":80,"width":1440,"height":900},...}`

Final identity:

- root: `1440x900`, `SliceRoot--theme-dark`;
- route page: `(256,0,1184x900)`;
- centered card: `(568,240,560x420)`;
- title: `(750,363,197x30)`;
- description: `(631,401,435x26)`;
- version panel: `(603,451,490x90)`;
- status: `(782,559,133x12)`.

Dark tokens:

- card `rgb(19,19,19)`;
- title/status `rgb(252,252,252)`;
- description `rgba(252,252,252,0.576471)`;
- version panel `rgba(252,252,252,0.00392157)`.

The live result remained Installed `v0.5.5-lynx.0`, Latest `v0.7.2`, and
`A newer release is available.` Exact-client warning/error console was empty.

`native-update-available-dark-1440`: missing coverage
`1.00 -> 0.00`; product-loss contribution remains `0.00 -> 0.00`.

Remaining Update scope is network-error retry and external-download handoff.

## Network-error retry continuation

The Native-only Update matrix now includes a real host-fetch failure followed
by a successful retry in the same exact-owned process.

The failure was injected only into the owned Lynxtron host with a temporary
`NODE_OPTIONS --require` shim under `/tmp`. It intercepted exactly the first
fetch to the canonical GitHub latest-release API, rejected it with
`Synthetic update network offline`, then delegated all subsequent fetches to
the original runtime implementation. It did not modify product code, global
network settings, DNS, system proxy state, or another process.

The injection log proved the host path:

- first automatic check: `FAIL https://api.github.com/repos/Emanuele-web04/synara/releases/latest`;
- real Retry check: `PASS https://api.github.com/repos/Emanuele-web04/synara/releases/latest`.

After the automatic failure, Native rendered:

- `Could not check releases · Synthetic update network offline`;
- enabled `Check for updates`;
- `Open download page`.

A real touch on `Check for updates` at `(689,512)` retried through the same
host bridge. The result recovered to:

- Installed `v0.5.5-lynx.0`;
- Latest release `v0.7.2`;
- `A newer release is available.`;
- enabled `Check for updates`;
- no stale synthetic error text.

Recovered geometry remained identical to the valid light `1280x820` cell:

- page `(256,0,1024x820)`;
- card `(488,200,560x420)`;
- version panel `(523,411,490x90)`;
- status `(702,519,133x12)`;
- actions `(623,553,290x32)`.

Exact-client warning/error console remained empty.

- `native-update-network-error-retry`: missing coverage `1.00 -> 0.00`.
- Component product-loss contribution remained `0.00 -> 0.00`.
- Focused Update tests passed `2` files / `5` tests.
- Native/Desktop production build passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Validated bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- The owned Native/server processes, temporary fetch shim, isolated
  state/runtime/user directories, and diagnostic proxy files were removed.
  Ports `58090`, `8891`, `8901`, and `58888` were free. Browser cleanup ended
  at `sessions: []` with zero agent-browser-owned processes.
- No screenshot was retained; local screenshot count remained `100`.

The only remaining Update scope is the external-download handoff. It still has
an external browser side effect and requires an explicitly owned handoff
harness rather than being inferred from the rendered button.

## Invalid external-download handoff attempt

An attempted owned handoff harness did not satisfy that requirement and is
explicitly rejected as evidence.

The run used a temporary `NODE_OPTIONS --require` shim intended to wrap
`@lynx-js/lynxtron`'s `shell.openExternal`, capture the URL under `/tmp`, and
return success without opening a user browser. A standalone module-loader probe
proved the shim's intended contract, but the real Lynxtron host did not load the
module through that intercepted CommonJS path.

A real touch on `Open download page` therefore produced:

- host call `bridge.updaterOpenDownload`;
- no owned capture log;
- no proof that `shell.openExternal` was intercepted.

Because the product host call occurred without the required capture artifact,
the cell is a harness isolation failure. It is not counted as a product pass,
product loss, or closed coverage. It may have caused one real external-browser
handoff side effect, so the interaction was not repeated.

The owned Native/server processes, shim, runtime, user data, and state were
removed. Ports `58090`, `8891`, and `8901` were free, browser state ended at
`sessions: []` with zero owned processes, and screenshot count remained `100`.
Before commit, port `8901` was later occupied by an unrelated
`/Users/bytedance/github/another-project-archaeology-verify3` verification process
(PID `44768`) that started after this loop's cleanup. It was not terminated and
is external port competition, not a Synara-owned leak.

`native-update-external-download-handoff` remains missing coverage `1.00`.
Future verification needs a host-level injectable `openExternal` dependency or
an owned OS/browser protocol handler; a render-only button check is still
insufficient.

## Captured external-download handoff

The host now provides the missing opt-in capture boundary:

`SYNARA_UPDATE_OPEN_EXTERNAL_CAPTURE=/path/to/capture.jsonl`

When unset, production behavior is unchanged and still delegates to
`shell.openExternal`. When explicitly set by an owned verification run, the
host appends `{"url":...}` to the requested file and returns the same successful
bridge result without opening a user browser.

Focused tests prove both branches:

- capture mode writes the exact URL and does not call the platform handoff;
- default mode calls the supplied external opener.

The first focused run failed because Rstest does not expose the imported `vi`
mock helper in this configuration. The test was rewritten with a plain call
recorder; that was test-harness API misuse, not a product defect. Final Update
focused suites passed `3` files / `7` tests.

An exact-owned Native run then set the capture env to a temporary JSONL path.
After the automatic release check settled to Latest `v0.7.2`, a real touch on
`Open download page` at `(838.5,569)` produced exactly one retained record:

`{"url":"https://github.com/Emanuele-web04/synara/releases/latest"}`

The Update page remained in the available state, no
`Could not open download page` error appeared, exact-client warning/error
console stayed empty, and agent-browser remained at `sessions: []`.

- `native-update-external-download-handoff`: missing coverage
  `1.00 -> 0.00`.
- Component product-loss contribution remained `0.00 -> 0.00`; the code change
  is a verification/safety boundary with unchanged default product behavior.
- Native/Desktop production build passed with only registered unsupported-CSS
  and optional WebSocket acceleration warnings.
- Bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- React Doctor `0.9.12` scanned all three changed Lynx source/test files,
  including the new helper and tests, with zero errors and zero warnings.
- Final lifecycle cleanup stopped the exact-owned Native PID `84442` and its
  isolated server, removed the capture file plus all temporary state/runtime
  and user-data paths, and left owned ports `58090` and `8891` free.
- The loop's agent-browser entry gate had passed before verification. Its
  explicit exit gate used
  `bun run browser:run -- agent-browser session list --json` and returned
  `sessions: []`; `bun run browser:cleanup` separately reported zero
  agent-browser-owned processes. No browser screenshot was retained, and the
  local screenshot count remained `100`.

This closes the last explicitly tracked Update scope.

## Up-to-date continuation

The Native-only Update matrix now also covers a successful release response
whose version exactly matches the installed app.

An owned-process-only temporary fetch shim returned canonical GitHub release
JSON with tag `v0.5.5-lynx.0`, matching the installed
`v0.5.5-lynx.0`. It recorded each target fetch under `/tmp` and did not modify
product code or global network configuration.

The automatic check rendered:

- Installed `v0.5.5-lynx.0`;
- Latest release `v0.5.5-lynx.0`;
- `You are up to date.`;
- enabled `Check for updates`;
- `Open download page`.

A real touch on `Check for updates` performed a second owned host fetch. The
capture log contained exactly two canonical release-API calls, and the UI
remained in the same complete up-to-date state without transient or stale error
text. Exact-client warning/error console remained empty.

- `native-update-up-to-date-retry`: missing coverage `1.00 -> 0.00`.
- Component product-loss contribution remained `0.00 -> 0.00`.
- The same current HEAD and byte-identical bundle had just passed focused
  Update tests `2` files / `5` tests and the Native/Desktop production build in
  the preceding network-error slice.
- Validated bundle SHA-256:
  `652f681314935d4a6c4e1a7e94c8a006dfec5546d6a638b50e0d7f86330f685c`.
- The owned Native/server processes, fetch shim, and isolated
  state/runtime/user directories were removed. Ports `58090`, `8891`, and
  `8901` were free; browser cleanup ended at `sessions: []` with zero owned
  processes.
  Before commit, port `8901` was later occupied by an unrelated
  `/Users/bytedance/github/another-project-archaeology-verify3` verification process
  (PID `73718`) started after this loop's cleanup. It was not terminated and is
  external contention, not a Synara leak.
- No screenshot was retained; local screenshot count remained `100`.

The external-download handoff remains the only open Update scope.
