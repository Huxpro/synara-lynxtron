# Explorer Read Error at 320x200

## Newly discovered scope

A canonical project pointed at a real temporary workspace. Explorer selected a
missing `deleted-after-selection.txt` path at `320x200`, dark, producing a real
`projects.readFile` error rather than a fabricated component state.

## Error-state evidence

- selected header: `159.5x40 @ (160.5,120)`;
- path: `99.5x16 @ (172.5,131.5)`;
- More actions: `28x28 @ (280,125.5)`;
- preview content: `159.5x40 @ (160.5,160)`;
- error copy: `131.71875x18 @ (174.390625,171)`, bottom `189`;
- copy: `Could not read this file.`;
- relay: one connection, zero pending requests, no transport/RPC error.

The compact error state is fully contained. This is a failure-boundary product
pass, contribution `0.00 -> 0.00`.

## Recovery evidence

The same workspace contained `available.txt`. A controlled activation of its
rendered Explorer row changed:

- path: `deleted-after-selection.txt -> available.txt`;
- error: present -> unmounted;
- preview content: `Could not read this file. -> available`;
- relay issued a fresh `projects.readFile`.

This is handler/state recovery evidence and is not claimed as trusted pointer
evidence.

## Boundaries

- No product code change was required.
- Native cannot certify `320x200`.
- Every browser workflow used `bun run browser:run -- ...` and ended with zero
  sessions/processes.
