# Lynx thread Terminal

## Newly discovered scope

- Surface: thread page Terminal drawer.
- State: closed, ready, command draft, running PTY snapshot, output refresh,
  close with deleted history.
- Theme and viewport: dark, `1280x820`, DPR 1.
- Snapshot: isolated server `ws://127.0.0.1:59040`, project
  `project-terminal`, thread `thread-terminal`, workspace
  `/Users/bytedance/github/synara`.

## Product behavior

- Thread header now exposes a Terminal control and a `260px` drawer.
- The drawer uses canonical `terminal.open`, `terminal.write`, and
  `terminal.close` RPCs through a host-backed Lynx platform port.
- Output is intentionally snapshot-based (`streamOutput: false`). The current
  Lynx bridge aggregates streamed requests until completion, so
  `terminal.subscribeEvents` cannot honestly provide live terminal output yet.
- Run performs open, write, short host sleep, and snapshot refresh. Refresh
  reads the current session snapshot. Close deletes terminal history when a
  session was opened.

## Evidence

- Focused tests: 18/18 passed across the Terminal contract, Web initial route,
  and Desktop shell runtime.
- Lynx-for-Web rendered the drawer at
  `?route=%2Fthread%2Fthread-terminal&terminal=open`.
- The shared native input accepted the complete command
  `printf 'synara-terminal-proof\n'` without controlled-value truncation.
- Canonical isolated-server probe:
  - `terminal.open` returned status `running`.
  - `terminal.write` executed a base64-decoded marker command.
  - repeated `terminal.open` snapshots observed `SYNARA_OUTPUT_B64_42`.
  - `terminal.close({ deleteHistory: true })` succeeded.
- Lynx-for-Web console errors were empty for the retained drawer/input state.

## Classification

- **P1 missing coverage closed:** Lynx had no thread Terminal surface.
- **Intentional platform delta:** snapshot refresh replaces live output until
  the bridge can consume an unbounded stream with backpressure.
- **Harness loss:** browser pointer/confirm automation still does not reliably
  produce Lynx `bindtap`/`bindconfirm`; PTY wire behavior was therefore proven
  separately through canonical RPC rather than claimed as a rendered-control
  pass.
- **Native harness blocker:** the existing user-owned Lynxtron client on
  `localhost:8901` must remain running, while the current workspace executable
  uses the same fixed DevTool port. Exact-client Native certification remains
  blocked and is not counted as passing.

## Loss ledger

- `lynx-thread-terminal-missing`: P1 product parity,
  contribution `1.00 -> 0.00`.
- `lynx-terminal-live-stream`: intentional platform delta,
  contribution remains `0.25`.
- `lynx-web-pointer-to-bindtap`: historical ReactLynx/Web Core dynamic-event
  P1 coverage, contribution `1.00 -> 0.00` globally. This Terminal cell itself
  still lacks a rendered-control rerun and remains route-specific missing
  interaction coverage.
- `native-terminal-devtool-fixed-port`: harness blocker,
  contribution remains `0.00` product loss.
