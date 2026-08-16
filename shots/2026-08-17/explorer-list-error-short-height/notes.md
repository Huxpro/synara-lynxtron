# Explorer Listing Error at 320x200

## Newly discovered scope

A canonical project/thread was created while its temporary workspace existed.
The workspace root was then removed before opening Explorer, producing a real
root `projects.listDirectories` failure at `320x200`, dark.

## Evidence

- dock: `320x108 @ (0,92)`;
- Close: `28x28 @ (280,91.5)`;
- search input: `150.5x28 @ (5,124)`;
- entries owner: `158.5x43 @ (1,157)`;
- error copy: `112.828125x18 @ (23.828125,169.5)`, bottom `187.5`;
- copy: `Could not load files.`;
- preview remains `159.5x80 @ (160.5,120)`;
- relay: one connection, zero pending requests, no transport/RPC error.

The compact root-list failure is fully contained and remains dismissible. This
is a failure-boundary product pass, contribution `0.00 -> 0.00`; no code change
was required.

## Boundaries

- The removed workspace was a real filesystem prerequisite failure, not a fake
  component state.
- No retry control exists in the current Explorer contract; this cell does not
  claim automatic recovery.
- Every browser workflow used `bun run browser:run -- ...` and ended with zero
  sessions/processes.
