# Environment Local Servers Dynamic Refresh

## Newly discovered interaction state

The Local Servers popup remained open while a real owned dev server was added
and then removed:

1. initial: Synara Vite plus two owned Python servers;
2. add: start a third owned Python server;
3. remove: stop that same harness-owned process.

Both transitions used the rendered Refresh control with real pointer
activation. The Stop menu action was not used, so no unrelated process was at
risk.

## Initial state

- header: `3 servers running`;
- rows:
  - `Synara localhost:8891`;
  - `One Refresh Server localhost:58131`;
  - `Two Refresh Server localhost:58132`;
- popup mounted: `1`;
- pending requests: `0`.

## Add and refresh

After `Three Refresh Server` was listening on `58133`, the rendered Refresh
control was activated:

- header changed to `4 servers running`;
- the new row appeared with the correct title/address;
- popup remained mounted;
- pending requests returned to `0`.

## Remove and refresh

The harness stopped only its `58133` process, then activated Refresh again:

- header returned to `3 servers running`;
- the third owned row disappeared;
- the original two owned rows and Synara Vite remained;
- popup remained mounted;
- pending requests returned to `0`.

## Classification

- `environment-local-servers-dynamic-refresh`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

## Harness and cleanup

- final server instance:
  `f05a40b4-5834-4f73-974c-8955d5da6e07`;
- route: `/thread/thread-refresh`;
- viewport: `320x200`, DPR 1, dark;
- all Python processes were current-run owned;
- one initial attempt failed before popup interaction because the trigger was
  not yet mounted; failure cleanup passed before retry;
- all owned ports were free after exit;
- browser entry/failure/exit returned `sessions: []` with zero
  agent-browser-owned processes;
- screenshot count remained `100`.
