# Empty Thread at 320x200

## Newly discovered scope

A canonical empty project/thread was rendered at `320x200`, dark. This combines
the compact two-row Thread header with the shared empty-state hero, provider
banner, composer, and context tray.

## P1 product loss

Before the fix:

- Thread header: `320x92`;
- provider banner consumed another `44px`;
- empty-state stack extended to `y=325`;
- composer was `296x95 @ (12,192)`, leaving only 8px inside the 200px viewport;
- `ThreadPage` had `scrollHeight=325` but `overflowY:visible`; no scroll-view
  owned that overflow;
- wheel input left every candidate `scrollTop=0`.

This differs from Landing short-height, where the same stack is inside a real
vertical scroll-view.

`lynx-empty-thread-short-composer-unreachable`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

Only short-height ordinary Thread pages prioritize the primary input:

- hide decorative centered hero;
- hide the context tray;
- hide the direct Thread provider banner.

Landing and normal-height Thread retain all three surfaces. The composer itself
keeps its normal 95px anatomy and controls rather than being artificially
compressed.

## After evidence

At `320x200`:

- header: `320x92`;
- hero/context/banner: `0x0`;
- composer: `296x95 @ (12,98.5)`, bottom `193.5`;
- the complete composer is visible with 6.5px bottom clearance.

At `320x568`, normal behavior remains:

- banner: `320x80`;
- hero: `320x181`;
- composer: `296x95`;
- context tray: `296x58`.

Web output/stage SHA-256:
`3430636cc7403b7bb43d00ac8fa6915b65566673b10af8deb48747f516a43f6a`.

## Verification

- Empty Thread + drag-region suites: `8/8`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Two iterations replaced a stale formatting-sensitive source assertion with a
  semantic empty-branch slice assertion; both failures were test-contract
  issues, not product evidence.
- Fixture project/thread were created and removed through canonical RPC.
- No screenshot retained; local count remained `100`.
