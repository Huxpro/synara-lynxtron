# Native Settings Safety Confirmations Combination

## Newly Discovered Scope

An exact-owned Native Settings cell exercised all three Safety confirmations
as one persisted combination, then restored each key independently:

| Setting                    | Default | Changed |
| -------------------------- | ------: | ------: |
| Confirm thread deletion    |      On |     Off |
| Confirm thread archive     |     Off |      On |
| Confirm terminal tab close |      On |     Off |

The cell included two cold app restarts:

1. verify the changed `false / true / false` combination;
2. verify the restored `true / false / true` defaults.

## Harness Identity

- Source commit: `96d72f00d47b83b8fa2c8de4ba29281a93d3ef31`.
- Native outer window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- Each of the three Settings launches independently derived its DevTool client
  from the owned app PID/process group.
- The same isolated server, user-data directory, window state, and bundle were
  preserved across both restarts.

## Real Combination Interaction

Exact accessible switch labels and real Native touch centers:

- `Confirm thread deletion`: `(847,375)`, On -> Off;
- `Confirm thread archive`: `(847,436)`, Off -> On;
- `Confirm terminal tab close`: `(847,497)`, On -> Off.

All three states were verified before restart and again after the first cold
restart:

- deletion: `aria-checked=false`;
- archive: `aria-checked=true`;
- terminal close: `aria-checked=false`.

No sibling key was overwritten by another toggle.

## Independent Reset Interaction

Exact conditional Reset actions:

- `Reset delete confirmation to default`:
  `32x24 @ (408,353)`, touch `(424,365)`;
- `Reset archive confirmation to default`:
  `32x24 @ (414,414)`, touch `(430,426)`;
- `Reset terminal close confirmation to default`:
  `32x24 @ (453,475)`, touch `(469,487)`.

After all three actions:

- deletion returned On;
- archive returned Off;
- terminal close returned On;
- all three exact Reset actions unmounted.

The second cold restart preserved the complete default combination.

## Classification

- `native-settings-safety-confirmations-combination-restart`:
  missing coverage `1.00 -> 0.00`.
- `native-settings-safety-confirmations-independent-reset`:
  missing coverage `1.00 -> 0.00`.
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
