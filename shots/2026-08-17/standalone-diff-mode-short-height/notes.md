# Standalone File Mode Changes at 320x200

## Newly discovered scope

A real mode-only working-tree diff was opened in standalone Changes at
`320x200`, DPR 1, dark:

- file: `run.sh`;
- canonical patch:
  `old mode 100644` / `new mode 100755`;
- entry and expansion used real browser mouse input.

## P1 shared product loss

Before the fix, the shared portable model rendered only:

- `1 file`;
- `run.sh`;
- `+0/-0`.

Expanding the file produced no mode transition or explanatory body.

`shared-diff-mode-change-missing`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

- `PullRequestDiffFileView` now carries an optional `modeChange` pair.
- Both the canonical parsed path and pure-string portable fallback recognize
  `old mode` / `new mode`.
- The shared composition renders:
  `File mode changed from 100644 to 100755.`

Web and Lynx consume the same projection and composition.

## After evidence

- file card: `271x50 @ (25,142)`;
- notice: `269x16 @ (26,175)`, ending at `191`;
- scroller: `clientHeight=110`, `scrollHeight=126`;
- complete text:
  `1 file +0/-0 run.sh +0/-0 File mode changed from 100644 to 100755.`;
- pending requests: `0`;
- page errors: none.

## Validation

- Web parser Vitest: `5/5` passed.
- Lynx shared-composition Rstest: `1/1` passed.
- Web production build passed with `8953` modules.
- Lynx-for-Web production build passed: `4567.8 kB`.
- Web bundle SHA-256:
  `3c5cd4825f0cb74a2ca655c5f01bd12b6d81b3499db18a27c274ad943e7cd7e6`.
- Native/Desktop production build passed: `4275.8 kB`.
- Staged Native bundle SHA-256:
  `aeded8bfd319d42330d21e19b4bb5ee13dc5fbcc1bb4d05d15006f10e0742dd8`.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  removed state/workspace, and repository screenshot count `100`.
