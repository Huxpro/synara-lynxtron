# Native Environment Stale Local Server Stop

## Newly Discovered Scope

An exact-owned Native cell exercised a stale rendered Stop target:

1. render the current-run-owned server at `localhost:58191`;
2. measure its exact Stop control;
3. terminate and reap only that owned process outside the product;
4. verify port `58191` is free;
5. touch the still-rendered old Stop coordinate;
6. verify safe revalidation and UI recovery.

The project/thread was created through orchestration RPC commands. SQLite was
not written.

## Harness Identity

- Source commit: `7113c4c4a5549a97e25a5afc9c1b7df71419e04c`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Every stage reported the same client, session, and bundle URL.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

The Local Servers popup opened through real touch at `(744,220)`.

Before making the row stale:

- exact address: `localhost:58191`;
- row: `274x42 @ (614,311)`;
- Stop: `24x24 @ (854,320)`;
- Stop center: `(866,332)`.

The harness then killed and reaped only its owned process group and verified
port `58191` was no longer listening. It immediately sent a real Native
press/release at the previously measured Stop center.

After settlement:

- popup mounted: `1`;
- stale owned address row mounted: `0`;
- stop-failure feedback mounted: `0`;
- exact-owned Native console had no warning/error entry.

The host log contained the real `server.stopLocalServer` request. Server-side
PID/port revalidation returned safely instead of signaling any replacement or
unrelated process.

## Classification

- `native-environment-stale-local-server-stop-recovery`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

## Validation And Cleanup

- Temporary JPEG was exactly `1800x1300` and was deleted.
- No process other than the current-run-owned target was killed before the
  stale interaction.
- Owned ports `58090` and `58191` were free.
- All owned app, Synara server, local server, state, Git fixture, logs,
  console, and image artifacts were removed.
- Entry and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
