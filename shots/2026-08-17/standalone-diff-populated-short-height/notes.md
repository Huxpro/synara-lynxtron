# Standalone Populated Changes at 320x200

## Newly discovered scope

A canonical two-file working-tree diff was opened in the standalone Changes
dock at `320x200`, DPR 1, dark:

- `docs/readme.md`: `+3/-1`;
- `src/very-long-component-name.ts`: `+1/-1`;
- total patch: `501` bytes, `+4/-2`;
- entry: real mouse click on the rendered Environment `Changes` row;
- expansion: real mouse click on the first rendered file header.

Project/thread setup and cleanup used canonical
`orchestration.dispatchCommand`; SQLite was not edited.

## Collapsed evidence

- dock: `320x154 @ (0,46)`;
- header: `319x44 @ (1,46)`;
- title: `Changes`;
- stats: `+4 -2`, complete in the fixed header;
- scroller: `319x110 @ (1,90)`;
- scroller: `clientHeight=110`, `scrollHeight=156`;
- first file header:
  `docs/readme.md +3/-1`, `269x32 @ y=143..175`;
- second file header:
  `src/very-long-component-name.ts +1/-1`, present in the same scroll owner;
- root: `clientWidth=scrollWidth=320`;
- relay: `pendingRequests=0`, no RPC/transport error.

## Expanded evidence

After a real pointer click on the first file header:

- `docs/readme.md` expanded from `34px` to `134px`;
- rendered patch included:
  `@@ -1 +1,3 @@`, `# Before`, `# After`, and `content`;
- scroller remained `319x110`;
- scroller `scrollHeight` increased to `256`;
- the second file header remained mounted after the expanded patch;
- root remained `clientWidth=scrollWidth=320`;
- PNG: exactly `320x200`, then deleted.

## Classification and boundaries

- `standalone-diff-populated-compact`: missing coverage `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`; no code change was required.
- A real mouse wheel command was issued over the expanded scroller, but the
  retained probe did not record a changed `scrollTop` or moved second-file
  geometry. Wheel behavior therefore remains interaction harness missing
  coverage and is not claimed as a pass.
- Two fixture retries were rejected before product capture: one global string
  replacement altered the workspace path, and one command ID collided with an
  earlier receipt. Each failure was followed by the browser cleanup/session
  gate.
- Every browser workflow ran through `bun run browser:run -- ...`.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  free ports `58090` and `8891`, removed state/workspaces/temp PNGs, and
  repository screenshot count `100`.
