# Environment Stale Local Server Stop Recovery

## Newly discovered failure state

The Local Servers popup initially showed Synara Vite and one harness-owned
Python server titled `Stale Stop Server`.

After the popup rendered, the harness stopped its Python process directly,
leaving a deliberately stale row in the still-open UI. The stale row's rendered
Stop control then received a real pointer activation.

## Recovery result

- the server returned the normal stale-target result rather than signaling any
  other PID;
- `server.stopLocalServer` completed without an RPC error;
- the follow-up `server.listLocalServers` refresh removed the stale row;
- header became `1 server running`;
- Synara Vite remained;
- popup mount count remained `1`;
- pending requests returned to `0`;
- page, transport, and RPC errors were empty.

## Classification

- `environment-local-server-stale-stop-recovery`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

This specifically proves the PID/port revalidation boundary: a stale UI row
cannot stop a replacement or unrelated process.

## Cleanup

- only the current-run-owned Python process was stopped before interaction;
- its port `58151` was free at exit;
- isolated Synara state/processes were removed;
- browser entry/exit returned `sessions: []` with zero agent-browser-owned
  processes.
