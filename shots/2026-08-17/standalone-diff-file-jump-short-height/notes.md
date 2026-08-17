# Standalone Changes File Jump at 320x200

## Newly discovered scope

Web's current DiffPanel toolbar unconditionally exposes `Jump to file` for
renderable files. Lynx standalone Changes had no equivalent control, leaving
long multi-file patches dependent on native wheel behavior.

A canonical 12-file working-tree diff was used:

- 11 one-line files;
- target `src/zz-target-file.ts` with 20 additions and one deletion;
- viewport: `320x200`, DPR 1, dark.

## P1 product loss

Before the fix, Lynx standalone Changes had:

- no file-jump trigger;
- no searchable file list;
- no direct path from the header to a distant file.

`lynx-standalone-diff-file-jump-missing`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

- Multi-file standalone Changes now exposes `Jump to file` beside Close.
- A stable fixed overlay is used instead of the Menu subtree that previously
  destabilized Lynx-for-Web Editor mounting.
- The overlay includes a real native search input and scrollable file rows.
- Selecting a row:
  - expands only that file;
  - closes and clears the picker;
  - calls the shared native `scrollIntoView` helper on the file card.
- Shared portable file elements accept an optional id so Web and Lynx keep one
  composition contract.
- Editor Changes keeps its existing dedicated file sidebar and does not show
  the redundant trigger.

## Runtime evidence

Opening the trigger:

- trigger: `28x28 @ (250,53.5)`;
- overlay viewport: `320x200`;
- dialog: `304x184 @ (8,8)`;
- search input: `278x32 @ (21,49)`;
- file list: `278x92 @ (21,87)`;
- all 12 canonical rows present.

Searching and selecting:

- real textbox input: `zz-target`;
- exactly one result:
  `src/zz-target-file.ts +20/-1`, `278x32 @ (21,87)`;
- real pointer click closed the overlay;
- target file expanded to `474px`;
- parent diff scroller moved to `scrollTop=506`;
- target header returned to visible `y=142`;
- pending requests: `0`.

## Validation

- DiffDock Rstest: `3/3` passed.
- Shared disclosure Rstest: `1/1` passed.
- Web production build passed with `8953` modules.
- Lynx-for-Web production build passed: `4580.4 kB`.
- Web bundle SHA-256:
  `81bb2b84d0a42d96d50dbac55bab29f16b0cbabadcb3536d7f84ef78170e0ed1`.
- Native/Desktop production build passed: `4286.3 kB`.
- Staged Native bundle SHA-256:
  `c8ba29a7650f821e52944e044823a3893ba31c1220ba61081ffb681494e5b4c9`.
- The commit hook printed its generic React Doctor fallback warning. A real
  uncached changed-lines scan against parent `eca97346e` inspected three files,
  scored `90/100`, and reported `No issues found`.
- Two selection attempts were rejected before product interaction because old
  command receipts/project state collided. Each wrapper closed cleanly and
  the explicit double-zero gate ran before the fresh `select-3` fixture.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed states/workspaces, and repository screenshot count `100`.
