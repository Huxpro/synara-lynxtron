# Changed Rename at 320x200

## Newly discovered scope

A canonical working-tree rename with content changes was opened in standalone
Changes at `320x200`, DPR 1, dark:

- old:
  `old/deep/path/very-long-original-component-name.ts`;
- new:
  `new/even-deeper/path/very-long-renamed-component-name.ts`;
- similarity: `58%`;
- patch stats: `+1/-1`;
- relation: `renamed`;
- entry: real pointer activation of Environment `Changes`.

Unlike the earlier pure rename state, this patch included a real hunk and both
long source/destination identities.

## Compact evidence

- server instance:
  `f7cd890d-69b9-49b7-8794-399aa2b4950a`;
- pre-fixture Web/Lynx/Native snapshot sequence: `0`;
- post-fixture snapshot sequence: `2`;
- header:
  `269x32 @ (26,143)`;
- new path:
  `58.609375x16 @ (56,151)`;
- `renamed from ...`:
  `120x16 @ (122.609375,151)`;
- additions:
  `13.140625x16 @ (250.609375,151)`;
- deletions:
  `11.25x16 @ (271.75,151)`;
- path/previous, previous/addition, and addition/deletion overlap checks were
  all false;
- accessibility preserved the complete new path;
- root stayed `320px` wide;
- pending requests returned to zero;
- page errors: none;
- PNG: exactly `320x200`, then deleted.

The destination and source identities each truncate within their own flex
allocation while stats remain fixed and visible.

## Classification

- `changed-rename-long-identity-compact`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

The cell used the already validated final bundles from the preceding
control-path slice:

- Web main:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`;
- Lynx-for-Web:
  `8fd915cebae2576cfa2f873fed0574f3cd2cadcb7d789137ea34b08b29c4df73`;
- Native:
  `bd591f4f553bfbac2d0bbe26d99e69b7ff80c34f1b2c5e386edec4657f03889f`.

Entry and exit browser gates returned `sessions: []` and zero
agent-browser-owned processes. Screenshot count remained `100`.
