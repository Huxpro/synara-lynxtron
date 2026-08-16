# Explorer Long Path at 320x200

## Newly discovered scope

A deeply nested JSON file with a long filename was selected through a canonical
project/thread in the ordinary compact Explorer at `320x200`, dark.

## P1 product loss

Before the fix:

- preview header: `159.5x40`, `scrollHeight=84`;
- path: `99.5x128 @ (172.5,75.5)`;
- path ended at `y=203.5`, crossing both header boundaries;
- `white-space:normal`, `text-overflow:clip`.

The action button stayed in place, but the path text painted through the
header and content.

`lynx-explorer-long-path-header-wrap`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

The shared selected-path owner now has one canonical single-line truncation
contract:

- `overflow:hidden`;
- `text-overflow:ellipsis`;
- `white-space:nowrap`.

This applies to every selected-file header and does not add a compact-only
renderer.

## After evidence

- header: `159.5x40`, `scrollHeight=39`;
- path: `99.5x16 @ (172.5,131.5)`;
- path ends at `y=147.5`;
- resolved `nowrap / ellipsis / hidden`;
- More actions remains `28x28 @ (280,125.5)`;
- relay: one connection, zero pending requests, no transport/RPC error.

A temporary PNG was exactly `320x200`, SHA-256
`79c1a4fe6375f10e91bda57baf071add19721bae0adb14d272b5b6695922578e`,
then deleted.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4554.3 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `122e713666f0a89dcd141ffc03c946df7ad96d632a7ac80ff87089066da56d81`.
- Native cannot certify `320x200`; the build is supporting evidence only.
- The first probe script failed before browser launch because zsh's special
  `path` variable replaced `PATH`. The independent double-zero gate passed
  before the corrected probe.
- Every browser workflow used `bun run browser:run -- ...`.
