# Explorer Selected Preview at 320x200

## Newly discovered scope

After the compact query owner became reachable, active discovery continued into
the selected-file transition rather than treating the search-list pass as a
complete Explorer pass.

The same repository-backed empty Thread opened `package.json` with:

- `explorer=open`;
- `explorerPath=package.json`;
- dark theme;
- `320x200`, DPR `1`;
- canonical project/thread sequence `0 -> 1 -> 2`.

## P1 product loss

The first compact dock repair retained Web's 240px sidebar. At a 320px
viewport, the preview received only 79px:

- sidebar: `240x80 @ (1,120)`;
- preview: `79x80 @ (241,120)`;
- preview header: `79x40`;
- path: `19x96 @ (253,91.5)`, overflowing above and below the header;
- More actions: `28x28 @ (280,125.5)`;
- preview scroll: `71x32`.

The selected file loaded successfully through `projects.readFile`, and syntax
highlighting succeeded, but the filename header and content surface were not
usable. The existing preview-action popup test did not cover this geometry.

`lynx-explorer-selected-preview-compact-cramped`: P1 component contribution
`1.00 -> 0.00`.

## Authority and root fix

Web owns a horizontal Explorer anatomy: one sidebar and one flexible preview.
The compact fallback now gives each side half of the available dock instead of
preserving the desktop 240px sidebar:

- compact ordinary Thread sidebar: `width:50%`, `min-width:0`;
- ordinary/normal-size dock remains 240px;
- Editor Explorer remains on its independent responsive contract;
- at short height, the auxiliary result path is hidden while the canonical
  filename and row remain.

No selected-file state, file loading, preview renderer, or action menu was
duplicated.

## After evidence

Selected `package.json`:

- dock: `320x108 @ (0,92)`;
- sidebar: `159.5x80 @ (1,120)`;
- preview: `159.5x80 @ (160.5,120)`;
- header: `159.5x40`;
- path: `99.5x16 @ (172.5,131.5)`;
- More actions: `28x28 @ (280,125.5)`;
- preview content: `159.5x40`;
- preview scroller: `151.5x32 @ (164.5,164)`,
  `scrollHeight=1853`;
- relay used `projects.listDirectories` and `projects.readFile`;
- JSON syntax highlighting succeeded.

The preceding compact query state was reverified:

- sidebar/preview: about `159.5px` each;
- search: `150.5x28`;
- first result: `152.5x28 @ (4,160)`, bottom `188`;
- result owner retained a real vertical scroll range.

A temporary PNG was exactly `320x200`, SHA-256
`f802633da8d799e30cc612b3620cf2fd0cd9013f24ac6b1bed960a42f4b8c93d`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Explorer Rstest passed `2/2`.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4541.9 kB`.
- Native/Desktop production build passed with registered warnings only.
- Staged Native bundle SHA-256:
  `1ee391b61f898698823cfbcc30ae6c7307a7cfa2b48563b6a3418e61f25ad19e`.
- Native cannot certify the `320x200` viewport because the host minimum is
  `900x650`; the build is supporting bundle evidence only.
- The environment-only `provider.listModels: codex not found in PATH` error was
  observed after the selected preview mounted. It is accepted provider noise,
  not Explorer evidence.
- Every browser workflow used `bun run browser:run -- ...` and ended with
  zero sessions/processes.
