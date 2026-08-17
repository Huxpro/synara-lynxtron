# Native Settings Diff Word Wrap Reset

## Newly Discovered Scope

An exact-owned Native Settings cell exercised the conditional per-setting
Reset action:

`Diff line wrapping Off -> toggle On -> Reset to default -> cold restart`

The cell focuses on Reset ownership and persistence rather than reopening
Changes, which was certified in the preceding On/Off consumption slices.

## Harness Identity

- Source commit: `6e84f7b5245c791fc7270dd23df306338b278f25`.
- Native outer window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- Both Settings launches independently derived their DevTool client from the
  owned app PID/process group.
- The same isolated Synara server, user data, window state, and bundle persisted
  across the restart.

## Real Interaction Evidence

The exact `Wrap diff lines by default` switch started:

- `aria-checked=false`;
- accessibility value `Off`;
- geometry `32x20 @ (831,240)`.

Real touch at `(847,250)` changed it to On and caused the conditional action:

`Reset diff line wrapping to default`

The exact Reset control:

- accessibility label:
  `Reset diff line wrapping to default`;
- geometry: `32x24 @ (395,219)`;
- real touch: `(411,231)`.

After Reset:

- switch returned to `aria-checked=false`;
- accessibility value returned to `Off`;
- on-class was removed;
- exact Reset action count returned to `0`.

After closing and cold-starting a second owned Settings instance with the same
user data:

- switch remained Off;
- Reset remained absent.

## Classification

- `native-settings-diff-word-wrap-reset-restart`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

## Validation And Cleanup

- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- All owned app instances, Synara server, state, Git fixture, logs, console,
  and image artifacts were removed.
- Port `58090` was free.
- Entry and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
