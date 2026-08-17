# Native Environment Two-Owned-Server Stop Isolation

## Newly Discovered Scope

An exact-owned Native cell exercised Stop isolation with two independently
owned, simultaneously rendered local servers:

- `localhost:58191` — selected Stop target;
- `localhost:58192` — required surviving sibling.

Both Node HTTP process groups were created by the current harness and exposed
real listening ports and rendered rows.

## Harness Identity

- Source commit: `469dd0c8de662f04bc610913d225f11bf9c30cc7`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Every stage reported the same client, session, and bundle URL.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

Real Native touch opened Local Servers at `(744,220)`.

Before Stop, both exact-address rows exposed enabled controls:

- `localhost:58191`: `focusable=true`, `aria-disabled=false`, complete event
  bindings;
- `localhost:58192`: `focusable=true`, `aria-disabled=false`, complete event
  bindings.

The harness then selected only the Stop control under the exact
`localhost:58191` row:

- row: `274x42 @ (614,311)`;
- Stop: `24x24 @ (854,320)`;
- touch: `(866,332)`.

After settlement:

- port/process/row `58191`: stopped and absent;
- port/process/row `58192`: alive, listening, and still rendered;
- popup mount count: `1`;
- Native warning/error console: empty.

The product therefore isolates Stop by the selected row's PID/port and does not
remove or signal its owned sibling.

## Classification

- `native-environment-two-owned-server-stop-isolation`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

## Rejected Scope Assumption

The initial hypothesis expected the other naturally visible Synara-related row
to have a disabled Stop. Runtime evidence showed two enabled Stop controls, so
that assumption was rejected before any unknown row was touched. It is not a
product loss and not a safety authorization.

The retained scope uses two explicitly current-run-owned servers instead,
making both target and survivor identities auditable.

## Validation And Cleanup

- Host logs proved the exact `server.stopLocalServer` request for port `58191`.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- No process other than the selected `58191` target was stopped before final
  cleanup.
- Owned ports `58090`, `58191`, and `58192` were free after cleanup.
- All owned app, Synara server, local servers, state, Git fixture, logs,
  console, and image artifacts were removed.
- Entry and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
