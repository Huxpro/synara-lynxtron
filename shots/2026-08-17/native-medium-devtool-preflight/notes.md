# Native Medium DevTool Preflight

## Objective

Refresh the stale Native compact-header boundary against current host code and
the final staged production bundle.

## Updated window-size boundary

The old compact preflight attempted `320x568` and observed a default
`1280x820` host window. Current host source now clamps restored bounds to a
minimum of `900x650`.

This run prewrote an exact isolated state:

```json
{"version":1,"bounds":{"x":220,"y":120,"width":900,"height":650},"maximized":false,"fullscreen":false}
```

The exact-owned Native app loaded and retained those bytes. Its bridge issued
`windowGetViewport`, hydrated storage, connected to the isolated server, and
completed shell/sidebar RPC bootstrap.

Therefore:

- `320px` Native compact certification remains impossible under the current
  host minimum;
- `900x650` medium Native certification is now a valid host target;
- the older statement that this host always normalizes to `1280x820` is stale.

## Exact-owned identity

- staged bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- SHA-256:
  `5102ed2b0cfe0c689b994191d64316f41ab28e87714dcb25d59251bcbd73358c`;
- production app PID:
  `46025`;
- Lynxtron launcher PID:
  `46018`;
- isolated server PID:
  `45935`;
- isolated user data:
  `/tmp/synara-native-medium-user`;
- isolated server state:
  `/tmp/synara-native-medium-home`;
- environment confirmed on the app process:
  `NODE_ENV=production`,
  `SYNARA_ENABLE_DEVTOOL=1`,
  `SYNARA_BACKGROUND_LAUNCH=1`,
  `SYNARA_ALLOW_PARALLEL_INSTANCE=1`,
  and the exact isolated user-data/server endpoint.

## Harness failure

The app remained healthy for more than one minute, but:

- its PID exposed no DevTool TCP listener;
- `list-clients` continued to show only unrelated `8901` t3code and `8902`
  iOS Explorer clients;
- no `@synara/lynx` client or session appeared;
- the app log contained
  `LynxViewStateObserver not found in registry`.

Without a PID-derived client, the run could not verify the session URL, root
theme/viewport class, DOM, console, or screenshot. No Native product pass or
loss is claimed.

`native-medium-devtool-registration`: harness missing coverage remains `1.00`.

## Rejected attempts

- The first shell probe used a zsh glob with no matches and failed before
  launch.
- The first real launch exited its controlling shell when an empty DevTool-port
  pipeline tripped `pipefail`; owned processes exited and no client appeared.
- The second launch used a tolerant 30-second port poll and kept the app alive,
  proving the missing client was not an early-exit artifact.

## Cleanup

- The exact-owned process group was interrupted and audited.
- Any owned server child was removed by exact PID/ancestry.
- Port `58090` was released.
- No `8903`/`8904` client appeared.
- Unrelated `8901` and `8902` clients were not touched.
- Browser cleanup returned `sessions: []` and zero agent-browser-owned
  processes.
- No screenshot was retained; local count remained `100`.
