# Native Settings Diff Word Wrap Restart

## Newly Discovered Scope

An exact-owned Native cross-screen cell exercised the complete persisted
Behavior setting:

`Settings / Behavior -> Diff line wrapping On -> cold app restart -> thread Changes`

The canonical Git fixture changed one short tracked line into a long line with
60 repeated segments. The real working-tree patch was `2225` bytes.

State was created through orchestration RPC commands. SQLite was not written.

## Harness Identity

- Source commit: `44e6240328d658b8c3049d88b37e51bb9c7af43a`.
- Native outer window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- First launch:
  `synara://settings/behavior`.
- Second launch:
  `synara://thread/native-word-wrap-thread?environment=open`.
- Both launches independently derived their DevTool client from the owned app
  PID/process group. Each happened to receive `localhost:8903/session 1`; the
  harness did not reuse a remembered port.
- The same isolated Synara server, project/thread, user-data directory, window
  state, and bundle were used across the app restart.
- Unrelated DevTool clients were untouched.

## Real Settings Interaction

The exact switch was located by accessible label:

`Wrap diff lines by default`

Before:

- `aria-checked=false`;
- accessibility value `Off`;
- class `SharedSettingsGeneralSwitch`;
- geometry `32x20 @ (831,240)`.

Real Native touch at `(847,250)` changed it to:

- `aria-checked=true`;
- accessibility value `On`;
- class includes `SharedSettingsGeneralSwitch--on`.

The first owned app instance was then closed. The Synara server and isolated
Native user-data directory remained alive/intact.

## Restart And Changes Consumption

The second exact-owned app instance cold-started directly into the same thread
and Environment state.

Real Native touches:

- Changes: `(744,108)`;
- file header: `(739.5,159)`.

The expanded patch resolved:

- line container classes:
  `SharedPrCodeLines SharedPrCodeLines--wrap`;
- addition row:
  `271x1800 @ (604,215)`.

The 1800px row height is the wrapped long line, not the 20px unwrapped row. The
Changes dock therefore consumed the persisted Settings value after a real app
restart.

## Classification

- `native-settings-diff-word-wrap-toggle-restart-consumption`:
  missing coverage `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

## Harness Failures And Boundaries

The first script revision failed syntax validation before launching Native
because a generated `sed` expression retained escaped quotes. It was corrected
and followed by `browser:gate`; it contributed no product evidence.

This cell certifies pointer toggle and restart persistence. It does not claim
Native keyboard activation or the separate Native wheel behavior.

## Validation And Cleanup

- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- No runtime source changed; the cell reused the current certified production
  bundle and focused tests.
- All owned app instances, Synara server, state, Git fixture, logs, console,
  and image artifacts were removed.
- Port `58090` was free.
- Entry, failure, and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
