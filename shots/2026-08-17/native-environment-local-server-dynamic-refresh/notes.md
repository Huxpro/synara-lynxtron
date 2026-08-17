# Native Environment Local Server Dynamic Refresh

## Newly Discovered Scope

An exact-owned Native Environment cell exercised a real server-list transition
while the Local Servers popup remained open:

`baseline -> add owned server -> Refresh -> remove owned server -> Refresh`

The current-run-owned Node server listened on `localhost:58191`. It was started
only after the popup was already open, then killed and reaped by the harness
before the second Refresh.

## Harness Identity

- Source commit: `ca1b28da609c034c7f793b3d94de087761929be2`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Every stage reported the same client, session, and bundle URL.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

Real Native touch opened Local Servers at `(744,220)`.

After starting the owned server:

- Refresh measured `20x20 @ (862,245)`;
- real touch activated it at `(872,255)`;
- popup mount count remained `1`;
- exact rendered address `localhost:58191` appeared.

The harness then killed and reaped only its owned process group and verified
port `58191` free.

After the second real Refresh at `(872,255)`:

- popup mount count remained `1`;
- exact rendered address `localhost:58191` disappeared;
- no stop-feedback alert remained.

The open popup therefore consumes current scanner results without remounting or
retaining a removed process.

## Classification

- `native-environment-local-servers-dynamic-refresh`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

This cell does not use the product Stop action. Process addition/removal belongs
to the current harness; the product interaction being certified is Refresh.

## Validation And Cleanup

- Host logs contained multiple real `server.listLocalServers` requests.
- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- Owned ports `58090` and `58191` were free.
- All owned app, Synara server, local server, state, Git fixture, logs,
  console, and image artifacts were removed.
- Entry and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
