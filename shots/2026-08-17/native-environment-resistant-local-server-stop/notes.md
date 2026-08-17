# Native Environment Resistant Local Server Stop

## Newly Discovered Scope

An exact-owned Native Environment cell exercised the real `stopped:false`
path against a current-run-owned server that deliberately ignored `SIGTERM`.

- address: `localhost:58191`;
- process and process group: created by the current harness;
- behavior: remain alive and listening after Stop;
- expected host result:
  `Stop signal sent; the process is still shutting down.`

The project/thread was created through orchestration RPC commands. SQLite was
not written.

## Harness Identity

- Source commit: `2f858e9c25387ebc72be9a834363c0b14885193c`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Open, Stop, and verify stages reported the same client, session, and bundle
  URL.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

Real touch opened Local Servers at `(744,220)`.

The target row was identified by exact rendered address
`localhost:58191`, then the harness selected only that row's Stop control:

- row: `274x42 @ (614,311)`;
- Stop: `24x24 @ (854,320)`;
- touch: `(866,332)`.

The host log independently recorded:

`server.stopLocalServer { pid: <owned pid>, port: 58191 }`

After complete settlement:

- the resistant PID remained alive;
- port `58191` remained listening;
- the exact address row remained;
- popup remained mounted;
- the exact server message was rendered:
  `Stop signal sent; the process is still shutting down.`;
- Stop recovered to:
  - `focusable=true`;
  - `aria-disabled=false`;
  - complete pointer/focus/keyboard event bindings.

The user can therefore understand why the row remains and retry the action.

## Classification

- `native-environment-resistant-local-server-stop-feedback`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

## Harness Failures

The first exact-title lookup raced page-title enrichment. The target authority
was changed to exact rendered address `localhost:58191`, which directly
matches the stop RPC port and is independently owned by the harness.

An intermediate sample at 2.5 seconds found the alert and row but still saw the
Stop control disabled. That was the correct in-flight state: the mutation was
still awaiting the list refetch. The retained run waited six seconds for the
server settle delay, scanner/refetch, and ReactLynx commit; only then was the
control evaluated as enabled.

Every failed readiness or premature-settlement attempt was followed by
`bun run browser:gate` before the next browser-capable action. Every gate
reported `sessions: []` and zero agent-browser-owned processes.

## Validation And Cleanup

- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- Host logs proved real `server.stopLocalServer` and follow-up
  `server.listLocalServers`.
- The resistant process was force-terminated only by final harness cleanup.
- No runtime source changed; the cell reused the immediately preceding
  certified production bundle and tests.
- Owned ports `58090` and `58191` were free after cleanup.
- All owned app, Synara server, resistant server, state, Git fixture, logs,
  console, and image artifacts were removed.
- Screenshot count remained exactly `100`.
