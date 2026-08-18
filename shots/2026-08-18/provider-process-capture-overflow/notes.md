# Provider Process Capture Overflow

## New scope

- screen/state: a real Codex thread session stopped while provider startup was
  still in progress;
- interaction: canonical
  `thread.create -> thread.turn.start -> thread.session.stop -> thread.delete`;
- environment: isolated Synara server at `127.0.0.1:58090`, state directory
  `.synara-sxs/dev`;
- provider: local Codex app-server, model `gpt-5.6-sol`;
- classification: P1 product reliability loss.

No SQLite fixture or direct state mutation was used.

## Loss

The previous real repeat-turn verification entered terminal failure:

`rootExited=true, captureComplete=false; no captured descendants remain`

The root process had exited, but Synara could not prove that the pre-TERM
process-tree capture was complete, so the durable stop delivery became
`uncertain` and the session remained stuck in `starting`.

This was a Synara server lifecycle failure, not a Lynx or Lynxtron connection
failure.

## Root cause

The POSIX capture path used:

`ps -eo pid=,ppid=,command=`

with a `262144` byte `spawnSync` buffer. On the validation machine the process
snapshot was `416748` bytes across `1205` rows, and Node returned:

`spawnSync ps ENOBUFS (stdout or stderr buffer reached maxBuffer size limit)`

The snapshot therefore became `captureComplete:false` even though `ps` itself
was available and healthy.

## Fix

- Capture the whole-system relationship graph with the bounded lightweight
  `pid,ppid` fields only.
- Walk at most 256 descendants from that relationship snapshot.
- Read full command identities only for those discovered descendants, retaining
  the existing PID-reuse guard for delayed `SIGKILL`.
- Mark the capture incomplete if the relationship scan fails, the targeted
  command scan fails, or any discovered descendant loses its command identity
  between scans.
- Retry one incomplete capture before sending the first signal. If both
  pre-signal captures remain incomplete, teardown still fails closed; an empty
  post-exit PPID scan is not treated as proof because children may have been
  reparented.

## Verification

- Focused tests: `3 files / 20 tests`.
- Server production build: passed.
- Default killer under the same large process table returned
  `captureComplete:true`.
- A real owned root with one spawned worker stopped with:
  - `escalated:false`;
  - `signalErrors:[]`;
  - root no longer alive;
  - worker no longer alive.
- Canonical Codex lifecycle thread:
  `teardown-validation-1787045421851`.
- Session was observed in `starting`, then canonical stop resolved to:
  - `status: stopped`;
  - `lastError: null`.
- The temporary thread was permanently deleted at
  `2026-08-18T09:30:23.842Z`; the final snapshot contained no
  `teardown-validation-*` threads.
- No new `captureComplete=false`, process-tree exit failure, or terminal
  delivery failure was logged for the validation thread.
- Native PID `62883` automatically reconnected to server PID `89986` and kept
  one established product socket to `127.0.0.1:58090`.
- Browser ownership gates reported `sessions: []` and zero agent-browser-owned
  processes after every failed probe and at loop exit.
- No screenshot was added; repository screenshot count remained `100`.

## Harness losses

- The first focused-test invocation passed file paths to the workspace Turbo
  task runner instead of the server package's Vitest script. No test ran; the
  corrected package-local command passed.
- The first server restart stopped only the wrapper shell while the known owned
  Turbo/Bun server subtree remained alive. The replacement correctly refused
  the existing database lifecycle lock. The exact owned subtree was then
  stopped and the isolated server restarted without touching unrelated
  processes.
- The first RPC mutation probe omitted the transport's `{ command }` wrapper
  and failed during local schema encoding before reaching the server.
- The second RPC probe assumed `thread.create` starts a provider session. It
  does not; the temporary thread remained `session:null` and was deleted in the
  probe's `finally` block.
- PID `90112` was initially investigated as a possible validation leak. Its
  `18:26:11` start time predates the `18:30:22` validation session and identifies
  it as the server's discovery app-server, not a child leaked by the temporary
  thread.

None of these harness losses is counted as product loss.
