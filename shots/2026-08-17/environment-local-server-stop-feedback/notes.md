# Environment Local Server Stop Failure Feedback

## Newly discovered failure state

A current-run-owned Node HTTP server ignored `SIGTERM` while remaining
discoverable as `Resistant Stop Server` at `localhost:58161`.

The rendered Stop control received a real pointer activation.

## P1 product loss

The server correctly returned:

`Stop signal sent; the process is still shutting down.`

Before the fix, Environment discarded the complete
`ServerStopLocalServerResult`. After the request/refetch settled:

- the resistant row remained;
- the Stop button became enabled again;
- no feedback or alert explained why the server was still present.

`lynx-environment-local-server-stop-feedback-missing`: P1 contribution
`1.00 -> 0.00`.

## Root fix

- Environment keeps local stop feedback state.
- A `stopped:false` result displays the server-provided message.
- Transport/RPC failure displays stable fallback copy:
  `Couldn’t stop local server.`
- Successful stop clears prior feedback.
- Feedback is exposed with `accessibility-role="alert"`.
- The popup remains open and the list still refetches.

## Final runtime evidence

After the real Stop interaction settled:

- feedback:
  `Stop signal sent; the process is still shutting down.`;
- accessibility role: `alert`;
- resistant process remained alive, as intended by the fixture;
- resistant row remained;
- popup:
  `height=184`, bottom `200`;
- pending requests: `0`;
- transport and RPC errors: none;
- page errors: none.

The resistant process was force-stopped only by the harness cleanup after
evidence collection.

## Validation

- Focused Environment Rstest: `8/8` passed.
- Web production build passed with `8953` transformed modules.
- Web main SHA-256:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`.
- Lynx-for-Web production build:
  `4592.6 kB`,
  SHA-256
  `dffa2d597783c00b733c4a23adc20784435d4d99e0f477d5fee3dedeb505bb3e`.
- Native/Desktop production build:
  `4297.2 kB`,
  SHA-256
  `c9f629076689473155ce0c5e5f244d0e2d9e8d38c210ada5079644823ebcbd56`.

## Harness cleanup classification

- One settled-state attempt used global pending-request exhaustion and was
  interrupted when local server scanning remained active.
- The browser wrapper returned to `sessions: []` with zero agent-browser-owned
  processes after every attempt.
- Two attempts left the current-run Synara Vite/server child processes
  orphaned after their dev-runner parent exited. Exact PID, parent, process
  group, command, and owned ports were verified before terminating only those
  processes.
- Final owned ports `58161`, `58090`, and `8891` were free.
