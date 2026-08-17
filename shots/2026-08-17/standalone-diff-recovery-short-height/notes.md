# Standalone Changes Recovery at 320x200

## Newly discovered scope

A real standalone Changes error-to-success transition was exercised at
`320x200`, DPR 1, dark:

- valid Git workspace hydrated the canonical project/thread;
- the workspace was removed before opening Changes;
- the resulting `git.readWorkingTreeDiff` failure rendered the contained
  `Couldn’t load changes.` state;
- the same path was recreated as a real clean Git repository;
- Retry used real browser mouse input at the measured control center.

Project/thread creation and deletion used canonical
`orchestration.dispatchCommand`; SQLite was not edited.

## Recovery evidence

Before Retry:

- state: `295x86 @ (13,102)`, ending at `188`;
- Retry: `52.03125x28 @ (203.625,131)`, ending at `159`;
- `git.readWorkingTreeDiff` call count: `1`;
- pending requests: `0`;
- root: `clientWidth=320`, `scrollWidth=320`.

After recreating the workspace and clicking Retry:

- `git.readWorkingTreeDiff` call count: `2`;
- error state and Retry: absent;
- dock copy: `ChangesNo working tree changes.`;
- dock: `320x154 @ (0,46)`;
- scroller: `319x110 @ (1,90)`;
- scroller: `clientHeight=110`, `scrollHeight=110`;
- `lastRpcError=null`;
- pending requests: `0`;
- root: `320x200`, `clientWidth=scrollWidth=320`;
- PNG: exactly `320x200`, then deleted.

## Classification and boundaries

- `standalone-diff-error-recovery`: missing coverage `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`; no code change was required.
- This proves recovery through a real filesystem repair and rendered Retry
  control, not a query-cache mutation or DOM event dispatch.
- Native cannot certify a `320x200` window; no Native runtime pass is claimed
  for this coverage-only loop.
- Every browser workflow ran through `bun run browser:run -- ...`.
- Final cleanup reported `sessions: []`, zero agent-browser-owned processes,
  free ports `58090` and `8891`, removed state/workspace/temp PNG, and
  repository screenshot count `100`.
