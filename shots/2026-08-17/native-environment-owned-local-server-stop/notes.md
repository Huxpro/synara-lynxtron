# Native Environment Owned Local Server Stop

## Newly Discovered Scope

An exact-owned Native Environment cell exercised Local Servers against a real
current-run-owned process:

- title: `Native Owned Server`;
- address: `localhost:58191`;
- implementation: Node HTTP server with a real HTML title;
- ownership: PID and process group created by the current harness.

The Synara project/thread was created through orchestration RPC commands.
SQLite was not written.

## Harness Identity

- Source commit: `db05654dded8d1e68c7e2d318e970f5e5d6f816e`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- Final PID/lsof-derived DevTool client:
  `localhost:8904/session 1`.
- Open, Stop, and verify stages all reported the same client, session, and
  staged bundle URL.
- The client port was derived from the owned app process group; the harness did
  not assume the previously common `8903`.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

The Local Servers trigger measured:

`274x26 @ (607,207)`

Real touch opened it at `(744,220)`.

The harness found `Native Owned Server` by exact rendered title, walked to its
own row, and selected only the Stop control under that row:

- row: `274x42 @ (614,311)`;
- Stop: `24x24 @ (854,320)`;
- touch: `(866,332)`.

The host log independently proved the exact request:

`server.stopLocalServer { pid: <owned pid>, port: 58191 }`

After settlement:

- the exact owned PID was reaped;
- port `58191` was free;
- `Native Owned Server` was absent from the rendered popup;
- the Local Servers popup remained mounted;
- no unrelated server row was used as the target.

## Classification

- `native-environment-owned-local-server-stop`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

This cell proves the Native pointer, RPC, process-ownership, refresh, and popup
retention path. It does not authorize stopping user-owned processes and does
not claim any row that was not created by the current harness.

## Harness Failures

Three non-product failures were rejected before the retained run:

1. the reused setup helper expected a two-file diff while the first fixture was
   clean;
2. `kill -0` treated an exited but unreaped child as alive;
3. the DevTool console command emitted a whitespace-only file, which a raw
   file-size check misclassified as a console entry.

The corrected harness used the existing canonical two-file setup contract,
waited for port release before reaping the exact child, and treated only
non-whitespace console text as an entry. Earlier UI samples already showed the
owned title disappearing; none were used as retained evidence until all
process, console, image, and cleanup gates passed together.

Every failure boundary was followed by `bun run browser:gate` before the next
browser-capable action. Every gate reported `sessions: []` and zero
agent-browser-owned processes.

## Validation And Cleanup

- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- Host log contained the real `server.stopLocalServer` and follow-up
  `server.listLocalServers` requests.
- No runtime source changed; the cell reused the immediately preceding
  certified production bundle and focused tests.
- Owned ports `58090` and `58191` were free.
- All owned app, Synara server, local server, state, Git fixture, logs, console,
  and image artifacts were removed.
- Repository screenshot count remained exactly `100`.
