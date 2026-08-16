# Explorer Persisted Width at 320x200

## Newly discovered scope

A canonical Thread restored `explorerWidth=960` while opening the ordinary
Explorer at `320x200`, dark. This checks whether persisted inline width can
override the compact responsive contract.

## Compact evidence

Init data retained `initialExplorerWidth=960`, but runtime geometry correctly
clamped:

- dock: `320x108 @ (0,92)`;
- computed width: `320px`;
- sidebar/preview: `159.5px` each;
- Thread inline style: `padding-right:0px`;
- Thread computed padding: `0px`.

No persisted width escaped the viewport and no stale chat inset remained.

## Normal-size control

At `1280x820`, the same requested width restored through the normal clamp:

- dock: `704px @ x=576..1280`;
- Thread inline/computed padding-right: `704px`.

The 960px request is intentionally reduced to preserve the 320px minimum main
content area.

This is a persisted-width responsive product pass, contribution
`0.00 -> 0.00`; no code change was required.

## Boundaries

- No resize interaction was performed; this cell verifies deterministic
  restoration and responsive clamping.
- Every browser workflow used `bun run browser:run -- ...` and ended with zero
  sessions/processes.
