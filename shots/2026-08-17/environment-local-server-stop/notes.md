# Environment Owned Local Server Stop

## Newly discovered interaction state

The Local Servers popup contained:

- Synara Vite at `localhost:8891`;
- one harness-owned Python server titled `Owned Stop Server` at
  `localhost:58141`.

The Stop control inside the owned server row was activated with a real pointer.
No other Stop control was used.

## Before

- rows: `2`;
- owned row:
  `Owned Stop Server localhost:58141`;
- Synara Vite row remained present.

## Real Stop result

- the exact harness-owned PID exited;
- port `58141` was released;
- owned row disappeared;
- header changed to `1 server running`;
- Synara Vite remained;
- popup mount count stayed `1`;
- pending requests returned to `0`;
- page errors: none.

## Classification

- `environment-local-server-owned-stop`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

The evidence is intentionally limited to a current-run-owned process. It does
not authorize or claim stopping unrelated user services.

## Cleanup

- only the owned Python PID and isolated Synara process were terminated;
- browser entry/exit returned `sessions: []` with zero agent-browser-owned
  processes;
- owned port was free after exit;
- screenshot count remained `100`.
