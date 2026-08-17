# Native Settings Diff Word Wrap Off Restart

## Newly Discovered Scope

An exact-owned Native cell exercised the reverse persisted setting path:

`Off -> On -> Off -> cold app restart -> thread Changes`

The same canonical `2225`-byte long-line working-tree patch was used so the
rendering contract could be compared with the preceding persisted-On cell.

## Harness Identity

- Source commit: `a2db0553d0bd89c97aa249604b8f391081ae9155`.
- Native outer window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- Settings and thread launches independently derived their DevTool client from
  each owned app PID/process group.
- The same isolated Synara server, user data, project/thread, window state, and
  bundle persisted across the restart.

## Real Settings Roundtrip

The exact `Wrap diff lines by default` control was activated twice with real
Native touch at `(847,250)`.

State sequence:

1. `aria-checked=false`, accessibility value `Off`;
2. first touch -> `aria-checked=true`, value `On`,
   `SharedSettingsGeneralSwitch--on`;
3. second touch -> `aria-checked=false`, value `Off`, on-class removed.

The first owned app was then closed while preserving the isolated user data.

## Restart And Changes Consumption

The second owned app cold-started into the same thread. Real touches opened
Changes at `(744,108)` and expanded the file at `(739.5,159)`.

The long-line patch resolved:

- line container class: `SharedPrCodeLines`;
- `SharedPrCodeLines--wrap`: absent;
- addition row height: `20px`.

This is the inverse of the persisted-On cell's
`SharedPrCodeLines--wrap` and `1800px` row. The default unwrapped contract was
therefore restored after a real app restart.

## Classification

- `native-settings-diff-word-wrap-off-restart-consumption`:
  missing coverage `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

## Harness Boundary

An initial assertion expected the outer addition-row box itself to exceed the
viewport width. Native DevTool reported the row/text/content box model
differently from Lynx-for-Web's horizontal scroll metrics. That assertion was
rejected as a harness geometry assumption.

The retained Native contract uses authoritative state/class and vertical row
height. The existing Lynx-for-Web cell separately proves the horizontal
overflow ownership of the unwrapped mode.

Every rejected assertion was followed by `bun run browser:gate`.

## Validation And Cleanup

- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- All owned app instances, Synara server, state, Git fixture, logs, console,
  and image artifacts were removed.
- Port `58090` was free.
- Entry, failure, and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
